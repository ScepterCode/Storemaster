/**
 * Product Service
 * 
 * Handles all product-related data operations including API synchronization and local storage management.
 * Implements the offline-first pattern where operations are saved locally first, then synced to the API.
 * 
 * @module productService
 * 
 * Error Handling Pattern:
 * - All functions throw AppError with context on failure
 * - Network errors trigger local storage with sync queue
 * - Validation errors are thrown immediately
 * - All errors include operation context for debugging
 * 
 * Sync Behavior:
 * - Create/Update operations attempt API sync first
 * - On API failure, data is saved locally with synced=false
 * - Failed operations are queued for later retry
 * - Sync queue supports exponential backoff retry logic
 */

import { Product } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { STORAGE_KEYS } from '@/lib/offlineStorage';
import storageManager, { SyncQueueItem } from '@/lib/storageManager';
import { handleError, createValidationError, validateUserId } from '@/lib/errorHandler';
import { generateId } from '@/lib/formatter';

/**
 * Result of a sync operation
 * 
 * @property {boolean} success - Whether the operation completed without critical errors
 * @property {boolean} synced - Whether the data was successfully synced to the API
 * @property {Error} [error] - Error object if sync failed (operation may still succeed locally)
 * @property {Product} [data] - The product data after the operation
 */
export interface SyncResult {
  success: boolean;
  synced: boolean;
  error?: Error;
  data?: Product;
}

/**
 * Fetches all products from the Supabase API
 * 
 * @param {string} [userId] - The authenticated user's ID (required for data access)
 * @param {string} [organizationId] - The organization ID to filter products (required for multi-tenancy)
 * @returns {Promise<Product[]>} Array of products with sync metadata
 * @throws {AppError} If user is not authenticated or API request fails
 * 
 * @example
 * const products = await fetchProductsFromAPI(user.id, organization.id);
 */
export const fetchProductsFromAPI = async (userId?: string, organizationId?: string): Promise<Product[]> => {
  validateUserId(userId, { operation: 'fetch', entityType: 'product' });
  
  try {
    let query = supabase
      .from('products')
      .select(`
        *,
        categories!category_id(id, name)
      `)
      .order('name') as any; // Type assertion to avoid TypeScript inference depth issue
    
    // Filter by organization if provided (RLS will also enforce this)
    if (organizationId) {
      query = query.eq('organization_id', organizationId);
    }
      
    const { data: productsData, error: productsError } = await query;
      
    if (productsError) {
      throw handleError(productsError, {
        operation: 'fetch',
        entityType: 'product',
        userId
      });
    }
    
    if (productsData) {
      return productsData.map(product => ({
        id: product.id,
        name: product.name,
        quantity: product.quantity,
        unitPrice: product.unit_price, // Fixed: use unit_price from database
        category: product.category_id, // Store category_id for filtering
        category_id: product.category_id,
        categoryName: product.categories?.name,
        description: product.description || undefined,
        synced: true,
        lastModified: product.updated_at || new Date().toISOString(),
      }));
    }
    
    return [];
  } catch (error) {
    throw handleError(error, {
      operation: 'fetch',
      entityType: 'product',
      userId
    });
  }
};

/**
 * Creates a new product in the Supabase API
 * 
 * @param {Product} product - The product to create (must include name and unitPrice)
 * @param {string} userId - The authenticated user's ID
 * @param {string} organizationId - The organization ID to associate with the product
 * @returns {Promise<Product>} The created product with synced=true and updated timestamp
 * @throws {AppError} If validation fails, user is not authenticated, or API request fails
 * 
 * @example
 * const newProduct = await createInAPI({ id: '123', name: 'Widget', unitPrice: 10, quantity: 100 }, user.id, organization.id);
 */
export const createInAPI = async (product: Product, userId: string, organizationId: string): Promise<Product> => {
  validateUserId(userId, { operation: 'create', entityType: 'product', entityId: product.id });

  if (!product.name || product.unitPrice === undefined) {
    throw createValidationError(
      'Product name and unit price are required',
      { operation: 'create', entityType: 'product', entityId: product.id }
    );
  }

  if (!organizationId) {
    throw createValidationError(
      'Organization ID is required',
      { operation: 'create', entityType: 'product', entityId: product.id }
    );
  }
  
  try {
    const { error } = await supabase
      .from('products')
      .insert({
        id: product.id,
        name: product.name,
        quantity: product.quantity,
        unit_price: product.unitPrice,
        category: product.category, // Keep for backwards compatibility
        category_id: product.category_id,
        description: product.description,
        organization_id: organizationId
      } as any);
      
    if (error) {
      throw handleError(error, {
        operation: 'create',
        entityType: 'product',
        entityId: product.id,
        userId
      });
    }
    
    return { 
      ...product, 
      synced: true,
      lastModified: new Date().toISOString()
    };
  } catch (error) {
    throw handleError(error, {
      operation: 'create',
      entityType: 'product',
      entityId: product.id,
      userId
    });
  }
};

