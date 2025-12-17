/**
 * Invoice Service
 * 
 * Handles all invoice-related data operations including API synchronization and local storage management.
 * Implements the offline-first pattern where operations are saved locally first, then synced to the API.
 * Manages both invoice headers and invoice items as a transactional unit.
 * 
 * @module invoiceService
 * 
 * Error Handling Pattern:
 * - All functions throw AppError with context on failure
 * - Network errors trigger local storage with sync queue
 * - Validation errors are thrown immediately
 * 
 * Sync Behavior:
 * - Create/Update operations attempt API sync first
 * - Invoice items are synced atomically with invoice header
 * - On API failure, entire invoice is saved locally with synced=false
 * - Failed operations are queued for later retry
 */

import { Invoice, InvoiceItem } from "@/types";
import { supabase } from "@/integrations/supabase/client";
import { STORAGE_KEYS } from "@/lib/offlineStorage";
import storageManager, { SyncQueueItem } from '@/lib/storageManager';
import { handleError, createValidationError, validateUserId } from '@/lib/errorHandler';
import { generateId } from '@/lib/formatter';

/**
 * Result of a sync operation
 * 
 * @property {boolean} success - Whether the operation completed without critical errors
 * @property {boolean} synced - Whether the data was successfully synced to the API
 * @property {Error} [error] - Error object if sync failed (operation may still succeed locally)
 * @property {Invoice} [data] - The invoice data after the operation
 */
export interface SyncResult {
  success: boolean;
  synced: boolean;
  error?: Error;
  data?: Invoice;
}

/**
 * Fetches invoices from Supabase
 * 
 * @param {string} [userId] - The authenticated user's ID (required for data access)
 * @param {string} organizationId - The organization ID to filter invoices (required for multi-tenancy)
 * @returns {Promise<Invoice[]>} Array of invoices with sync metadata
 * @throws {AppError} If user is not authenticated or API request fails
 */
export const fetchInvoicesFromAPI = async (userId?: string, organizationId?: string): Promise<Invoice[]> => {
  validateUserId(userId, { operation: 'fetch', entityType: 'invoice' });

  if (!organizationId) {
    throw createValidationError(
      'Organization ID is required',
      { operation: 'fetch', entityType: 'invoice', userId }
    );
  }

  try {
    // First, fetch the invoices - filter by organization (RLS will also enforce this)
    const query = supabase
      .from("invoices")
      .select("*")
      .eq('organization_id', organizationId)
      .order("date", { ascending: false }) as any; // Type assertion to avoid TypeScript inference depth issue

    const { data: invoicesData, error: invoicesError } = await query;

    if (invoicesError) {
      throw handleError(invoicesError, {
        operation: 'fetch',
        entityType: 'invoice',
        userId
      });
    }

    if (!invoicesData || invoicesData.length === 0) {
      return [];
    }

    // Create a map to store invoice items by invoice_id
    const invoiceItemsMap = new Map<string, InvoiceItem[]>();

    // Fetch all invoice items for these invoices
    const invoiceIds = invoicesData.map((invoice) => invoice.id);
    const { data: itemsData, error: itemsError } = await supabase
      .from("invoice_items")
      .select("*")
      .in("invoice_id", invoiceIds);

    if (itemsError) {
      throw handleError(itemsError, {
        operation: 'fetch',
        entityType: 'invoice',
        userId
      });
    }

    // Group items by invoice_id
    if (itemsData) {
      for (const item of itemsData) {
        if (!invoiceItemsMap.has(item.invoice_id)) {
          invoiceItemsMap.set(item.invoice_id, []);
        }

        invoiceItemsMap.get(item.invoice_id)?.push({
          productId: item.product_id,
          productName: item.product_name,
          quantity: item.quantity,
          unitPrice: item.unit_price,
          totalPrice: item.total_price,
        });
      }
    }

    // Map the invoices data with their items
    return invoicesData.map((invoice) => ({
      id: invoice.id,
      customerName: invoice.customer_name,
      customerId: invoice.customer_id || undefined,
      date: invoice.date,
      items: invoiceItemsMap.get(invoice.id) || [],
      totalAmount: Number(invoice.total_amount),
      status: invoice.status as "draft" | "issued" | "paid" | "overdue",
      dueDate: invoice.due_date || undefined,
      synced: true,
      lastModified: invoice.updated_at || new Date().toISOString(),
    }));
  } catch (error) {
    throw handleError(error, {
      operation: 'fetch',
      entityType: 'invoice',
      userId
    });
  }
};

