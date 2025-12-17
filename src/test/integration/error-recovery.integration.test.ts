/**
 * Integration Tests: Error Recovery Scenarios
 * Tests system behavior when recovering from various error conditions
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { syncAll } from '@/services/syncCoordinator';
import { syncEntity as syncProduct } from '@/services/productService';
import { queueSync, getSyncQueue, updateSyncStatus } from '@/lib/storageManager';
import { Product } from '@/types';
import { generateId } from '@/lib/formatter';

// Mock Supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockResolvedValue({ data: {}, error: null }),
      update: vi.fn().mockResolvedValue({ data: {}, error: null }),
      delete: vi.fn().mockResolvedValue({ data: {}, error: null }),
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

describe('Error Recovery Scenarios', () => {
  const testUserId = 'test-user-id';

  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should retry failed sync operations with exponential backoff', async () => {
    const product: Product = {
      id: generateId(),
      name: 'Retry Product',
      quantity: 5,
      unitPrice: 50.00,
      synced: false,
      lastModified: new Date().toISOString(),
    };

    // Queue an operation that will fail initially
    const operationId = generateId();
    queueSync({
      id: operationId,
      entityType: 'product',
      entityId: product.id,
      operation: 'create',
      data: product,
      userId: testUserId,
      timestamp: new Date().toISOString(),
      retryCount: 0,
      maxRetries: 3,
      status: 'pending',
    });

    // Mock API to fail first time, succeed second time
    const { supabase } = await import('@/integrations/supabase/client');
    let attemptCount = 0;
    vi.mocked(supabase.from).mockImplementation(() => {
      attemptCount++;
      if (attemptCount === 1) {
        return {
          insert: vi.fn().mockResolvedValue({ 
            data: null, 
            error: { message: 'Temporary error', code: 'TEMP_ERROR' } 
          }),
          eq: vi.fn().mockReturnThis(),
        } as any;
      } else {
        return {
          insert: vi.fn().mockResolvedValue({ data: {}, error: null }),
          eq: vi.fn().mockReturnThis(),
        } as any;
      }
    });

    // First sync attempt - should fail
    const report1 = await syncAll(testUserId);
    expect(report1.failed).toBe(1);

    // Operation should still be in queue with incremented retry count
    const queue1 = getSyncQueue();
    expect(queue1.length).toBeGreaterThan(0);
    expect(queue1[0].retryCount).toBeGreaterThan(0);

    // Second sync attempt - should succeed
    const report2 = await syncAll(testUserId);
    expect(report2.successful).toBe(1);

    // Queue should be cleared
    const queue2 = getSyncQueue();
    expect(queue2.length).toBe(0);
  });

  it('should handle authentication errors gracefully', async () => {
    const product: Product = {
      id: generateId(),
      name: 'Auth Error Product',
      quantity: 5,
      unitPrice: 50.00,
      synced: false,
      lastModified: new Date().toISOString(),
    };

    // Mock auth error
    const { supabase } = await import('@/integrations/supabase/client');
    vi.mocked(supabase.from).mockReturnValue({
      insert: vi.fn().mockResolvedValue({ 
        data: null, 
        error: { 
          message: 'JWT expired', 
          code: 'PGRST301',
          details: 'Authentication required'
        } 
      }),
      eq: vi.fn().mockReturnThis(),
    } as any);

    // Attempt to sync - should fail but save locally
    const result = await syncProduct(product, testUserId, 'create');

    // Should succeed locally but not be synced
    expect(result.success).toBe(true);
    expect(result.synced).toBe(false);
    expect(result.error).toBeDefined();

    // Should be queued for retry
    const queue = getSyncQueue();
    expect(queue.length).toBeGreaterThan(0);
  });

  it('should handle validation errors without queuing for retry', async () => {
    const invalidProduct: Product = {
      id: generateId(),
      name: '', // Invalid: empty name
      quantity: 5,
      unitPrice: 50.00,
      synced: false,
      lastModified: new Date().toISOString(),
    };

    // Attempt to sync invalid product
    try {
      await syncProduct(invalidProduct, testUserId, 'create');
      // Should not reach here
      expect(true).toBe(false);
    } catch (error) {
      // Should throw validation error
      expect(error).toBeDefined();
      expect((error as Error).message).toContain('required');
    }

    // Should NOT be queued (validation errors shouldn't retry)
    const queue = getSyncQueue();
    expect(queue.length).toBe(0);
  });

  it('should stop retrying after max retry attempts', async () => {
    const product: Product = {
      id: generateId(),
      name: 'Max Retry Product',
      quantity: 5,
      unitPrice: 50.00,
      synced: false,
      lastModified: new Date().toISOString(),
    };

    // Queue operation with high retry count
    const operationId = generateId();
    queueSync({
      id: operationId,
      entityType: 'product',
      entityId: product.id,
      operation: 'create',
      data: product,
      userId: testUserId,
      timestamp: new Date().toISOString(),
      retryCount: 2, // Already tried twice
      maxRetries: 3,
      status: 'pending',
    });

    // Mock API to always fail
    const { supabase } = await import('@/integrations/supabase/client');
    vi.mocked(supabase.from).mockReturnValue({
      insert: vi.fn().mockResolvedValue({ 
        data: null, 
        error: { message: 'Persistent error', code: 'ERROR' } 
      }),
      eq: vi.fn().mockReturnThis(),
    } as any);

    // Sync - should fail and mark as failed (not retry again)
    const report = await syncAll(testUserId);
    expect(report.failed).toBe(1);

    // Operation should be marked as failed
    const queue = getSyncQueue();
    const operation = queue.find(op => op.id === operationId);
    expect(operation?.status).toBe('failed');
    expect(operation?.retryCount).toBe(3); // Max retries reached
  });

  it('should recover from corrupted localStorage data', async () => {
    // Corrupt localStorage with invalid JSON
    localStorage.setItem('sync_queue', 'invalid json {{{');

    // Should handle gracefully and return empty queue
    const queue = getSyncQueue();
    expect(queue).toEqual([]);
  });

  it('should handle network timeout errors', async () => {
    const product: Product = {
      id: generateId(),
      name: 'Timeout Product',
      quantity: 5,
      unitPrice: 50.00,
      synced: false,
      lastModified: new Date().toISOString(),
    };

    // Mock network timeout
    const { supabase } = await import('@/integrations/supabase/client');
    vi.mocked(supabase.from).mockReturnValue({
      insert: vi.fn().mockRejectedValue(new Error('Network timeout')),
      eq: vi.fn().mockReturnThis(),
    } as any);

    // Attempt to sync
    const result = await syncProduct(product, testUserId, 'create');

    // Should save locally and queue for retry
    expect(result.success).toBe(true);
    expect(result.synced).toBe(false);
    expect(result.error).toBeDefined();

    const queue = getSyncQueue();
    expect(queue.length).toBeGreaterThan(0);
  });

  it('should handle database constraint violations', async () => {
    const product: Product = {
      id: generateId(),
      name: 'Constraint Product',
      quantity: 5,
      unitPrice: 50.00,
      category: 'non-existent-category', // Foreign key violation
      synced: false,
      lastModified: new Date().toISOString(),
    };

    // Mock foreign key constraint error
    const { supabase } = await import('@/integrations/supabase/client');
    vi.mocked(supabase.from).mockReturnValue({
      insert: vi.fn().mockResolvedValue({ 
        data: null, 
        error: { 
          message: 'Foreign key violation', 
          code: '23503',
          details: 'Category does not exist'
        } 
      }),
      eq: vi.fn().mockReturnThis(),
    } as any);

    // Attempt to sync
    const result = await syncProduct(product, testUserId, 'create');

    // Should save locally but queue for retry
    expect(result.success).toBe(true);
    expect(result.synced).toBe(false);

    const queue = getSyncQueue();
    expect(queue.length).toBeGreaterThan(0);
    expect(queue[0].lastError).toContain('Foreign key');
  });

  it('should preserve operation order during recovery', async () => {
    const product1: Product = {
      id: generateId(),
      name: 'Product 1',
      quantity: 5,
      unitPrice: 50.00,
      synced: false,
      lastModified: new Date().toISOString(),
    };

    const product2: Product = {
      id: generateId(),
      name: 'Product 2',
      quantity: 10,
      unitPrice: 100.00,
      synced: false,
      lastModified: new Date().toISOString(),
    };

    // Queue operations in specific order
    const op1Id = generateId();
    const op2Id = generateId();

    queueSync({
      id: op1Id,
      entityType: 'product',
      entityId: product1.id,
      operation: 'create',
      data: product1,
      userId: testUserId,
      timestamp: '2024-01-01T00:00:00.000Z',
      retryCount: 0,
      maxRetries: 3,
      status: 'pending',
    });

    queueSync({
      id: op2Id,
      entityType: 'product',
      entityId: product2.id,
      operation: 'create',
      data: product2,
      userId: testUserId,
      timestamp: '2024-01-01T00:01:00.000Z',
      retryCount: 0,
      maxRetries: 3,
      status: 'pending',
    });

    // Track API call order
    const callOrder: string[] = [];
    const { supabase } = await import('@/integrations/supabase/client');
    vi.mocked(supabase.from).mockImplementation(() => ({
      insert: vi.fn().mockImplementation((data: any) => {
        callOrder.push(data.name);
        return Promise.resolve({ data: {}, error: null });
      }),
      eq: vi.fn().mockReturnThis(),
    } as any));

    // Sync all
    await syncAll(testUserId);

    // Verify operations were processed in order
    expect(callOrder).toEqual(['Product 1', 'Product 2']);
  });
});
