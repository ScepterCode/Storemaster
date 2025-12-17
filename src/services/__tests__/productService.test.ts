/**
 * Unit tests for Product Service
 * Tests CRUD operations, error scenarios, and sync queue integration
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  fetchProductsFromAPI,
  createInAPI,
  updateInAPI,
  deleteFromAPI,
  getFromStorage,
  saveToStorage,
  updateInStorage,
  deleteFromStorage,
  syncEntity,
} from '../productService';
import { Product } from '@/types';
import { AppError } from '@/lib/errorHandler';

// Mock dependencies
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        order: vi.fn(() => Promise.resolve({ data: [], error: null })),
      })),
      insert: vi.fn(() => Promise.resolve({ error: null })),
      update: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ error: null })),
      })),
      delete: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ error: null })),
      })),
    })),
  },
}));

vi.mock('@/lib/storageManager', () => ({
  default: {
    getItems: vi.fn(() => []),
    addItem: vi.fn(),
    updateItem: vi.fn(),
    deleteItem: vi.fn(),
    queueSync: vi.fn(),
  },
}));

vi.mock('@/lib/formatter', () => ({
  generateId: vi.fn(() => 'test-id-123'),
}));

describe('Product Service', () => {
  const mockProduct: Product = {
    id: 'test-product-1',
    name: 'Test Product',
    quantity: 10,
    unitPrice: 99.99,
    category: 'test-category',
    description: 'Test description',
    synced: false,
    lastModified: new Date().toISOString(),
  };

  const mockUserId = 'test-user-123';

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  describe('API Operations', () => {
    it('should fetch products from API', async () => {
      const products = await fetchProductsFromAPI(mockUserId);
      expect(Array.isArray(products)).toBe(true);
    });

    it('should throw error when fetching without userId', async () => {
      await expect(fetchProductsFromAPI(undefined)).rejects.toThrow(AppError);
    });

    it('should create product in API', async () => {
      const result = await createInAPI(mockProduct, mockUserId);
      expect(result.synced).toBe(true);
      expect(result.id).toBe(mockProduct.id);
    });

    it('should throw validation error when creating without required fields', async () => {
      const invalidProduct = { ...mockProduct, name: '' };
      await expect(createInAPI(invalidProduct, mockUserId)).rejects.toThrow(AppError);
    });

    it('should update product in API', async () => {
      const result = await updateInAPI(mockProduct);
      expect(result.synced).toBe(true);
    });

    it('should delete product from API', async () => {
      await expect(deleteFromAPI(mockProduct.id)).resolves.not.toThrow();
    });
  });

  describe('Storage Operations', () => {
    it('should get products from storage', () => {
      const products = getFromStorage();
      expect(Array.isArray(products)).toBe(true);
    });

    it('should save product to storage', () => {
      expect(() => saveToStorage(mockProduct)).not.toThrow();
    });

    it('should update product in storage', () => {
      expect(() => updateInStorage(mockProduct)).not.toThrow();
    });

    it('should delete product from storage', () => {
      expect(() => deleteFromStorage(mockProduct.id)).not.toThrow();
    });
  });

  describe('Sync Entity', () => {
    it('should sync product successfully when API is available', async () => {
      const result = await syncEntity(mockProduct, mockUserId, 'create');
      
      expect(result.success).toBe(true);
      expect(result.synced).toBe(true);
      expect(result.data).toBeDefined();
    });

    it('should save locally when API sync fails', async () => {
      // Mock API failure
      const { supabase } = await import('@/integrations/supabase/client');
      vi.mocked(supabase.from).mockReturnValueOnce({
        insert: vi.fn(() => Promise.resolve({ error: new Error('Network error') })),
      } as any);

      const result = await syncEntity(mockProduct, mockUserId, 'create');
      
      expect(result.success).toBe(true);
      expect(result.synced).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should throw error when userId is missing', async () => {
      await expect(syncEntity(mockProduct, '', 'create')).rejects.toThrow(AppError);
    });

    it('should throw validation error for invalid product', async () => {
      const invalidProduct = { ...mockProduct, name: '' };
      await expect(syncEntity(invalidProduct, mockUserId, 'create')).rejects.toThrow(AppError);
    });
  });
});
