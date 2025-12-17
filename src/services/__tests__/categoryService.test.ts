/**
 * Unit tests for Category Service
 * Tests CRUD operations, error scenarios, and sync queue integration
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  fetchCategoriesFromAPI,
  createInAPI,
  updateInAPI,
  deleteFromAPI,
  getFromStorage,
  saveToStorage,
  updateInStorage,
  deleteFromStorage,
  syncEntity,
} from '../categoryService';
import { Category } from '@/types';
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

describe('Category Service', () => {
  const mockCategory: Category = {
    id: 'test-category-1',
    name: 'Test Category',
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
    it('should fetch categories from API', async () => {
      const categories = await fetchCategoriesFromAPI(mockUserId);
      expect(Array.isArray(categories)).toBe(true);
    });

    it('should throw error when fetching without userId', async () => {
      await expect(fetchCategoriesFromAPI(undefined)).rejects.toThrow(AppError);
    });

    it('should create category in API', async () => {
      const result = await createInAPI(mockCategory, mockUserId);
      expect(result.synced).toBe(true);
      expect(result.id).toBe(mockCategory.id);
    });

    it('should throw validation error when creating without required fields', async () => {
      const invalidCategory = { ...mockCategory, name: '' };
      await expect(createInAPI(invalidCategory, mockUserId)).rejects.toThrow(AppError);
    });

    it('should update category in API', async () => {
      const result = await updateInAPI(mockCategory);
      expect(result.synced).toBe(true);
    });

    it('should throw validation error when updating without category ID', async () => {
      const invalidCategory = { ...mockCategory, id: '' };
      await expect(updateInAPI(invalidCategory)).rejects.toThrow(AppError);
    });

    it('should delete category from API', async () => {
      await expect(deleteFromAPI(mockCategory.id)).resolves.not.toThrow();
    });

    it('should throw validation error when deleting without category ID', async () => {
      await expect(deleteFromAPI('')).rejects.toThrow(AppError);
    });
  });

  describe('Storage Operations', () => {
    it('should get categories from storage', () => {
      const categories = getFromStorage();
      expect(Array.isArray(categories)).toBe(true);
    });

    it('should save category to storage', () => {
      expect(() => saveToStorage(mockCategory)).not.toThrow();
    });

    it('should update category in storage', () => {
      expect(() => updateInStorage(mockCategory)).not.toThrow();
    });

    it('should delete category from storage', () => {
      expect(() => deleteFromStorage(mockCategory.id)).not.toThrow();
    });
  });

  describe('Sync Entity', () => {
    it('should sync category successfully when API is available', async () => {
      const result = await syncEntity(mockCategory, mockUserId, 'create');
      
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

      const result = await syncEntity(mockCategory, mockUserId, 'create');
      
      expect(result.success).toBe(true);
      expect(result.synced).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should throw error when userId is missing', async () => {
      await expect(syncEntity(mockCategory, '', 'create')).rejects.toThrow(AppError);
    });

    it('should throw validation error for invalid category', async () => {
      const invalidCategory = { ...mockCategory, name: '' };
      await expect(syncEntity(invalidCategory, mockUserId, 'create')).rejects.toThrow(AppError);
    });

    it('should handle update operation', async () => {
      const result = await syncEntity(mockCategory, mockUserId, 'update');
      
      expect(result.success).toBe(true);
      expect(result.synced).toBe(true);
    });
  });
});
