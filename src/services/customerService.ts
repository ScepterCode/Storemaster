/**
 * Customer Service
 * 
 * Handles all customer-related data operations including API synchronization and local storage management.
 * Implements the offline-first pattern where operations are saved locally first, then synced to the API.
 * 
 * @module customerService
 * 
 * Error Handling Pattern:
 * - All functions throw AppError with context on failure
 * - Network errors trigger local storage with sync queue
 * - Validation errors are thrown immediately
 * 
 * Sync Behavior:
 * - Create/Update operations attempt API sync first
 * - On API failure, data is saved locally with synced=false
 * - Failed operations are queued for later retry
 */

import { Customer } from '@/types';
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
 * @property {Customer} [data] - The customer data after the operation
 */
export interface SyncResult {
  success: boolean;
  synced: boolean;
  error?: Error;
  data?: Customer;
}

/**
 * Fetches customers from Supabase
 */
export const fetchCustomersFromAPI = async (userId?: string, organizationId?: string): Promise<Customer[]> => {
  validateUserId(userId, { operation: 'fetch', entityType: 'customer' });

  try {
    let query = supabase
      .from('customers')
      .select('*')
      .order('name') as any; // Type assertion to avoid TypeScript inference depth issue
    
    // Filter by organization if provided (RLS will also enforce this)
    if (organizationId) {
      query = query.eq('organization_id', organizationId);
    }

    const { data: customersData, error: customersError } = await query;

    if (customersError) {
      throw handleError(customersError, {
        operation: 'fetch',
        entityType: 'customer',
        userId
      });
    }

    if (customersData) {
      return customersData.map((customer) => ({
        id: customer.id,
        name: customer.name,
        phone: customer.phone || undefined,
        email: customer.email || undefined,
        address: customer.address || undefined,
        synced: true,
        lastModified: customer.updated_at || new Date().toISOString(),
      }));
    }

    return [];
  } catch (error) {
    throw handleError(error, {
      operation: 'fetch',
      entityType: 'customer',
      userId
    });
  }
};

/**
 * Creates a customer in Supabase
 */
export const createInAPI = async (customer: Customer, userId: string, organizationId: string): Promise<Customer> => {
  validateUserId(userId, { operation: 'create', entityType: 'customer', entityId: customer.id });

  if (!customer.name) {
    throw createValidationError(
      'Customer name is required',
      { operation: 'create', entityType: 'customer', entityId: customer.id }
    );
  }

  if (!organizationId) {
    throw createValidationError(
      'Organization ID is required',
      { operation: 'create', entityType: 'customer', entityId: customer.id }
    );
  }

  try {
    const { error } = await supabase.from('customers').insert({
      id: customer.id,
      name: customer.name,
      phone: customer.phone,
      email: customer.email,
      address: customer.address,
      user_id: userId,
      organization_id: organizationId
    });

    if (error) {
      throw handleError(error, {
        operation: 'create',
        entityType: 'customer',
        entityId: customer.id,
        userId
      });
    }

    return {
      ...customer,
      synced: true,
      lastModified: new Date().toISOString()
    };
  } catch (error) {
    throw handleError(error, {
      operation: 'create',
      entityType: 'customer',
      entityId: customer.id,
      userId
    });
  }
};

/**
 * Updates a customer in Supabase
 */
export const updateInAPI = async (customer: Customer): Promise<Customer> => {
  if (!customer.id) {
    throw createValidationError(
      'Customer ID is required for update',
      { operation: 'update', entityType: 'customer' }
    );
  }

  if (!customer.name) {
    throw createValidationError(
      'Customer name is required',
      { operation: 'update', entityType: 'customer', entityId: customer.id }
    );
  }

  try {
    const { error } = await supabase
      .from('customers')
      .update({
        name: customer.name,
        phone: customer.phone,
        email: customer.email,
        address: customer.address,
      })
      .eq('id', customer.id);

    if (error) {
      throw handleError(error, {
        operation: 'update',
        entityType: 'customer',
        entityId: customer.id
      });
    }

    return {
      ...customer,
      synced: true,
      lastModified: new Date().toISOString()
    };
  } catch (error) {
    throw handleError(error, {
      operation: 'update',
      entityType: 'customer',
      entityId: customer.id
    });
  }
};

/**
 * Deletes a customer from Supabase
 */
export const deleteFromAPI = async (customerId: string): Promise<void> => {
  if (!customerId) {
    throw createValidationError(
      'Customer ID is required for deletion',
      { operation: 'delete', entityType: 'customer' }
    );
  }

  try {
    const { error } = await supabase
      .from('customers')
      .delete()
      .eq('id', customerId);

    if (error) {
      throw handleError(error, {
        operation: 'delete',
        entityType: 'customer',
        entityId: customerId
      });
    }
  } catch (error) {
    throw handleError(error, {
      operation: 'delete',
      entityType: 'customer',
      entityId: customerId
    });
  }
};

