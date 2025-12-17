/**
 * Transaction Service
 * 
 * Handles all transaction-related data operations including API synchronization and local storage management.
 * Implements the offline-first pattern where operations are saved locally first, then synced to the API.
 * Includes validation for transaction data integrity.
 * 
 * @module transactionService
 * 
 * Error Handling Pattern:
 * - All functions throw AppError with context on failure
 * - Network errors trigger local storage with sync queue
 * - Validation errors are thrown immediately
 * - Validates amount, description, date, and type before operations
 * 
 * Sync Behavior:
 * - Create/Update operations attempt API sync first
 * - On API failure, data is saved locally with synced=false
 * - Failed operations are queued for later retry
 */

import { Transaction } from '@/types';
import { StaffTransaction } from "@/types/manager";
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
 * @property {Transaction} [data] - The transaction data after the operation
 */
export interface SyncResult {
  success: boolean;
  synced: boolean;
  error?: Error;
  data?: Transaction;
}

/**
 * Validates transaction data for integrity
 * 
 * Ensures all required fields are present and valid before persisting.
 * 
 * @param {Partial<Transaction>} transaction - The transaction to validate
 * @throws {AppError} If validation fails with specific error message
 * 
 * Validation Rules:
 * - amount must be greater than 0
 * - description must be non-empty string
 * - date must be present
 * - type must be 'sale', 'purchase', or 'expense'
 */
const validateTransaction = (transaction: Partial<Transaction>): void => {
  if (!transaction.amount || transaction.amount <= 0) {
    throw createValidationError(
      'Transaction amount must be greater than 0',
      { operation: 'validate', entityType: 'transaction' }
    );
  }

  if (!transaction.description || transaction.description.trim().length === 0) {
    throw createValidationError(
      'Transaction description is required',
      { operation: 'validate', entityType: 'transaction' }
    );
  }

  if (!transaction.date) {
    throw createValidationError(
      'Transaction date is required',
      { operation: 'validate', entityType: 'transaction' }
    );
  }

  if (!transaction.type || !['sale', 'purchase', 'expense'].includes(transaction.type)) {
    throw createValidationError(
      'Transaction type must be sale, purchase, or expense',
      { operation: 'validate', entityType: 'transaction' }
    );
  }
};

/**
 * Fetches transactions from Supabase
 * 
 * @param {string} [userId] - The authenticated user's ID (required for data access)
 * @param {string} [organizationId] - The organization ID to filter transactions (required for multi-tenancy)
 * @returns {Promise<Transaction[]>} Array of transactions with sync metadata
 * @throws {AppError} If user is not authenticated or API request fails
 */
export const fetchFromAPI = async (userId?: string, organizationId?: string): Promise<Transaction[]> => {
  validateUserId(userId, { operation: 'fetch', entityType: 'transaction' });
  
  try {
    // Build query with organization filter if provided (RLS will also enforce this)
    let query = supabase
      .from('transactions')
      .select('*')
      .order('date', { ascending: false }) as any; // Type assertion to avoid TypeScript inference depth issue
    
    if (organizationId) {
      query = query.eq('organization_id', organizationId);
    }
      
    const { data, error } = await query;
      
    if (error) {
      throw handleError(error, {
        operation: 'fetch',
        entityType: 'transaction',
        userId
      });
    }
    
    if (data) {
      return data.map(item => ({
        id: item.id,
        amount: Number(item.amount),
        description: item.description || '',
        date: item.date,
        type: item.type as 'sale' | 'purchase' | 'expense',
        category: item.category || undefined,
        reference: item.reference || undefined,
        synced: true,
        lastModified: item.updated_at || new Date().toISOString(),
      }));
    }
    
    return [];
  } catch (error) {
    throw handleError(error, {
      operation: 'fetch',
      entityType: 'transaction',
      userId
    });
  }
};

