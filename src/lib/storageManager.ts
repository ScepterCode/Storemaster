/**
 * Enhanced Storage Manager
 * Provides centralized local storage management with sync queue support
 */

export interface SyncOperation {
  id: string;
  entityType: 'product' | 'category' | 'customer' | 'invoice' | 'transaction';
  operation: 'create' | 'update' | 'delete';
  data: any;
  timestamp: string;
  retryCount: number;
  lastError?: string;
}

export interface SyncQueueItem extends SyncOperation {
  entityId: string;
  userId: string;
  organizationId?: string; // Organization ID for multi-tenant sync
  maxRetries: number;
  status: 'pending' | 'processing' | 'failed' | 'completed';
}

export interface StorageManager {
  getItems<T>(key: string): T[];
  addItem<T extends { id: string }>(key: string, item: T): void;
  updateItem<T extends { id: string }>(key: string, item: T, idField?: string): void;
  deleteItem<T>(key: string, itemId: string): void;
  queueSync(operation: SyncQueueItem): void;
  getSyncQueue(): SyncQueueItem[];
  clearSyncQueue(operationId: string): void;
}

const SYNC_QUEUE_KEY = 'sync_queue';

/**
 * Get organization-scoped sync queue key
 */
function getSyncQueueKey(organizationId?: string): string {
  return organizationId ? `${SYNC_QUEUE_KEY}_${organizationId}` : SYNC_QUEUE_KEY;
}

/**
 * Get items from localStorage with type safety
 */
export function getItems<T>(key: string): T[] {
  try {
    const data = localStorage.getItem(key);
    if (!data) {
      return [];
    }
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error(`Error reading from localStorage key "${key}":`, error);
    return [];
  }
}

/**
 * Add a new item to localStorage
 */
export function addItem<T extends { id: string }>(key: string, item: T): void {
  try {
    const items = getItems<T>(key);
    items.push(item);
    localStorage.setItem(key, JSON.stringify(items));
  } catch (error) {
    console.error(`Error adding item to localStorage key "${key}":`, error);
    throw new Error(`Failed to add item to storage: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Update an existing item in localStorage
 */
export function updateItem<T extends { id: string }>(
  key: string,
  item: T,
  idField: string = 'id'
): void {
  try {
    const items = getItems<T>(key);
    const index = items.findIndex((i: any) => i[idField] === (item as any)[idField]);
    
    if (index === -1) {
      throw new Error(`Item with ${idField} "${(item as any)[idField]}" not found`);
    }
    
    items[index] = item;
    localStorage.setItem(key, JSON.stringify(items));
  } catch (error) {
    console.error(`Error updating item in localStorage key "${key}":`, error);
    throw new Error(`Failed to update item in storage: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Delete an item from localStorage
 */
export function deleteItem<T extends { id: string }>(key: string, itemId: string): void {
  try {
    const items = getItems<T>(key);
    const filtered = items.filter((item) => item.id !== itemId);
    localStorage.setItem(key, JSON.stringify(filtered));
  } catch (error) {
    console.error(`Error deleting item from localStorage key "${key}":`, error);
    throw new Error(`Failed to delete item from storage: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Queue a sync operation for later processing
 */
export function queueSync(operation: SyncQueueItem): void {
  try {
    const queueKey = getSyncQueueKey(operation.organizationId);
    const queue = getSyncQueue(operation.organizationId);
    
    // Check if operation already exists
    const existingIndex = queue.findIndex(
      (item) => item.entityId === operation.entityId && 
                item.entityType === operation.entityType &&
                item.operation === operation.operation
    );
    
    if (existingIndex !== -1) {
      // Update existing operation
      queue[existingIndex] = operation;
    } else {
      // Add new operation
      queue.push(operation);
    }
    
    localStorage.setItem(queueKey, JSON.stringify(queue));
  } catch (error) {
    console.error('Error queuing sync operation:', error);
    throw new Error(`Failed to queue sync operation: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get all pending sync operations
 * @param organizationId - Optional organization ID to get organization-scoped queue
 */
export function getSyncQueue(organizationId?: string): SyncQueueItem[] {
  const queueKey = getSyncQueueKey(organizationId);
  return getItems<SyncQueueItem>(queueKey);
}

/**
 * Remove a sync operation from the queue
 * @param operationId - The operation ID to remove
 * @param organizationId - Optional organization ID for organization-scoped queue
 */
export function clearSyncQueue(operationId: string, organizationId?: string): void {
  try {
    const queueKey = getSyncQueueKey(organizationId);
    const queue = getSyncQueue(organizationId);
    const filtered = queue.filter((item) => item.id !== operationId);
    localStorage.setItem(queueKey, JSON.stringify(filtered));
  } catch (error) {
    console.error('Error clearing sync queue item:', error);
    throw new Error(`Failed to clear sync queue: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Clear all completed sync operations from the queue
 * @param organizationId - Optional organization ID for organization-scoped queue
 */
export function clearCompletedSyncs(organizationId?: string): void {
  try {
    const queueKey = getSyncQueueKey(organizationId);
    const queue = getSyncQueue(organizationId);
    const pending = queue.filter((item) => item.status !== 'completed');
    localStorage.setItem(queueKey, JSON.stringify(pending));
  } catch (error) {
    console.error('Error clearing completed syncs:', error);
  }
}

/**
 * Get pending sync operations for a specific entity type
 * @param entityType - The entity type to filter by
 * @param organizationId - Optional organization ID for organization-scoped queue
 */
export function getPendingSyncsForEntity(entityType: string, organizationId?: string): SyncQueueItem[] {
  const queue = getSyncQueue(organizationId);
  return queue.filter(
    (item) => item.entityType === entityType && item.status === 'pending'
  );
}

/**
 * Update sync operation status
 * @param operationId - The operation ID to update
 * @param status - The new status
 * @param error - Optional error message
 * @param organizationId - Optional organization ID for organization-scoped queue
 */
export function updateSyncStatus(
  operationId: string,
  status: SyncQueueItem['status'],
  error?: string,
  organizationId?: string
): void {
  try {
    const queueKey = getSyncQueueKey(organizationId);
    const queue = getSyncQueue(organizationId);
    const index = queue.findIndex((item) => item.id === operationId);
    
    if (index !== -1) {
      queue[index].status = status;
      if (error) {
        queue[index].lastError = error;
      }
      if (status === 'failed') {
        queue[index].retryCount += 1;
      }
      localStorage.setItem(queueKey, JSON.stringify(queue));
    }
  } catch (error) {
    console.error('Error updating sync status:', error);
  }
}

// Export as default object for convenience
const storageManager: StorageManager = {
  getItems,
  addItem,
  updateItem,
  deleteItem,
  queueSync,
  getSyncQueue,
  clearSyncQueue,
};

export default storageManager;