/**
 * Gets the organization-scoped storage key for customers
 */
const getStorageKey = (organizationId?: string): string => {
  if (organizationId) {
    return `${STORAGE_KEYS.CUSTOMERS}_${organizationId}`;
  }
  return STORAGE_KEYS.CUSTOMERS;
};

/**
 * Gets customers from local storage
 */
export const getFromStorage = (organizationId?: string): Customer[] => {
  try {
    return storageManager.getItems<Customer>(getStorageKey(organizationId));
  } catch (error) {
    throw handleError(error, {
      operation: 'read',
      entityType: 'customer'
    });
  }
};

/**
 * Saves a customer to local storage
 */
export const saveToStorage = (customer: Customer, organizationId?: string): void => {
  try {
    storageManager.addItem<Customer>(getStorageKey(organizationId), customer);
  } catch (error) {
    throw handleError(error, {
      operation: 'save',
      entityType: 'customer',
      entityId: customer.id
    });
  }
};

/**
 * Updates a customer in local storage
 */
export const updateInStorage = (customer: Customer, organizationId?: string): void => {
  try {
    storageManager.updateItem<Customer>(getStorageKey(organizationId), customer);
  } catch (error) {
    throw handleError(error, {
      operation: 'update',
      entityType: 'customer',
      entityId: customer.id
    });
  }
};

/**
 * Deletes a customer from local storage
 */
export const deleteFromStorage = (customerId: string, organizationId?: string): void => {
  try {
    storageManager.deleteItem<Customer>(getStorageKey(organizationId), customerId);
  } catch (error) {
    throw handleError(error, {
      operation: 'delete',
      entityType: 'customer',
      entityId: customerId
    });
  }
};

/**
 * Synchronizes a customer entity with the API using offline-first pattern
 * 
 * Primary method for creating or updating customers. Attempts API sync first,
 * falls back to local storage with queue on failure.
 * 
 * @param {Customer} customer - The customer to sync (must include name)
 * @param {string} userId - The authenticated user's ID
 * @param {'create' | 'update'} operation - The type of operation to perform
 * @param {string} organizationId - The organization ID for multi-tenancy
 * @returns {Promise<SyncResult>} Result indicating success, sync status, and any errors
 * @throws {AppError} Only for critical errors (validation, auth, storage failures)
 */
export const syncEntity = async (
  customer: Customer,
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
    validateUserId(userId, { operation, entityType: 'customer', entityId: customer.id, userId });

    if (!customer.name) {
      throw createValidationError(
        'Customer name is required',
        { operation, entityType: 'customer', entityId: customer.id, userId }
      );
    }

    if (!organizationId) {
      throw createValidationError(
        'Organization ID is required',
        { operation, entityType: 'customer', entityId: customer.id, userId }
      );
    }

    // Prepare customer with sync metadata
    const customerToSync: Customer = {
      ...customer,
      synced: false,
      lastModified: new Date().toISOString(),
      syncAttempts: (customer.syncAttempts || 0) + 1,
    };

    // Try to sync with API first
    try {
      let syncedCustomer: Customer;

      if (operation === 'create') {
        syncedCustomer = await createInAPI(customerToSync, userId, organizationId);
      } else {
        syncedCustomer = await updateInAPI(customerToSync);
      }

      // API sync successful - update storage with synced status
      if (operation === 'create') {
        saveToStorage(syncedCustomer, organizationId);
      } else {
        updateInStorage(syncedCustomer, organizationId);
      }

      result.success = true;
      result.synced = true;
      result.data = syncedCustomer;

      return result;
    } catch (apiError) {
      // API sync failed - save locally and queue for later sync
      console.warn(`Failed to sync customer to API, saving locally:`, apiError);

      const errorMessage = apiError instanceof Error ? apiError.message : 'Unknown error';
      const customerWithError: Customer = {
        ...customerToSync,
        lastSyncError: errorMessage,
      };

      // Save to local storage
      if (operation === 'create') {
        saveToStorage(customerWithError, organizationId);
      } else {
        updateInStorage(customerWithError, organizationId);
      }

      // Queue for sync
      const syncOperation: SyncQueueItem = {
        id: generateId(),
        entityType: 'customer',
        entityId: customer.id,
        operation,
        data: customerWithError,
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
      result.data = customerWithError;
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
      entityType: 'customer',
      entityId: customer.id,
      userId
    });
  }
};