/**
 * Creates a transaction in Supabase
 * 
 * @param {Transaction} transaction - The transaction to create
 * @param {string} userId - The authenticated user's ID
 * @param {string} organizationId - The organization ID for multi-tenancy (required)
 * @returns {Promise<Transaction>} The created transaction with sync metadata
 * @throws {AppError} If validation fails or API request fails
 */
export const createInAPI = async (transaction: Transaction, userId: string, organizationId: string): Promise<Transaction> => {
  validateUserId(userId, { operation: 'create', entityType: 'transaction', entityId: transaction.id });

  validateTransaction(transaction);

  if (!organizationId) {
    throw createValidationError(
      'Organization ID is required',
      { operation: 'create', entityType: 'transaction', entityId: transaction.id }
    );
  }
  
  try {
    const { error } = await supabase
      .from('transactions')
      .insert({
        id: transaction.id,
        amount: transaction.amount,
        description: transaction.description,
        date: transaction.date,
        type: transaction.type,
        category: transaction.category,
        reference: transaction.reference,
        user_id: userId,
        organization_id: organizationId
      });
      
    if (error) {
      throw handleError(error, {
        operation: 'create',
        entityType: 'transaction',
        entityId: transaction.id,
        userId
      });
    }
    
    return { 
      ...transaction, 
      synced: true,
      lastModified: new Date().toISOString()
    };
  } catch (error) {
    throw handleError(error, {
      operation: 'create',
      entityType: 'transaction',
      entityId: transaction.id,
      userId
    });
  }
};

/**
 * Updates a transaction in Supabase
 * 
 * @param {Transaction} transaction - The transaction to update (must have id)
 * @returns {Promise<Transaction>} The updated transaction with sync metadata
 * @throws {AppError} If validation fails or API request fails
 * 
 * Note: Organization ID is not needed for updates as RLS policies enforce access control
 */
export const updateInAPI = async (transaction: Transaction): Promise<Transaction> => {
  if (!transaction.id) {
    throw createValidationError(
      'Transaction ID is required for update',
      { operation: 'update', entityType: 'transaction' }
    );
  }

  validateTransaction(transaction);
  
  try {
    const { error } = await supabase
      .from('transactions')
      .update({
        amount: transaction.amount,
        description: transaction.description,
        date: transaction.date,
        type: transaction.type,
        category: transaction.category,
        reference: transaction.reference,
      })
      .eq('id', transaction.id);
      
    if (error) {
      throw handleError(error, {
        operation: 'update',
        entityType: 'transaction',
        entityId: transaction.id
      });
    }
    
    return { 
      ...transaction, 
      synced: true,
      lastModified: new Date().toISOString()
    };
  } catch (error) {
    throw handleError(error, {
      operation: 'update',
      entityType: 'transaction',
      entityId: transaction.id
    });
  }
};

/**
 * Deletes a transaction from Supabase
 * 
 * @param {string} transactionId - The ID of the transaction to delete
 * @throws {AppError} If validation fails or API request fails
 * 
 * Note: Organization ID is not needed for deletes as RLS policies enforce access control
 */
export const deleteFromAPI = async (transactionId: string): Promise<void> => {
  if (!transactionId) {
    throw createValidationError(
      'Transaction ID is required for deletion',
      { operation: 'delete', entityType: 'transaction' }
    );
  }
  
  try {
    const { error } = await supabase
      .from('transactions')
      .delete()
      .eq('id', transactionId);
      
    if (error) {
      throw handleError(error, {
        operation: 'delete',
        entityType: 'transaction',
        entityId: transactionId
      });
    }
  } catch (error) {
    throw handleError(error, {
      operation: 'delete',
      entityType: 'transaction',
      entityId: transactionId
    });
  }
};

/**
 * Gets the organization-scoped storage key for transactions
 * 
 * @param {string} [organizationId] - The organization ID to scope the storage key
 * @returns {string} The scoped storage key
 * 
 * Multi-tenant storage strategy:
 * - Each organization's data is stored under a separate key
 * - Format: transactions_{organizationId}
 * - Prevents data leakage between organizations
 */
