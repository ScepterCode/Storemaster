/**
 * Integration Tests: Offline Operation → Reconnect → Sync Flow
 * Tests the complete offline-first workflow including sync recovery
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { syncAll, getSyncStatus, hasPendingSync } from '@/services/syncCoordinator';
import { syncEntity as syncProduct } from '@/services/productService';
import { syncEntity as syncCategory } from '@/services/categoryService';
import { syncEntity as syncCustomer } from '@/services/customerService';
import { queueSync, getSyncQueue, clearSyncQueue } from '@/lib/storageManager';
import { Product, Category, Customer } from '@/types';
import { generateId } from '@/lib/formatter';

// Mock Supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: [], error: null }),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
    })),
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: 'test-user-id' } },
        error: null,
      }),
    },
  },
}));

describe('Offline Operation → Reconnect → Sync Flow', () => {
  const testUserId = 'test-user-id';
  let mockProduct: Product;
  let mockCategory: Category;
  let mockCustomer: Customer;

  beforeEach(() => {
    // Clear localStorage
    localStorage.clear();
    vi.clearAllMocks();

    // Create test entities
    mockProduct = {
      id: generateId(),
      name: 'Test Product',
      quantity: 10,
      unitPrice: 99.99,
      category: 'test-category',
      synced: false,
      lastModified: new Date().toISOString(),
    };

    mockCategory = {
      id: generateId(),
      name: 'Test Category',
      synced: false,
      lastModified: new Date().toISOString(),
    };

    mockCustomer = {
      id: generateId(),
      name: 'Test Customer',
      phone: '1234567890',
      synced: false,
      lastModified: new Date().toISOString(),
    };
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should save entity locally when offline and queue for sync', async () => {
    // Simulate offline by making API calls fail
    const { supabase } = await import('@/integrations/supabase/client');
    vi.mocked(supabase.from).mockReturnValue({
      insert: vi.fn().mockResolvedValue({ 
        data: null, 
        error: { message: 'Network error', code: 'NETWORK_ERROR' } 
      }),
    } as any);

    // Attempt to create product while offline
    const result = await syncProduct(mockProduct, testUserId, 'create');

    // Should succeed locally but not be synced
    expect(result.success).toBe(true);
    expect(result.synced).toBe(false);
    expect(result.error).toBeDefined();

    // Should be queued for sync
    const queue = getSyncQueue();
    expect(queue.length).toBeGreaterThan(0);
    expect(queue[0].entityType).toBe('product');
    expect(queue[0].operation).toBe('create');
    expect(queue[0].status).toBe('pending');
  });

  it('should sync queued operations when coming back online', async () => {
    // First, queue some operations (simulating offline state)
    queueSync({
      id: generateId(),
      entityType: 'product',
      entityId: mockProduct.id,
      operation: 'create',
      data: mockProduct,
      userId: testUserId,
      timestamp: new Date().toISOString(),
      retryCount: 0,
      maxRetries: 3,
      status: 'pending',
    });

    queueSync({
      id: generateId(),
      entityType: 'category',
      entityId: mockCategory.id,
      operation: 'create',
      data: mockCategory,
      userId: testUserId,
      timestamp: new Date().toISOString(),
      retryCount: 0,
      maxRetries: 3,
      status: 'pending',
    });

    // Verify operations are queued
    expect(hasPendingSync()).toBe(true);
    const initialQueue = getSyncQueue();
    expect(initialQueue.length).toBe(2);

    // Mock successful API calls (simulating coming back online)
    const { supabase } = await import('@/integrations/supabase/client');
    vi.mocked(supabase.from).mockReturnValue({
      insert: vi.fn().mockResolvedValue({ data: {}, error: null }),
      update: vi.fn().mockResolvedValue({ data: {}, error: null }),
      delete: vi.fn().mockResolvedValue({ data: {}, error: null }),
      eq: vi.fn().mockReturnThis(),
    } as any);

    // Sync all queued operations
    const report = await syncAll(testUserId);

    // Verify sync report
    expect(report.totalOperations).toBe(2);
    expect(report.successful).toBe(2);
    expect(report.failed).toBe(0);

    // Verify queue is cleared
    const finalQueue = getSyncQueue();
    expect(finalQueue.length).toBe(0);
  });

  it('should handle partial sync failures gracefully', async () => {
    // Queue multiple operations
    queueSync({
      id: generateId(),
      entityType: 'product',
      entityId: mockProduct.id,
      operation: 'create',
      data: mockProduct,
      userId: testUserId,
      timestamp: new Date().toISOString(),
      retryCount: 0,
      maxRetries: 3,
      status: 'pending',
    });

    queueSync({
      id: generateId(),
      entityType: 'category',
      entityId: mockCategory.id,
      operation: 'create',
      data: mockCategory,
      userId: testUserId,
      timestamp: new Date().toISOString(),
      retryCount: 0,
      maxRetries: 3,
      status: 'pending',
    });

    // Mock API: first call succeeds, second fails
    const { supabase } = await import('@/integrations/supabase/client');
    let callCount = 0;
    vi.mocked(supabase.from).mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        return {
          insert: vi.fn().mockResolvedValue({ data: {}, error: null }),
          eq: vi.fn().mockReturnThis(),
        } as any;
      } else {
        return {
          insert: vi.fn().mockResolvedValue({ 
            data: null, 
            error: { message: 'Database error', code: 'DB_ERROR' } 
          }),
          eq: vi.fn().mockReturnThis(),
        } as any;
      }
    });

    // Sync all
    const report = await syncAll(testUserId);

    // Verify partial success
    expect(report.totalOperations).toBe(2);
    expect(report.successful).toBe(1);
    expect(report.failed).toBe(1);
    expect(report.errors.length).toBe(1);

    // Failed operation should still be in queue
    const queue = getSyncQueue();
    expect(queue.length).toBeGreaterThan(0);
  });

  it('should maintain sync status across operations', async () => {
    // Initial status
    const initialStatus = getSyncStatus();
    expect(initialStatus.pendingOperations).toBe(0);
    expect(initialStatus.isSyncing).toBe(false);

    // Queue an operation
    queueSync({
      id: generateId(),
      entityType: 'customer',
      entityId: mockCustomer.id,
      operation: 'create',
      data: mockCustomer,
      userId: testUserId,
      timestamp: new Date().toISOString(),
      retryCount: 0,
      maxRetries: 3,
      status: 'pending',
    });

    // Status should show pending operation
    const pendingStatus = getSyncStatus();
    expect(pendingStatus.pendingOperations).toBe(1);

    // Mock successful sync
    const { supabase } = await import('@/integrations/supabase/client');
    vi.mocked(supabase.from).mockReturnValue({
      insert: vi.fn().mockResolvedValue({ data: {}, error: null }),
      eq: vi.fn().mockReturnThis(),
    } as any);

    // Sync
    await syncAll(testUserId);

    // Status should show no pending operations
    const finalStatus = getSyncStatus();
    expect(finalStatus.pendingOperations).toBe(0);
    expect(finalStatus.lastSyncTime).toBeDefined();
  });
});
