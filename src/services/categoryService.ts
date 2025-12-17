/**
 * Category Service
 * 
 * Handles all category-related data operations including API synchronization and local storage management.
 * Implements the offline-first pattern where operations are saved locally first, then synced to the API.
 * 
 * @module categoryService
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

import { Category } from '@/types';
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
 * @property {Category} [data] - The category data after the operation
 */
export interface SyncResult {
  success: boolean;
  synced: boolean;
  error?: Error;
  data?: Category;
}

/**
 * Fetches all categories from the Supabase API
 * 
 * @param {string} [userId] - The authenticated user's ID (required for data access)
 * @param {string} [organizationId] - The organization ID to filter categories (required for multi-tenancy)
 * @returns {Promise<Category[]>} Array of categories with sync metadata
 * @throws {AppError} If user is not authenticated or API request fails
 */
export const fetchCategoriesFromAPI = async (userId?: string, organizationId?: string): Promise<Category[]> => {
  validateUserId(userId, { operation: 'fetch', entityType: 'category' });
  
  try {
    let query = supabase
      .from('categories')
      .select('*')
      .order('name') as any; // Type assertion to avoid TypeScript inference depth issue
    
    // Filter by organization if provided (RLS will also enforce this)
    if (organizationId) {
      query = query.eq('organization_id', organizationId);
    }
      
    const { data: categoriesData, error: categoriesError } = await query;
      
    if (categoriesError) {
      throw handleError(categoriesError, {
        operation: 'fetch',
        entityType: 'category',
        userId
      });
    }
    
    if (categoriesData) {
      return categoriesData.map(category => ({
        id: category.id,
        name: category.name,
        description: category.description || undefined,
        synced: true,
        lastModified: category.updated_at || new Date().toISOString(),
      }));
    }
    
    return [];
  } catch (error) {
    throw handleError(error, {
      operation: 'fetch',
      entityType: 'category',
      userId
    });
  }
};

/**
 * Creates a category in Supabase
 */
export const createInAPI = async (category: Category, userId: string, organizationId: string): Promise<Category> => {
  validateUserId(userId, { operation: 'create', entityType: 'category', entityId: category.id });

  if (!category.name) {
    throw createValidationError(
      'Category name is required',
      { operation: 'create', entityType: 'category', entityId: category.id }
    );
  }

  if (!organizationId) {
    throw createValidationError(
      'Organization ID is required',
      { operation: 'create', entityType: 'category', entityId: category.id }
    );
  }
  
  try {
    const { error } = await supabase
      .from('categories')
      .insert({
        id: category.id,
        name: category.name,
        description: category.description,
        organization_id: organizationId
      });
      
    if (error) {
      console.error('Supabase error creating category:', error);
      throw handleError(error, {
        operation: 'create',
        entityType: 'category',
        entityId: category.id,
        userId
      });
    }
    
    return { 
      ...category, 
      synced: true,
      lastModified: new Date().toISOString()
    };
  } catch (error) {
    throw handleError(error, {
      operation: 'create',
      entityType: 'category',
      entityId: category.id,
      userId
    });
  }
};

/**
 * Updates a category in Supabase
 */
export const updateInAPI = async (category: Category): Promise<Category> => {
  if (!category.id) {
    throw createValidationError(
      'Category ID is required for update',
      { operation: 'update', entityType: 'category' }
    );
  }

  if (!category.name) {
    throw createValidationError(
      'Category name is required',
      { operation: 'update', entityType: 'category', entityId: category.id }
    );
  }
  
  try {
    const { error } = await supabase
      .from('categories')
      .update({
        name: category.name,
        description: category.description,
      })
      .eq('id', category.id);
      
    if (error) {
      throw handleError(error, {
        operation: 'update',
        entityType: 'category',
        entityId: category.id
      });
    }
    
    return { 
      ...category, 
      synced: true,
      lastModified: new Date().toISOString()
    };
  } catch (error) {
    throw handleError(error, {
      operation: 'update',
      entityType: 'category',
      entityId: category.id
    });
  }
};

/**
 * Deletes a category from Supabase
 */
export const deleteFromAPI = async (categoryId: string): Promise<void> => {
  if (!categoryId) {
    throw createValidationError(
      'Category ID is required for deletion',
      { operation: 'delete', entityType: 'category' }
    );
  }
  
  try {
    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', categoryId);
      
    if (error) {
      throw handleError(error, {
        operation: 'delete',
        entityType: 'category',
        entityId: categoryId
      });
    }
  } catch (error) {
    throw handleError(error, {
      operation: 'delete',
      entityType: 'category',
      entityId: categoryId
    });
  }
};