const getStorageKey = (organizationId?: string): string => {
  if (organizationId) {
    return `${STORAGE_KEYS.TRANSACTIONS}_${organizationId}`;
  }
  return STORAGE_KEYS.TRANSACTIONS;
};

/**
 * Gets transactions from local storage
 * 
 * @param {string} [organizationId] - The organization ID to scope the storage (required for multi-tenancy)
 * @returns {Transaction[]} Array of transactions from local storage
 * @throws {AppError} If storage read fails
 */
export const getFromStorage = (organizationId?: string): Transaction[] => {
  try {
    return storageManager.getItems<Transaction>(getStorageKey(organizationId));
  } catch (error) {
    throw handleError(error, {
      operation: 'read',
      entityType: 'transaction'
    });
  }
};

/**
 * Saves a transaction to local storage
 * 
 * @param {Transaction} transaction - The transaction to save
 * @param {string} [organizationId] - The organization ID to scope the storage (required for multi-tenancy)
 * @throws {AppError} If storage write fails
 */
export const saveToStorage = (transaction: Transaction, organizationId?: string): void => {
  try {
    storageManager.addItem<Transaction>(getStorageKey(organizationId), transaction);
  } catch (error) {
    throw handleError(error, {
      operation: 'save',
      entityType: 'transaction',
      entityId: transaction.id
    });
  }
};

/**
 * Updates a transaction in local storage
 * 
 * @param {Transaction} transaction - The transaction to update
 * @param {string} [organizationId] - The organization ID to scope the storage (required for multi-tenancy)
 * @throws {AppError} If storage update fails
 */
export const updateInStorage = (transaction: Transaction, organizationId?: string): void => {
  try {
    storageManager.updateItem<Transaction>(getStorageKey(organizationId), transaction);
  } catch (error) {
    throw handleError(error, {
      operation: 'update',
      entityType: 'transaction',
      entityId: transaction.id
    });
  }
};

/**
 * Deletes a transaction from local storage
 * 
 * @param {string} transactionId - The ID of the transaction to delete
 * @param {string} [organizationId] - The organization ID to scope the storage (required for multi-tenancy)
 * @throws {AppError} If storage delete fails
 */
export const deleteFromStorage = (transactionId: string, organizationId?: string): void => {
  try {
    storageManager.deleteItem<Transaction>(getStorageKey(organizationId), transactionId);
  } catch (error) {
    throw handleError(error, {
      operation: 'delete',
      entityType: 'transaction',
      entityId: transactionId
    });
  }
};

/**
 * Synchronizes a transaction entity with the API using offline-first pattern
 * 
 * Primary method for creating or updating transactions. Attempts API sync first,
 * falls back to local storage with queue on failure. Validates transaction data before sync.
 * 
 * @param {Transaction} transaction - The transaction to sync (must pass validation)
 * @param {string} userId - The authenticated user's ID
 * @param {'create' | 'update'} operation - The type of operation to perform
 * @param {string} organizationId - The organization ID for multi-tenancy
 * @returns {Promise<SyncResult>} Result indicating success, sync status, and any errors
 * @throws {AppError} Only for critical errors (validation, auth, storage failures)
 */
