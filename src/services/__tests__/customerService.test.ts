/**
 * Unit tests for Customer Service
 * Tests CRUD operations, error scenarios, and sync queue integration
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  fetchCustomersFromAPI,
  createInAPI,
  updateInAPI,
  deleteFromAPI,
  getFromStorage,
  saveToStorage,
  updateInStorage,
  deleteFromStorage,
  syncEntity,
} from '../customerService';
import { Customer } from '@/types';
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

describe('Customer Service', () => {
  const mockCustomer: Customer = {
    id: 'test-customer-1',
    name: 'Test Customer',
    phone: '123-456-7890',
    email: 'test@example.com',
    address: '123 Test St',
    synced: false,
    lastModified: new Date().toISOString(),
  };

  const mockUserId = 'test-user-123';

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  describe('API Operations', () => {
    it('should fetch customers from API', async () => {
      const customers = await fetchCustomersFromAPI(mockUserId);
      expect(Array.isArray(customers)).toBe(true);
    });

    it('should throw error when fetching without userId', async () => {
      await expect(fetchCustomersFromAPI(undefined)).rejects.toThrow(AppError);
    });

    it('should create customer in API', async () => {
      const result = await createInAPI(mockCustomer, mockUserId);
      expect(result.synced).toBe(true);
      expect(result.id).toBe(mockCustomer.id);
    });

    it('should throw validation error when creating without required fields', async () => {
      const invalidCustomer = { ...mockCustomer, name: '' };
      await expect(createInAPI(invalidCustomer, mockUserId)).rejects.toThrow(AppError);
    });

    it('should update customer in API', async () => {
      const result = await updateInAPI(mockCustomer);
      expect(result.synced).toBe(true);
    });

    it('should delete customer from API', async () => {
      await expect(deleteFromAPI(mockCustomer.id)).resolves.not.toThrow();
    });
  });

  describe('Storage Operations', () => {
    it('should get customers from storage', () => {
      const customers = getFromStorage();
      expect(Array.isArray(customers)).toBe(true);
    });

    it('should save customer to storage', () => {
      expect(() => saveToStorage(mockCustomer)).not.toThrow();
    });

    it('should update customer in storage', () => {
      expect(() => updateInStorage(mockCustomer)).not.toThrow();
    });

    it('should delete customer from storage', () => {
      expect(() => deleteFromStorage(mockCustomer.id)).not.toThrow();
    });
  });

  describe('Sync Entity', () => {
    it('should sync customer successfully when API is available', async () => {
      const result = await syncEntity(mockCustomer, mockUserId, 'create');
      
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

      const result = await syncEntity(mockCustomer, mockUserId, 'create');
      
      expect(result.success).toBe(true);
      expect(result.synced).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should throw error when userId is missing', async () => {
      await expect(syncEntity(mockCustomer, '', 'create')).rejects.toThrow(AppError);
    });

    it('should throw validation error for invalid customer', async () => {
      const invalidCustomer = { ...mockCustomer, name: '' };
      await expect(syncEntity(invalidCustomer, mockUserId, 'create')).rejects.toThrow(AppError);
    });
  });
});
