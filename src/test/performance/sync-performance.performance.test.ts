/**
 * Performance Tests: Sync Performance with Many Queued Operations
 * Tests sync coordinator performance under load
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { syncAll, getSyncStatus } from '@/services/syncCoordinator';
import { queueSync, getSyncQueue } from '@/lib/storageManager';
import { Product, Category, Customer } from '@/types';
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

describe('Sync Performance Tests', () => {
  const testUserId = 'test-user-id';

  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
  });

  /**
   * Helper to queue multiple operations
   */
  function queueMultipleOperations(count: number, entityType: 'product' | 'category' | 'customer') {
    for (let i = 0; i < count; i++) {
      const data = createMockEntity(entityType, i);
      queueSync({
        id: generateId(),
        entityType,
        entityId: data.id,
        operation: 'create',
        data,
        userId: testUserId,
        timestamp: new Date().toISOString(),
        retryCount: 0,
        maxRetries: 3,
        status: 'pending',
      });
    }
  }

  function createMockEntity(type: 'product' | 'category' | 'customer', index: number): any {
    switch (type) {
      case 'product':
        return {
          id: generateId(),
          name: `Product ${index}`,
          quantity: 10,
          unitPrice: 99.99,
          synced: false,
          lastModified: new Date().toISOString(),
        };
      case 'category':
        return {
          id: generateId(),
          name: `Category ${index}`,
          synced: false,
          lastModified: new Date().toISOString(),
        };
      case 'customer':
        return {
          id: generateId(),
          name: `Customer ${index}`,
          phone: '1234567890',
          synced: false,
          lastModified: new Date().toISOString(),
        };
    }
  }

  it('should sync 50 queued operations efficiently', async () => {
    queueMultipleOperations(50, 'product');

    const queue = getSyncQueue();
    expect(queue.length).toBe(50);

    const startTime = performance.now();
    const report = await syncAll(testUserId);
    const endTime = performance.now();

    const duration = endTime - startTime;

    expect(report.totalOperations).toBe(50);
    expect(report.successful).toBe(50);
    expect(duration).toBeLessThan(5000); // Should complete in less than 5 seconds
    console.log(`Synced 50 operations in ${duration.toFixed(2)}ms (${(duration / 50).toFixed(2)}ms per operation)`);
  });

  it('should sync 100 queued operations efficiently', async () => {
    queueMultipleOperations(100, 'product');

    const queue = getSyncQueue();
    expect(queue.length).toBe(100);

    const startTime = performance.now();
    const report = await syncAll(testUserId);
    const endTime = performance.now();

    const duration = endTime - startTime;

    expect(report.totalOperations).toBe(100);
    expect(report.successful).toBe(100);
    expect(duration).toBeLessThan(10000); // Should complete in less than 10 seconds
    console.log(`Synced 100 operations in ${duration.toFixed(2)}ms (${(duration / 100).toFixed(2)}ms per operation)`);
  });

  it('should handle mixed entity types efficiently', async () => {
    queueMultipleOperations(30, 'product');
    queueMultipleOperations(30, 'category');
    queueMultipleOperations(30, 'customer');

    const queue = getSyncQueue();
    expect(queue.length).toBe(90);

    const startTime = performance.now();
    const report = await syncAll(testUserId);
    const endTime = performance.now();

    const duration = endTime - startTime;

    expect(report.totalOperations).toBe(90);
    expect(report.successful).toBe(90);
    expect(duration).toBeLessThan(9000); // Should complete in less than 9 seconds
    console.log(`Synced 90 mixed operations in ${duration.toFixed(2)}ms`);
  });

  it('should handle mixed operations (create, update, delete) efficiently', async () => {
    // Queue creates
    for (let i = 0; i < 20; i++) {
      const product: Product = {
        id: generateId(),
        name: `Product ${i}`,
        quantity: 10,
        unitPrice: 99.99,
        synced: false,
        lastModified: new Date().toISOString(),
      };
      queueSync({
        id: generateId(),
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
    }

    // Queue updates
    for (let i = 0; i < 20; i++) {
      const product: Product = {
        id: generateId(),
        name: `Updated Product ${i}`,
        quantity: 20,
        unitPrice: 199.99,
        synced: false,
        lastModified: new Date().toISOString(),
      };
      queueSync({
        id: generateId(),
        entityType: 'product',
        entityId: product.id,
        operation: 'update',
        data: product,
        userId: testUserId,
        timestamp: new Date().toISOString(),
        retryCount: 0,
        maxRetries: 3,
        status: 'pending',
      });
    }

    // Queue deletes
    for (let i = 0; i < 10; i++) {
      queueSync({
        id: generateId(),
        entityType: 'product',
        entityId: generateId(),
        operation: 'delete',
        data: {},
        userId: testUserId,
        timestamp: new Date().toISOString(),
        retryCount: 0,
        maxRetries: 3,
        status: 'pending',
      });
    }

    const queue = getSyncQueue();
    expect(queue.length).toBe(50);

    const startTime = performance.now();
    const report = await syncAll(testUserId);
    const endTime = performance.now();

    const duration = endTime - startTime;

    expect(report.totalOperations).toBe(50);
    expect(report.successful).toBe(50);
    expect(duration).toBeLessThan(5000);
    console.log(`Synced 50 mixed operations in ${duration.toFixed(2)}ms`);
  });

  it('should measure sync queue read/write performance', () => {
    const startWrite = performance.now();
    queueMultipleOperations(200, 'product');
    const endWrite = performance.now();

    const writeTime = endWrite - startWrite;

    const startRead = performance.now();
    const queue = getSyncQueue();
    const endRead = performance.now();

    const readTime = endRead - startRead;

    expect(queue.length).toBe(200);
    expect(writeTime).toBeLessThan(1000); // Should write in less than 1 second
    expect(readTime).toBeLessThan(100); // Should read in less than 100ms

    console.log(`Queue write time (200 ops): ${writeTime.toFixed(2)}ms`);
    console.log(`Queue read time (200 ops): ${readTime.toFixed(2)}ms`);
  });

  it('should measure getSyncStatus performance with large queue', () => {
    queueMultipleOperations(500, 'product');

    const startTime = performance.now();
    const status = getSyncStatus();
    const endTime = performance.now();

    const duration = endTime - startTime;

    expect(status.pendingOperations).toBe(500);
    expect(duration).toBeLessThan(100); // Should complete in less than 100ms
    console.log(`getSyncStatus with 500 queued ops: ${duration.toFixed(2)}ms`);
  });

  it('should handle sync with simulated network latency', async () => {
    queueMultipleOperations(20, 'product');

    // Mock API with 50ms delay per call
    const { supabase } = await import('@/integrations/supabase/client');
    vi.mocked(supabase.from).mockImplementation(() => ({
      insert: vi.fn().mockImplementation(() => 
        new Promise(resolve => 
          setTimeout(() => resolve({ data: {}, error: null }), 50)
        )
      ),
      eq: vi.fn().mockReturnThis(),
    } as any));

    const startTime = performance.now();
    const report = await syncAll(testUserId);
    const endTime = performance.now();

    const duration = endTime - startTime;

    expect(report.successful).toBe(20);
    // With 50ms per operation, 20 operations should take ~1000ms
    expect(duration).toBeGreaterThan(900);
    expect(duration).toBeLessThan(2000);
    console.log(`Synced 20 operations with 50ms latency in ${duration.toFixed(2)}ms`);
  });

  it('should measure memory usage of sync queue', () => {
    const initialMemory = (performance as any).memory?.usedJSHeapSize || 0;

    queueMultipleOperations(1000, 'product');

    const afterQueueMemory = (performance as any).memory?.usedJSHeapSize || 0;
    const memoryIncrease = afterQueueMemory - initialMemory;
    const memoryIncreaseMB = memoryIncrease / (1024 * 1024);

    console.log(`Memory increase for 1000 queued operations: ${memoryIncreaseMB.toFixed(2)} MB`);

    // Memory increase should be reasonable (less than 10MB for 1000 operations)
    if (initialMemory > 0) {
      expect(memoryIncreaseMB).toBeLessThan(10);
    }
  });

  it('should benchmark sync throughput', async () => {
    const operationCounts = [10, 25, 50, 100];
    const results: { count: number; duration: number; throughput: number }[] = [];

    for (const count of operationCounts) {
      localStorage.clear();
      queueMultipleOperations(count, 'product');

      const startTime = performance.now();
      await syncAll(testUserId);
      const endTime = performance.now();

      const duration = endTime - startTime;
      const throughput = (count / duration) * 1000; // operations per second

      results.push({ count, duration, throughput });
    }

    console.log('Sync throughput benchmark:');
    results.forEach(r => {
      console.log(`  ${r.count} ops: ${r.duration.toFixed(2)}ms (${r.throughput.toFixed(2)} ops/sec)`);
    });

    // Verify throughput is reasonable (at least 10 ops/sec)
    results.forEach(r => {
      expect(r.throughput).toBeGreaterThan(10);
    });
  });
});