export const syncEntity = async (
  transaction: Transaction,
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
    validateUserId(userId, { operation, entityType: 'transaction', entityId: transaction.id, userId });

    validateTransaction(transaction);

    if (!organizationId) {
      throw createValidationError(
        'Organization ID is required',
        { operation, entityType: 'transaction', entityId: transaction.id, userId }
      );
    }

    // Prepare transaction with sync metadata
    const transactionToSync: Transaction = {
      ...transaction,
      synced: false,
      lastModified: new Date().toISOString(),
      syncAttempts: (transaction.syncAttempts || 0) + 1,
    };

    // Try to sync with API first
    try {
      let syncedTransaction: Transaction;
      
      if (operation === 'create') {
        syncedTransaction = await createInAPI(transactionToSync, userId, organizationId);
      } else {
        syncedTransaction = await updateInAPI(transactionToSync);
      }

      // API sync successful - update storage with synced status
      if (operation === 'create') {
        saveToStorage(syncedTransaction, organizationId);
      } else {
        updateInStorage(syncedTransaction, organizationId);
      }

      result.success = true;
      result.synced = true;
      result.data = syncedTransaction;
      
      return result;
    } catch (apiError) {
      // API sync failed - save locally and queue for later sync
      console.warn(`Failed to sync transaction to API, saving locally:`, apiError);
      
      const errorMessage = apiError instanceof Error ? apiError.message : 'Unknown error';
      const transactionWithError: Transaction = {
        ...transactionToSync,
        lastSyncError: errorMessage,
      };

      // Save to local storage
      if (operation === 'create') {
        saveToStorage(transactionWithError, organizationId);
      } else {
        updateInStorage(transactionWithError, organizationId);
      }

      // Queue for sync
      const syncOperation: SyncQueueItem = {
        id: generateId(),
        entityType: 'transaction',
        entityId: transaction.id,
        operation,
        data: transactionWithError,
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
      result.data = transactionWithError;
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
      entityType: 'transaction',
      entityId: transaction.id,
      userId
    });
  }
};

// Legacy functions for backward compatibility with manager components
export const validateString = (value: string, fallback: string): string => {
  if (typeof value === "string" && value.trim().length > 0) {
    return value.trim();
  }
  return fallback;
};

export const validateDate = (dateStr: string): string => {
  if (typeof dateStr === "string" && dateStr.trim().length >= 10) {
    const date = new Date(dateStr.trim());
    if (!isNaN(date.getTime())) {
      return dateStr.trim();
    }
  }
  return new Date().toISOString().split("T")[0];
};

/**
 * Loads all transactions from local storage (legacy function for manager components)
 * 
 * @param {string} [organizationId] - The organization ID to filter transactions (optional for backward compatibility)
 * @returns {StaffTransaction[]} Array of staff transactions sorted by timestamp
 * 
 * Note: This function supports both organization-scoped and legacy storage keys
 * for backward compatibility during migration
 */
export const loadAllTransactions = (organizationId?: string): StaffTransaction[] => {
  const allSales: StaffTransaction[] = [];

  Object.keys(localStorage).forEach((key) => {
    // Support both organization-scoped and legacy keys
    const isLegacyKey = key.startsWith("cashdesk_sales_");
    const isOrgScopedKey = organizationId && key.startsWith(`cashdesk_sales_${organizationId}_`);
    
    if (isLegacyKey || isOrgScopedKey) {
      // If organizationId is provided, only load keys for that organization
      if (organizationId && !isOrgScopedKey && key !== "cashdesk_sales_") {
        return; // Skip keys from other organizations
      }
      
      try {
        const sales = JSON.parse(localStorage.getItem(key) || "[]");
        allSales.push(
          ...sales.map((sale: StaffTransaction) => ({
            id: validateString(
              sale.id,
              `transaction-${Date.now()}-${Math.random()}`
            ),
            transactionId: validateString(
              sale.transactionId,
              `TXN-${Date.now()}`
            ),
            cashierId: validateString(sale.cashierId, "default_cashier"),
            cashierName: validateString(sale.cashierName, "Default Cashier"),
            timestamp: validateDate(sale.timestamp),
            items: Array.isArray(sale.items) ? sale.items : [],
            subtotal: Number(sale.subtotal) || 0,
            discountAmount: Number(sale.discountAmount) || 0,
            taxAmount: Number(sale.taxAmount) || 0,
            total: Number(sale.total) || 0,
            paymentMethod: [
              "cash",
              "card",
              "transfer",
              "wallet",
              "split",
            ].includes(sale.paymentMethod)
              ? sale.paymentMethod
              : "cash",
            customer: sale.customer,
            refunded: Boolean(sale.refunded),
            voided: Boolean(sale.voided),
          }))
        );
      } catch (error) {
        console.error("Error parsing sales data:", error);
      }
    }
  });

  return allSales.sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
};