/**
 * Creates an invoice in Supabase
 * 
 * @param {Invoice} invoice - The invoice to create
 * @param {string} userId - The authenticated user's ID
 * @param {string} organizationId - The organization ID (required for multi-tenancy)
 * @returns {Promise<Invoice>} The created invoice with sync metadata
 * @throws {AppError} If validation fails or API request fails
 */
export const createInAPI = async (invoice: Invoice, userId: string, organizationId: string): Promise<Invoice> => {
  validateUserId(userId, { operation: 'create', entityType: 'invoice', entityId: invoice.id });

  if (!organizationId) {
    throw createValidationError(
      'Organization ID is required',
      { operation: 'create', entityType: 'invoice', entityId: invoice.id, userId }
    );
  }

  if (!invoice.customerName || invoice.items.length === 0) {
    throw createValidationError(
      'Invoice must have a customer name and at least one item',
      { operation: 'create', entityType: 'invoice', entityId: invoice.id, userId }
    );
  }

  try {
    // Insert the invoice
    const { data: invoiceData, error: invoiceError } = await supabase
      .from("invoices")
      .insert({
        id: invoice.id,
        customer_id: invoice.customerId,
        customer_name: invoice.customerName,
        date: invoice.date,
        total_amount: invoice.totalAmount,
        status: invoice.status,
        due_date: invoice.dueDate,
        user_id: userId,
        organization_id: organizationId
      })
      .select();

    if (invoiceError) {
      throw handleError(invoiceError, {
        operation: 'create',
        entityType: 'invoice',
        entityId: invoice.id,
        userId
      });
    }

    if (!invoiceData || invoiceData.length === 0) {
      throw new Error("Failed to insert invoice");
    }

    // Insert the invoice items
    if (invoice.items.length > 0) {
      const invoiceItems = invoice.items.map((item) => ({
        invoice_id: invoice.id,
        product_id: item.productId,
        product_name: item.productName,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        total_price: item.totalPrice,
      }));

      const { error: itemsError } = await supabase
        .from("invoice_items")
        .insert(invoiceItems);

      if (itemsError) {
        throw handleError(itemsError, {
          operation: 'create',
          entityType: 'invoice',
          entityId: invoice.id,
          userId
        });
      }
    }

    return { 
      ...invoice, 
      synced: true,
      lastModified: new Date().toISOString()
    };
  } catch (error) {
    throw handleError(error, {
      operation: 'create',
      entityType: 'invoice',
      entityId: invoice.id,
      userId
    });
  }
};

/**
 * Updates an invoice in Supabase
 * 
 * @param {Invoice} invoice - The invoice to update (must include id)
 * @param {string} organizationId - The organization ID (required for multi-tenancy)
 * @returns {Promise<Invoice>} The updated invoice with sync metadata
 * @throws {AppError} If validation fails or API request fails
 */
