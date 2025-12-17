/**
 * Performance Tests: Large Dataset Handling
 * Tests system performance with large amounts of data
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { getItems, addItem, updateItem, deleteItem } from '@/lib/storageManager';
import { syncAll } from '@/services/syncCoordinator';
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

describe('Large Dataset Performance Tests', () => {
  const STORAGE_KEY = 'test_products';

  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
  });

  /**
   * Helper to generate test products
   */
  function generateProducts(count: number): Product[] {
    const products: Product[] = [];
    for (let i = 0; i < count; i++) {
      products.push({
        id: generateId(),
        name: `Product ${i}`,
        quantity: Math.floor(Math.random() * 100),
        unitPrice: Math.random() * 1000,
        category: `category-${i % 10}`,
        description: `Description for product ${i}`,
        synced: true,
        lastModified: new Date().toISOString(),
      });
    }
    return products;
  }

  it('should handle reading 1000 products efficiently', () => {
    const products = generateProducts(1000);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(products));

    const startTime = performance.now();
    const retrieved = getItems<Product>(STORAGE_KEY);
    const endTime = performance.now();

    const duration = endTime - startTime;

    expect(retrieved.length).toBe(1000);
    expect(duration).toBeLessThan(100); // Should complete in less than 100ms
    console.log(`Read 1000 products in ${duration.toFixed(2)}ms`);
  });

  it('should handle writing 1000 products efficiently', () => {
    const products = generateProducts(1000);

    const startTime = performance.now();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
    const endTime = performance.now();

    const duration = endTime - startTime;

    expect(duration).toBeLessThan(200); // Should complete in less than 200ms
    console.log(`Wrote 1000 products in ${duration.toFixed(2)}ms`);
  });

  it('should handle adding items to large dataset efficiently', () => {
    // Start with 500 products
    const initialProducts = generateProducts(500);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(initialProducts));

    // Add 100 more products
    const newProducts = generateProducts(100);
    
    const startTime = performance.now();
    newProducts.forEach(product => {
      addItem(STORAGE_KEY, product);
    });
    const endTime = performance.now();

    const duration = endTime - startTime;
    const retrieved = getItems<Product>(STORAGE_KEY);

    expect(retrieved.length).toBe(600);
    expect(duration).toBeLessThan(500); // Should complete in less than 500ms
    console.log(`Added 100 products to 500 existing in ${duration.toFixed(2)}ms`);
  });

  it('should handle updating items in large dataset efficiently', () => {
    const products = generateProducts(1000);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(products));

    // Update 100 random products
    const toUpdate = products.slice(0, 100).map(p => ({
      ...p,
      quantity: p.quantity + 10,
    }));

    const startTime = performance.now();
    toUpdate.forEach(product => {
      updateItem(STORAGE_KEY, product);
    });
    const endTime = performance.now();

    const duration = endTime - startTime;

    expect(duration).toBeLessThan(500); // Should complete in less than 500ms
    console.log(`Updated 100 products in 1000 dataset in ${duration.toFixed(2)}ms`);
  });

  it('should handle deleting items from large dataset efficiently', () => {
    const products = generateProducts(1000);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(products));

    // Delete 100 products
    const toDelete = products.slice(0, 100);

    const startTime = performance.now();
    toDelete.forEach(product => {
      deleteItem(STORAGE_KEY, product.id);
    });
    const endTime = performance.now();

    const duration = endTime - startTime;
    const retrieved = getItems<Product>(STORAGE_KEY);

    expect(retrieved.length).toBe(900);
    expect(duration).toBeLessThan(500); // Should complete in less than 500ms
    console.log(`Deleted 100 products from 1000 dataset in ${duration.toFixed(2)}ms`);
  });

  it('should handle searching in large dataset efficiently', () => {
    const products = generateProducts(5000);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(products));

    const startTime = performance.now();
    const retrieved = getItems<Product>(STORAGE_KEY);
    const filtered = retrieved.filter(p => p.name.includes('Product 123'));
    const endTime = performance.now();

    const duration = endTime - startTime;

    expect(filtered.length).toBeGreaterThan(0);
    expect(duration).toBeLessThan(150); // Should complete in less than 150ms
    console.log(`Searched 5000 products in ${duration.toFixed(2)}ms`);
  });

  it('should handle sorting large dataset efficiently', () => {
    const products = generateProducts(2000);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(products));

    const startTime = performance.now();
    const retrieved = getItems<Product>(STORAGE_KEY);
    const sorted = [...retrieved].sort((a, b) => a.name.localeCompare(b.name));
    const endTime = performance.now();

    const duration = endTime - startTime;

    expect(sorted.length).toBe(2000);
    expect(sorted[0].name).toBeLessThan(sorted[sorted.length - 1].name);
    expect(duration).toBeLessThan(200); // Should complete in less than 200ms
    console.log(`Sorted 2000 products in ${duration.toFixed(2)}ms`);
  });

  it('should handle multiple entity types efficiently', () => {
    const products = generateProducts(500);
    const categories: Category[] = Array.from({ length: 100 }, (_, i) => ({
      id: generateId(),
      name: `Category ${i}`,
      description: `Description ${i}`,
      synced: true,
      lastModified: new Date().toISOString(),
    }));
    const customers: Customer[] = Array.from({ length: 300 }, (_, i) => ({
      id: generateId(),
      name: `Customer ${i}`,
      phone: `555-${i.toString().padStart(4, '0')}`,
      email: `customer${i}@test.com`,
      synced: true,
      lastModified: new Date().toISOString(),
    }));

    const startTime = performance.now();
    localStorage.setItem('products', JSON.stringify(products));
    localStorage.setItem('categories', JSON.stringify(categories));
    localStorage.setItem('customers', JSON.stringify(customers));
    const endTime = performance.now();

    const duration = endTime - startTime;

    expect(duration).toBeLessThan(300); // Should complete in less than 300ms
    console.log(`Stored 900 total entities across 3 types in ${duration.toFixed(2)}ms`);
  });

  it('should measure localStorage usage with large datasets', () => {
    const products = generateProducts(1000);
    const jsonString = JSON.stringify(products);
    const sizeInBytes = new Blob([jsonString]).size;
    const sizeInKB = sizeInBytes / 1024;
    const sizeInMB = sizeInKB / 1024;

    localStorage.setItem(STORAGE_KEY, jsonString);

    console.log(`1000 products storage size: ${sizeInKB.toFixed(2)} KB (${sizeInMB.toFixed(2)} MB)`);
    
    // Verify it's within reasonable limits (should be less than 5MB for 1000 products)
    expect(sizeInMB).toBeLessThan(5);
  });

  it('should estimate localStorage capacity', () => {
    const testSizes = [100, 500, 1000, 2000];
    const measurements: { count: number; sizeKB: number }[] = [];

    testSizes.forEach(count => {
      const products = generateProducts(count);
      const jsonString = JSON.stringify(products);
      const sizeInBytes = new Blob([jsonString]).size;
      const sizeInKB = sizeInBytes / 1024;
      
      measurements.push({ count, sizeKB });
    });

    console.log('Storage size measurements:');
    measurements.forEach(m => {
      console.log(`  ${m.count} products: ${m.sizeKB.toFixed(2)} KB`);
    });

    // Calculate average size per product
    const avgSizePerProduct = measurements.reduce((sum, m) => sum + (m.sizeKB / m.count), 0) / measurements.length;
    console.log(`Average size per product: ${avgSizePerProduct.toFixed(2)} KB`);

    // Estimate max products for 5MB limit (typical localStorage limit is 5-10MB)
    const maxProducts = Math.floor((5 * 1024) / avgSizePerProduct);
    console.log(`Estimated max products for 5MB: ${maxProducts}`);

    expect(maxProducts).toBeGreaterThan(1000); // Should support at least 1000 products
  });
});