/**
 * Updates an existing product in the Supabase API with optimistic locking
 * 
 * Implements optimistic concurrency control to prevent lost updates when multiple users
 * edit the same product simultaneously.
 * 
 * @param {Product} product - The product to update (must include id, name, and unitPrice)
 * @param {string} [expectedLastModified] - Expected last modified timestamp for conflict detection
 * @returns {Promise<Product>} The updated product with synced=true and new timestamp
 * @throws {AppError} If validation fails, concurrent modification detected, or API request fails
 * 
 * @example
 * const updated = await updateInAPI(product, product.lastModified);
 */
export const updateInAPI = async (product: Product, expectedLastModified?: string): Promise<Product> => {
  if (!product.id) {
    throw createValidationError(
      'Product ID is required for update',
      { operation: 'update', entityType: 'product' }
    );
  }

  if (!product.name || product.unitPrice === undefined) {
    throw createValidationError(
      'Product name and unit price are required',
      { operation: 'update', entityType: 'product', entityId: product.id }
    );
  }
  
  try {
    // If expectedLastModified is provided, check for concurrent updates
    if (expectedLastModified) {
      const { data: currentProduct, error: fetchError } = await supabase
        .from('products')
        .select('updated_at')
        .eq('id', product.id)
        .single();
      
      if (fetchError) {
        throw handleError(fetchError, {
          operation: 'update',
          entityType: 'product',
          entityId: product.id
        });
      }
      
      // Check if the product was modified by another user
      if (currentProduct && currentProduct.updated_at !== expectedLastModified) {
        throw createValidationError(
          'Product was modified by another user. Please refresh and try again.',
          { operation: 'update', entityType: 'product', entityId: product.id }
        );
      }
    }

    const { error } = await supabase
      .from('products')
      .update({
        name: product.name,
        quantity: product.quantity,
        unit_price: product.unitPrice,
        category: product.category, // Keep for backwards compatibility
        category_id: product.category_id,
        description: product.description,
      } as any)
      .eq('id', product.id);
      
    if (error) {
      throw handleError(error, {
        operation: 'update',
        entityType: 'product',
        entityId: product.id
      });
    }
    
    return { 
      ...product, 
      synced: true,
      lastModified: new Date().toISOString()
    };
  } catch (error) {
    throw handleError(error, {
      operation: 'update',
      entityType: 'product',
      entityId: product.id
    });
  }
};

/**
 * Deletes a product from the Supabase API
 * 
 * @param {string} productId - The ID of the product to delete
 * @returns {Promise<void>}
 * @throws {AppError} If product ID is missing or API request fails
 * 
 * @example
 * await deleteFromAPI('product-123');
 */
export const deleteFromAPI = async (productId: string): Promise<void> => {
  if (!productId) {
    throw createValidationError(
      'Product ID is required for deletion',
      { operation: 'delete', entityType: 'product' }
    );
  }
  
  try {
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', productId);
      
    if (error) {
      throw handleError(error, {
        operation: 'delete',
        entityType: 'product',
        entityId: productId
      });
    }
  } catch (error) {
    throw handleError(error, {
      operation: 'delete',
      entityType: 'product',
      entityId: productId
    });
  }
};

/**
 * Gets the organization-scoped storage key for products
 * 
 * @param {string} [organizationId] - The organization ID to scope the storage key
 * @returns {string} The scoped storage key
 */
const getStorageKey = (organizationId?: string): string => {
  if (organizationId) {
    return `${STORAGE_KEYS.INVENTORY}_${organizationId}`;
  }
  return STORAGE_KEYS.INVENTORY;
};

/**
 * Retrieves all products from local storage
 * 
 * @param {string} [organizationId] - The organization ID to scope the storage
 * @returns {Product[]} Array of products from localStorage
 * @throws {AppError} If storage read fails or data is corrupted
 * 
 * @example
 * const localProducts = getFromStorage(organization.id);
 */
export const getFromStorage = (organizationId?: string): Product[] => {
  try {
    return storageManager.getItems<Product>(getStorageKey(organizationId));
  } catch (error) {
    throw handleError(error, {
      operation: 'read',
      entityType: 'product'
    });
  }
};

/**
 * Saves a new product to local storage
 * 
 * @param {Product} product - The product to save
 * @param {string} [organizationId] - The organization ID to scope the storage
 * @returns {void}
 * @throws {AppError} If storage write fails
 * 
 * @example
 * saveToStorage(newProduct, organization.id);
 */
export const saveToStorage = (product: Product, organizationId?: string): void => {
  try {
    storageManager.addItem<Product>(getStorageKey(organizationId), product);
  } catch (error) {
    throw handleError(error, {
      operation: 'save',
      entityType: 'product',
      entityId: product.id
    });
  }
};

/**
 * Updates an existing product in local storage
 * 
 * @param {Product} product - The product to update (must include id)
 * @param {string} [organizationId] - The organization ID to scope the storage
 * @returns {void}
 * @throws {AppError} If storage write fails
 * 
 * @example
 * updateInStorage(updatedProduct, organization.id);
 */