export const updateInAPI = async (invoice: Invoice, organizationId: string): Promise<Invoice> => {
  if (!invoice.id) {
    throw createValidationError(
      'Invoice ID is required for update',
      { operation: 'update', entityType: 'invoice' }
    );
  }

  if (!organizationId) {
    throw createValidationError(
      'Organization ID is required',
      { operation: 'update', entityType: 'invoice', entityId: invoice.id }
    );
  }

  if (!invoice.customerName || invoice.items.length === 0) {
    throw createValidationError(
      'Invoice must have a customer name and at least one item',
      { operation: 'update', entityType: 'invoice', entityId: invoice.id }
    );
  }

  try {
    // Update the invoice (RLS will ensure organization_id matches)
    const { error: invoiceError } = await supabase
      .from("invoices")
      .update({
        customer_id: invoice.customerId,
        customer_name: invoice.customerName,
        date: invoice.date,
        total_amount: invoice.totalAmount,
        status: invoice.status,
        due_date: invoice.dueDate,
      })
      .eq("id", invoice.id)
      .eq("organization_id", organizationId);

    if (invoiceError) {
      throw handleError(invoiceError, {
        operation: 'update',
        entityType: 'invoice',
        entityId: invoice.id
      });
    }

    // Delete existing items and insert new ones (easier than trying to update)
    const { error: deleteError } = await supabase
      .from("invoice_items")
      .delete()
      .eq("invoice_id", invoice.id);

    if (deleteError) {
      throw handleError(deleteError, {
        operation: 'update',
        entityType: 'invoice',
        entityId: invoice.id
      });
    }

    // Insert the updated invoice items
    if (invoice.items.length > 0) {
      const invoiceItems = invoice.items.map((item) => ({
        invoice_id: invoice.id,
        product_id: item.productId,
        product_name: item.productName,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        total_price: item.totalPrice,
      }));

      const { error: itemsError } = await supabase
        .from("invoice_items")
        .insert(invoiceItems);

      if (itemsError) {
        throw handleError(itemsError, {
          operation: 'update',
          entityType: 'invoice',
          entityId: invoice.id
        });
      }
    }

    return { 
      ...invoice, 
      synced: true,
      lastModified: new Date().toISOString()
    };
  } catch (error) {
    throw handleError(error, {
      operation: 'update',
      entityType: 'invoice',
      entityId: invoice.id
    });
  }
};

/**
 * Deletes an invoice from Supabase
 * 
 * @param {string} invoiceId - The ID of the invoice to delete
 * @param {string} organizationId - The organization ID (required for multi-tenancy)
 * @returns {Promise<void>}
 * @throws {AppError} If validation fails or API request fails
 */
export const deleteFromAPI = async (invoiceId: string, organizationId: string): Promise<void> => {
  if (!invoiceId) {
    throw createValidationError(
      'Invoice ID is required for deletion',
      { operation: 'delete', entityType: 'invoice' }
    );
  }

  if (!organizationId) {
    throw createValidationError(
      'Organization ID is required',
      { operation: 'delete', entityType: 'invoice', entityId: invoiceId }
    );
  }

  try {
    // Delete the invoice (invoice items will be deleted by the CASCADE constraint)
    // RLS will ensure organization_id matches
    const { error } = await supabase
      .from("invoices")
      .delete()
      .eq("id", invoiceId)
      .eq("organization_id", organizationId);

    if (error) {
      throw handleError(error, {
        operation: 'delete',
        entityType: 'invoice',
        entityId: invoiceId
      });
    }
  } catch (error) {
    throw handleError(error, {
      operation: 'delete',
      entityType: 'invoice',
      entityId: invoiceId
    });
  }
};

/**
 * Gets the organization-scoped storage key for invoices
 */
const getStorageKey = (organizationId?: string): string => {
  if (organizationId) {
    return `${STORAGE_KEYS.INVOICES}_${organizationId}`;
  }
  return STORAGE_KEYS.INVOICES;
};

/**
 * Gets invoices from local storage
 */
export const getFromStorage = (organizationId?: string): Invoice[] => {
  try {
    return storageManager.getItems<Invoice>(getStorageKey(organizationId));
  } catch (error) {
    throw handleError(error, {
      operation: 'read',
      entityType: 'invoice'
    });
  }
};

/**
 * Saves an invoice to local storage
 */
