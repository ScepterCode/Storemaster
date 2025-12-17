/**
 * Integration Tests: Concurrent Operations Across Multiple Entities
 * Tests handling of simultaneous operations on different entity types
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { syncEntity as syncProduct } from '@/services/productService';
import { syncEntity as syncCategory } from '@/services/categoryService';
import { syncEntity as syncCustomer } from '@/services/customerService';
import { syncEntity as syncInvoice } from '@/services/invoiceService';
import { getSyncQueue } from '@/lib/storageManager';
import { Product, Category, Customer, Invoice } from '@/types';
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

describe('Concurrent Operations Across Multiple Entities', () => {
  const testUserId = 'test-user-id';

  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should handle concurrent creates across different entity types', async () => {
    const product: Product = {
      id: generateId(),
      name: 'Concurrent Product',
      quantity: 5,
      unitPrice: 50.00,
      synced: false,
      lastModified: new Date().toISOString(),
    };

    const category: Category = {
      id: generateId(),
      name: 'Concurrent Category',
      synced: false,
      lastModified: new Date().toISOString(),
    };

    const customer: Customer = {
      id: generateId(),
      name: 'Concurrent Customer',
      phone: '9876543210',
      synced: false,
      lastModified: new Date().toISOString(),
    };

    // Execute all operations concurrently
    const results = await Promise.all([
      syncProduct(product, testUserId, 'create'),
      syncCategory(category, testUserId, 'create'),
      syncCustomer(customer, testUserId, 'create'),
    ]);

    // All should succeed
    expect(results[0].success).toBe(true);
    expect(results[1].success).toBe(true);
    expect(results[2].success).toBe(true);

    // All should be synced (API calls succeeded)
    expect(results[0].synced).toBe(true);
    expect(results[1].synced).toBe(true);
    expect(results[2].synced).toBe(true);
  });

  it('should handle concurrent updates to the same product with optimistic locking', async () => {
    const productId = generateId();
    const baseProduct: Product = {
      id: productId,
      name: 'Base Product',
      quantity: 10,
      unitPrice: 100.00,
      synced: true,
      lastModified: '2024-01-01T00:00:00.000Z',
    };

    // Mock API to return current product state
    const { supabase } = await import('@/integrations/supabase/client');
    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnThis(),
      update: vi.fn().mockResolvedValue({ data: {}, error: null }),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ 
        data: { updated_at: '2024-01-01T00:00:00.000Z' }, 
        error: null 
      }),
    } as any);

    // First update should succeed
    const update1: Product = {
      ...baseProduct,
      quantity: 15,
    };

    const result1 = await syncProduct(update1, testUserId, 'update');
    expect(result1.success).toBe(true);

    // Simulate another user's update by changing the timestamp
    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnThis(),
      update: vi.fn().mockResolvedValue({ data: {}, error: null }),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ 
        data: { updated_at: '2024-01-01T01:00:00.000Z' }, // Different timestamp
        error: null 
      }),
    } as any);

    // Second update with old timestamp should fail
    const update2: Product = {
      ...baseProduct,
      quantity: 20,
    };

    try {
      await syncProduct(update2, testUserId, 'update');
      // Should not reach here
      expect(true).toBe(false);
    } catch (error) {
      // Should throw validation error about concurrent modification
      expect(error).toBeDefined();
      expect((error as Error).message).toContain('modified by another user');
    }
  });

  it('should handle mixed success and failure in concurrent operations', async () => {
    const product: Product = {
      id: generateId(),
      name: 'Product Success',
      quantity: 5,
      unitPrice: 50.00,
      synced: false,
      lastModified: new Date().toISOString(),
    };

    const category: Category = {
      id: generateId(),
      name: 'Category Fail',
      synced: false,
      lastModified: new Date().toISOString(),
    };

    // Mock API: product succeeds, category fails
    const { supabase } = await import('@/integrations/supabase/client');
    vi.mocked(supabase.from).mockImplementation((table: string) => {
      if (table === 'products') {
        return {
          insert: vi.fn().mockResolvedValue({ data: {}, error: null }),
          eq: vi.fn().mockReturnThis(),
        } as any;
      } else {
        return {
          insert: vi.fn().mockResolvedValue({ 
            data: null, 
            error: { message: 'Category error', code: 'ERROR' } 
          }),
          eq: vi.fn().mockReturnThis(),
        } as any;
      }
    });

    // Execute concurrently
    const results = await Promise.all([
      syncProduct(product, testUserId, 'create'),
      syncCategory(category, testUserId, 'create'),
    ]);

    // Product should succeed and be synced
    expect(results[0].success).toBe(true);
    expect(results[0].synced).toBe(true);

    // Category should succeed locally but not be synced
    expect(results[1].success).toBe(true);
    expect(results[1].synced).toBe(false);
    expect(results[1].error).toBeDefined();

    // Category should be in sync queue
    const queue = getSyncQueue();
    const categorySync = queue.find(op => op.entityType === 'category');
    expect(categorySync).toBeDefined();
  });

  it('should maintain data consistency across concurrent operations', async () => {
    const categoryId = generateId();
    const category: Category = {
      id: categoryId,
      name: 'Electronics',
      synced: false,
      lastModified: new Date().toISOString(),
    };

    const product1: Product = {
      id: generateId(),
      name: 'Laptop',
      quantity: 3,
      unitPrice: 999.99,
      category: categoryId,
      synced: false,
      lastModified: new Date().toISOString(),
    };

    const product2: Product = {
      id: generateId(),
      name: 'Mouse',
      quantity: 10,
      unitPrice: 29.99,
      category: categoryId,
      synced: false,
      lastModified: new Date().toISOString(),
    };

    // Create category and products concurrently
    const results = await Promise.all([
      syncCategory(category, testUserId, 'create'),
      syncProduct(product1, testUserId, 'create'),
      syncProduct(product2, testUserId, 'create'),
    ]);

    // All should succeed
    results.forEach(result => {
      expect(result.success).toBe(true);
    });

    // Verify products reference the correct category
    expect(results[1].data?.category).toBe(categoryId);
    expect(results[2].data?.category).toBe(categoryId);
  });

  it('should handle rapid sequential updates to the same entity', async () => {
    const productId = generateId();
    const baseProduct: Product = {
      id: productId,
      name: 'Rapid Update Product',
      quantity: 10,
      unitPrice: 100.00,
      synced: true,
      lastModified: new Date().toISOString(),
    };

    // Perform multiple rapid updates
    const updates = [
      { ...baseProduct, quantity: 11 },
      { ...baseProduct, quantity: 12 },
      { ...baseProduct, quantity: 13 },
      { ...baseProduct, quantity: 14 },
      { ...baseProduct, quantity: 15 },
    ];

    // Execute updates sequentially (simulating rapid user actions)
    const results = [];
    for (const update of updates) {
      const result = await syncProduct(update, testUserId, 'update');
      results.push(result);
    }

    // All updates should succeed
    results.forEach(result => {
      expect(result.success).toBe(true);
    });

    // Final quantity should be 15
    const lastResult = results[results.length - 1];
    expect(lastResult.data?.quantity).toBe(15);
  });
});