/**
 * Gets the organization-scoped storage key for categories
 */
const getStorageKey = (organizationId?: string): string => {
  if (organizationId) {
    return `${STORAGE_KEYS.CATEGORIES}_${organizationId}`;
  }
  return STORAGE_KEYS.CATEGORIES;
};

/**
 * Gets categories from local storage
 */
export const getFromStorage = (organizationId?: string): Category[] => {
  try {
    return storageManager.getItems<Category>(getStorageKey(organizationId));
  } catch (error) {
    throw handleError(error, {
      operation: 'read',
      entityType: 'category'
    });
  }
};

/**
 * Saves a category to local storage
 */
export const saveToStorage = (category: Category, organizationId?: string): void => {
  try {
    storageManager.addItem<Category>(getStorageKey(organizationId), category);
  } catch (error) {
    throw handleError(error, {
      operation: 'save',
      entityType: 'category',
      entityId: category.id
    });
  }
};

/**
 * Updates a category in local storage
 */
export const updateInStorage = (category: Category, organizationId?: string): void => {
  try {
    storageManager.updateItem<Category>(getStorageKey(organizationId), category);
  } catch (error) {
    throw handleError(error, {
      operation: 'update',
      entityType: 'category',
      entityId: category.id
    });
  }
};

/**
 * Deletes a category from local storage
 */
export const deleteFromStorage = (categoryId: string, organizationId?: string): void => {
  try {
    storageManager.deleteItem<Category>(getStorageKey(organizationId), categoryId);
  } catch (error) {
    throw handleError(error, {
      operation: 'delete',
      entityType: 'category',
      entityId: categoryId
    });
  }
};

/**
 * Synchronizes a category entity with the API using offline-first pattern
 * 
 * Primary method for creating or updating categories. Attempts API sync first,
 * falls back to local storage with queue on failure.
 * 
 * @param {Category} category - The category to sync (must include name)
 * @param {string} userId - The authenticated user's ID
 * @param {'create' | 'update'} operation - The type of operation to perform
 * @param {string} organizationId - The organization ID for multi-tenancy
 * @returns {Promise<SyncResult>} Result indicating success, sync status, and any errors
 * @throws {AppError} Only for critical errors (validation, auth, storage failures)
 */
export const syncEntity = async (
  category: Category,
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
    validateUserId(userId, { operation, entityType: 'category', entityId: category.id, userId });

    if (!category.name) {
      throw createValidationError(
        'Category name is required',
        { operation, entityType: 'category', entityId: category.id, userId }
      );
    }

    if (!organizationId) {
      throw createValidationError(
        'Organization ID is required',
        { operation, entityType: 'category', entityId: category.id, userId }
      );
    }

    // Prepare category with sync metadata
    const categoryToSync: Category = {
      ...category,
      synced: false,
      lastModified: new Date().toISOString(),
      syncAttempts: (category.syncAttempts || 0) + 1,
    };

    // Try to sync with API first
    try {
      let syncedCategory: Category;
      
      if (operation === 'create') {
        syncedCategory = await createInAPI(categoryToSync, userId, organizationId);
      } else {
        syncedCategory = await updateInAPI(categoryToSync);
      }

      // API sync successful - update storage with synced status
      if (operation === 'create') {
        saveToStorage(syncedCategory, organizationId);
      } else {
        updateInStorage(syncedCategory, organizationId);
      }

      result.success = true;
      result.synced = true;
      result.data = syncedCategory;
      
      return result;
    } catch (apiError) {
      // API sync failed - save locally and queue for later sync
      console.error(`Failed to sync category to API, saving locally:`, apiError);
      console.error('Error details:', JSON.stringify(apiError, null, 2));
      
      const errorMessage = apiError instanceof Error ? apiError.message : 'Unknown error';
      const categoryWithError: Category = {
        ...categoryToSync,
        lastSyncError: errorMessage,
      };

      // Save to local storage
      if (operation === 'create') {
        saveToStorage(categoryWithError, organizationId);
      } else {
        updateInStorage(categoryWithError, organizationId);
      }

      // Queue for sync
      const syncOperation: SyncQueueItem = {
        id: generateId(),
        entityType: 'category',
        entityId: category.id,
        operation,
        data: categoryWithError,
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
      result.data = categoryWithError;
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
      entityType: 'category',
      entityId: category.id,
      userId
    });
  }
};