export const saveToStorage = (invoice: Invoice, organizationId?: string): void => {
  try {
    storageManager.addItem<Invoice>(getStorageKey(organizationId), invoice);
  } catch (error) {
    throw handleError(error, {
      operation: 'save',
      entityType: 'invoice',
      entityId: invoice.id
    });
  }
};

/**
 * Updates an invoice in local storage
 */
export const updateInStorage = (invoice: Invoice, organizationId?: string): void => {
  try {
    storageManager.updateItem<Invoice>(getStorageKey(organizationId), invoice);
  } catch (error) {
    throw handleError(error, {
      operation: 'update',
      entityType: 'invoice',
      entityId: invoice.id
    });
  }
};

/**
 * Deletes an invoice from local storage
 */
export const deleteFromStorage = (invoiceId: string, organizationId?: string): void => {
  try {
    storageManager.deleteItem<Invoice>(getStorageKey(organizationId), invoiceId);
  } catch (error) {
    throw handleError(error, {
      operation: 'delete',
      entityType: 'invoice',
      entityId: invoiceId
    });
  }
};

/**
 * Synchronizes an invoice entity with the API using offline-first pattern
 * 
 * Primary method for creating or updating invoices. Attempts API sync first,
 * falls back to local storage with queue on failure. Handles invoice items atomically.
 * 
 * @param {Invoice} invoice - The invoice to sync (must include customerName and items)
 * @param {string} userId - The authenticated user's ID
 * @param {'create' | 'update'} operation - The type of operation to perform
 * @param {string} organizationId - The organization ID for multi-tenancy
 * @returns {Promise<SyncResult>} Result indicating success, sync status, and any errors
 * @throws {AppError} Only for critical errors (validation, auth, storage failures)
 */
export const syncEntity = async (
  invoice: Invoice,
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
    validateUserId(userId, { operation, entityType: 'invoice', entityId: invoice.id, userId });

    if (!invoice.customerName || invoice.items.length === 0) {
      throw createValidationError(
        'Invoice must have a customer name and at least one item',
        { operation, entityType: 'invoice', entityId: invoice.id, userId }
      );
    }

    if (!organizationId) {
      throw createValidationError(
        'Organization ID is required',
        { operation, entityType: 'invoice', entityId: invoice.id, userId }
      );
    }

    // Prepare invoice with sync metadata
    const invoiceToSync: Invoice = {
      ...invoice,
      synced: false,
      lastModified: new Date().toISOString(),
      syncAttempts: (invoice.syncAttempts || 0) + 1,
    };

    // Try to sync with API first
    try {
      let syncedInvoice: Invoice;
      
      if (operation === 'create') {
        syncedInvoice = await createInAPI(invoiceToSync, userId, organizationId);
      } else {
        syncedInvoice = await updateInAPI(invoiceToSync, organizationId);
      }

      // API sync successful - update storage with synced status
      if (operation === 'create') {
        saveToStorage(syncedInvoice, organizationId);
      } else {
        updateInStorage(syncedInvoice, organizationId);
      }

      result.success = true;
      result.synced = true;
      result.data = syncedInvoice;
      
      return result;
    } catch (apiError) {
      // API sync failed - save locally and queue for later sync
      console.warn(`Failed to sync invoice to API, saving locally:`, apiError);
      
      const errorMessage = apiError instanceof Error ? apiError.message : 'Unknown error';
      const invoiceWithError: Invoice = {
        ...invoiceToSync,
        lastSyncError: errorMessage,
      };

      // Save to local storage
      if (operation === 'create') {
        saveToStorage(invoiceWithError, organizationId);
      } else {
        updateInStorage(invoiceWithError, organizationId);
      }

      // Queue for sync
      const syncOperation: SyncQueueItem = {
        id: generateId(),
        entityType: 'invoice',
        entityId: invoice.id,
        operation,
        data: invoiceWithError,
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
      result.data = invoiceWithError;
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
      entityType: 'invoice',
      entityId: invoice.id,
      userId
    });
  }
};