export const updateInStorage = (product: Product, organizationId?: string): void => {
  try {
    storageManager.updateItem<Product>(getStorageKey(organizationId), product);
  } catch (error) {
    throw handleError(error, {
      operation: 'update',
      entityType: 'product',
      entityId: product.id
    });
  }
};

/**
 * Deletes a product from local storage
 * 
 * @param {string} productId - The ID of the product to delete
 * @param {string} [organizationId] - The organization ID to scope the storage
 * @returns {void}
 * @throws {AppError} If storage write fails
 * 
 * @example
 * deleteFromStorage('product-123', organization.id);
 */
export const deleteFromStorage = (productId: string, organizationId?: string): void => {
  try {
    storageManager.deleteItem<Product>(getStorageKey(organizationId), productId);
  } catch (error) {
    throw handleError(error, {
      operation: 'delete',
      entityType: 'product',
      entityId: productId
    });
  }
};

/**
 * Synchronizes a product entity with the API using offline-first pattern
 * 
 * This is the primary method for creating or updating products. It implements the offline-first
 * pattern by attempting API sync first, then falling back to local storage with queue on failure.
 * 
 * Sync Behavior:
 * 1. Validates user authentication and product data
 * 2. Attempts to sync with API (create or update)
 * 3. On success: Updates local storage with synced=true
 * 4. On failure: Saves locally with synced=false and queues for retry
 * 5. Returns SyncResult indicating success and sync status
 * 
 * @param {Product} product - The product to sync (must include name and unitPrice)
 * @param {string} userId - The authenticated user's ID
 * @param {'create' | 'update'} operation - The type of operation to perform
 * @param {string} organizationId - The organization ID for multi-tenancy
 * @returns {Promise<SyncResult>} Result indicating success, sync status, and any errors
 * @throws {AppError} Only for critical errors (validation, auth, storage failures)
 * 
 * @example
 * // Create new product
 * const result = await syncEntity(newProduct, user.id, 'create', organization.id);
 * if (result.success && !result.synced) {
 *   toast.info('Saved locally, will sync when online');
 * }
 * 
 * @example
 * // Update existing product
 * const result = await syncEntity(updatedProduct, user.id, 'update', organization.id);
 * if (result.success && result.synced) {
 *   toast.success('Product updated and synced');
 * }
 */
export const syncEntity = async (
  product: Product,
  userId: string,
  operation: 'create' | 'update',
  organizationId: string
): Promise<SyncResult> => {
  const result: SyncResult = {
    success: false,
    synced: false,
  };

  try {
    // Validate inputs
    validateUserId(userId, { operation, entityType: 'product', entityId: product.id, userId });

    if (!product.name || product.unitPrice === undefined) {
      throw createValidationError(
        'Product name and unit price are required',
        { operation, entityType: 'product', entityId: product.id, userId }
      );
    }

    if (!organizationId) {
      throw createValidationError(
        'Organization ID is required',
        { operation, entityType: 'product', entityId: product.id, userId }
      );
    }

    // Prepare product with sync metadata
    const productToSync: Product = {
      ...product,
      synced: false,
      lastModified: new Date().toISOString(),
      syncAttempts: (product.syncAttempts || 0) + 1,
    };

    // Try to sync with API first
    try {
      let syncedProduct: Product;
      
      if (operation === 'create') {
        syncedProduct = await createInAPI(productToSync, userId, organizationId);
      } else {
        // For updates, pass the original lastModified for optimistic locking
        syncedProduct = await updateInAPI(productToSync, product.lastModified);
      }

      // API sync successful - update storage with synced status
      if (operation === 'create') {
        saveToStorage(syncedProduct, organizationId);
      } else {
        updateInStorage(syncedProduct, organizationId);
      }

      result.success = true;
      result.synced = true;
      result.data = syncedProduct;
      
      return result;
    } catch (apiError) {
      // API sync failed - save locally and queue for later sync
      console.warn(`Failed to sync product to API, saving locally:`, apiError);
      
      const errorMessage = apiError instanceof Error ? apiError.message : 'Unknown error';
      const productWithError: Product = {
        ...productToSync,
        lastSyncError: errorMessage,
      };

      // Save to local storage
      if (operation === 'create') {
        saveToStorage(productWithError, organizationId);
      } else {
        updateInStorage(productWithError, organizationId);
      }

      // Queue for sync
      const syncOperation: SyncQueueItem = {
        id: generateId(),
        entityType: 'product',
        entityId: product.id,
        operation,
        data: productWithError,
        userId,
        timestamp: new Date().toISOString(),
        retryCount: 0,
        maxRetries: 3,
        status: 'pending',
        lastError: errorMessage,
      };
      
      storageManager.queueSync(syncOperation);

      result.success = true;
      result.synced = false;
      result.data = productWithError;
      result.error = apiError instanceof Error ? apiError : new Error(errorMessage);
      
      return result;
    }
  } catch (error) {
    // Critical error (validation, auth, or storage error)
    result.success = false;
    result.synced = false;
    result.error = error instanceof Error ? error : new Error('Unknown error');
    
    throw handleError(error, {
      operation,
      entityType: 'product',
      entityId: product.id,
      userId
    });
  }
};
