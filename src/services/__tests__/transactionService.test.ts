/**
 * Unit tests for Transaction Service
 * Tests data validation and storage operations
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  fetchFromAPI,
  createInAPI,
  updateInAPI,
  deleteFromAPI,
  getFromStorage,
  saveToStorage,
  updateInStorage,
  deleteFromStorage,
  syncEntity,
} from '../transactionService';
import { Transaction } from '@/types';
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

describe('Transaction Service', () => {
  const mockTransaction: Transaction = {
    id: 'test-transaction-1',
    amount: 150.50,
    description: 'Test transaction',
    date: '2024-01-15',
    type: 'sale',
    category: 'retail',
    reference: 'REF-001',
    synced: false,
    lastModified: new Date().toISOString(),
  };

  const mockUserId = 'test-user-123';
  const mockOrganizationId = 'test-org-123';

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  describe('API Operations', () => {
    it('should fetch transactions from API', async () => {
      const transactions = await fetchFromAPI(mockUserId, mockOrganizationId);
      expect(Array.isArray(transactions)).toBe(true);
    });

    it('should throw error when fetching without userId', async () => {
      await expect(fetchFromAPI(undefined, mockOrganizationId)).rejects.toThrow(AppError);
    });

    it('should create transaction in API with organization', async () => {
      const result = await createInAPI(mockTransaction, mockUserId, mockOrganizationId);
      expect(result.synced).toBe(true);
      expect(result.id).toBe(mockTransaction.id);
    });

    it('should throw validation error when creating without organizationId', async () => {
      await expect(createInAPI(mockTransaction, mockUserId, '')).rejects.toThrow(AppError);
    });

    it('should throw validation error when creating without amount', async () => {
      const invalidTransaction = { ...mockTransaction, amount: 0 };
      await expect(createInAPI(invalidTransaction, mockUserId, mockOrganizationId)).rejects.toThrow(AppError);
    });

    it('should throw validation error when creating without description', async () => {
      const invalidTransaction = { ...mockTransaction, description: '' };
      await expect(createInAPI(invalidTransaction, mockUserId, mockOrganizationId)).rejects.toThrow(AppError);
    });

    it('should throw validation error when creating without date', async () => {
      const invalidTransaction = { ...mockTransaction, date: '' };
      await expect(createInAPI(invalidTransaction, mockUserId, mockOrganizationId)).rejects.toThrow(AppError);
    });

    it('should throw validation error when creating with invalid type', async () => {
      const invalidTransaction = { ...mockTransaction, type: 'invalid' as any };
      await expect(createInAPI(invalidTransaction, mockUserId, mockOrganizationId)).rejects.toThrow(AppError);
    });

    it('should update transaction in API', async () => {
      const result = await updateInAPI(mockTransaction);
      expect(result.synced).toBe(true);
    });

    it('should delete transaction from API', async () => {
      await expect(deleteFromAPI(mockTransaction.id)).resolves.not.toThrow();
    });
  });

  describe('Storage Operations', () => {
    it('should get transactions from storage with organization scope', () => {
      const transactions = getFromStorage(mockOrganizationId);
      expect(Array.isArray(transactions)).toBe(true);
    });

    it('should save transaction to storage with organization scope', () => {
      expect(() => saveToStorage(mockTransaction, mockOrganizationId)).not.toThrow();
    });

    it('should update transaction in storage with organization scope', () => {
      expect(() => updateInStorage(mockTransaction, mockOrganizationId)).not.toThrow();
    });

    it('should delete transaction from storage with organization scope', () => {
      expect(() => deleteFromStorage(mockTransaction.id, mockOrganizationId)).not.toThrow();
    });

    it('should support legacy storage without organization scope', () => {
      const transactions = getFromStorage();
      expect(Array.isArray(transactions)).toBe(true);
    });
  });

  describe('Data Validation', () => {
    it('should accept valid sale transaction', async () => {
      const saleTransaction = { ...mockTransaction, type: 'sale' as const };
      const result = await createInAPI(saleTransaction, mockUserId, mockOrganizationId);
      expect(result.synced).toBe(true);
    });

    it('should accept valid purchase transaction', async () => {
      const purchaseTransaction = { ...mockTransaction, type: 'purchase' as const };
      const result = await createInAPI(purchaseTransaction, mockUserId, mockOrganizationId);
      expect(result.synced).toBe(true);
    });

    it('should accept valid expense transaction', async () => {
      const expenseTransaction = { ...mockTransaction, type: 'expense' as const };
      const result = await createInAPI(expenseTransaction, mockUserId, mockOrganizationId);
      expect(result.synced).toBe(true);
    });

    it('should reject transaction with negative amount', async () => {
      const invalidTransaction = { ...mockTransaction, amount: -50 };
      await expect(createInAPI(invalidTransaction, mockUserId, mockOrganizationId)).rejects.toThrow(AppError);
    });

    it('should reject transaction with zero amount', async () => {
      const invalidTransaction = { ...mockTransaction, amount: 0 };
      await expect(createInAPI(invalidTransaction, mockUserId, mockOrganizationId)).rejects.toThrow(AppError);
    });
  });

  describe('Sync Entity', () => {
    it('should sync transaction successfully when API is available', async () => {
      const result = await syncEntity(mockTransaction, mockUserId, 'create', mockOrganizationId);
      
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

      const result = await syncEntity(mockTransaction, mockUserId, 'create', mockOrganizationId);
      
      expect(result.success).toBe(true);
      expect(result.synced).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should throw error when userId is missing', async () => {
      await expect(syncEntity(mockTransaction, '', 'create', mockOrganizationId)).rejects.toThrow(AppError);
    });

    it('should throw error when organizationId is missing', async () => {
      await expect(syncEntity(mockTransaction, mockUserId, 'create', '')).rejects.toThrow(AppError);
    });

    it('should throw validation error for invalid transaction', async () => {
      const invalidTransaction = { ...mockTransaction, amount: 0 };
      await expect(syncEntity(invalidTransaction, mockUserId, 'create', mockOrganizationId)).rejects.toThrow(AppError);
    });

    it('should handle update operation', async () => {
      const result = await syncEntity(mockTransaction, mockUserId, 'update', mockOrganizationId);
      
      expect(result.success).toBe(true);
      expect(result.synced).toBe(true);
    });
  });
});
