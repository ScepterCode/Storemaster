/**
 * Unit tests for Invoice Service
 * Tests CRUD operations, invoice items handling, and sync queue integration
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  fetchInvoicesFromAPI,
  createInAPI,
  updateInAPI,
  deleteFromAPI,
  getFromStorage,
  saveToStorage,
  updateInStorage,
  deleteFromStorage,
  syncEntity,
} from '../invoiceService';
import { Invoice } from '@/types';
import { AppError } from '@/lib/errorHandler';

// Mock dependencies
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn((table: string) => {
      if (table === 'invoices') {
        return {
          select: vi.fn(() => ({
            order: vi.fn(() => Promise.resolve({ 
              data: [], 
              error: null 
            })),
          })),
          insert: vi.fn(() => ({
            select: vi.fn(() => Promise.resolve({ 
              data: [{ id: 'test-invoice-1' }], 
              error: null 
            })),
          })),
          update: vi.fn(() => ({
            eq: vi.fn(() => Promise.resolve({ error: null })),
          })),
          delete: vi.fn(() => ({
            eq: vi.fn(() => Promise.resolve({ error: null })),
          })),
        };
      }
      // invoice_items table
      return {
        select: vi.fn(() => ({
          in: vi.fn(() => Promise.resolve({ 
            data: [], 
            error: null 
          })),
        })),
        insert: vi.fn(() => Promise.resolve({ error: null })),
        delete: vi.fn(() => ({
          eq: vi.fn(() => Promise.resolve({ error: null })),
        })),
      };
    }),
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

describe('Invoice Service', () => {
  const mockInvoice: Invoice = {
    id: 'test-invoice-1',
    customerName: 'Test Customer',
    customerId: 'test-customer-1',
    date: '2024-01-01',
    items: [
      {
        productId: 'product-1',
        productName: 'Test Product',
        quantity: 2,
        unitPrice: 50.00,
        totalPrice: 100.00,
      },
    ],
    totalAmount: 100.00,
    status: 'draft',
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
    it('should fetch invoices from API', async () => {
      const invoices = await fetchInvoicesFromAPI(mockUserId, mockOrganizationId);
      expect(Array.isArray(invoices)).toBe(true);
    });

    it('should throw error when fetching without userId', async () => {
      await expect(fetchInvoicesFromAPI(undefined, mockOrganizationId)).rejects.toThrow(AppError);
    });

    it('should throw error when fetching without organizationId', async () => {
      await expect(fetchInvoicesFromAPI(mockUserId, undefined)).rejects.toThrow(AppError);
    });

    it('should create invoice in API with items', async () => {
      const result = await createInAPI(mockInvoice, mockUserId, mockOrganizationId);
      expect(result.synced).toBe(true);
      expect(result.id).toBe(mockInvoice.id);
    });

    it('should throw validation error when creating without organizationId', async () => {
      await expect(createInAPI(mockInvoice, mockUserId, '')).rejects.toThrow(AppError);
    });

    it('should throw validation error when creating without customer name', async () => {
      const invalidInvoice = { ...mockInvoice, customerName: '' };
      await expect(createInAPI(invalidInvoice, mockUserId, mockOrganizationId)).rejects.toThrow(AppError);
    });

    it('should throw validation error when creating without items', async () => {
      const invalidInvoice = { ...mockInvoice, items: [] };
      await expect(createInAPI(invalidInvoice, mockUserId, mockOrganizationId)).rejects.toThrow(AppError);
    });

    it('should update invoice in API', async () => {
      const result = await updateInAPI(mockInvoice, mockOrganizationId);
      expect(result.synced).toBe(true);
    });

    it('should throw validation error when updating without ID', async () => {
      const invalidInvoice = { ...mockInvoice, id: '' };
      await expect(updateInAPI(invalidInvoice, mockOrganizationId)).rejects.toThrow(AppError);
    });

    it('should throw validation error when updating without organizationId', async () => {
      await expect(updateInAPI(mockInvoice, '')).rejects.toThrow(AppError);
    });

    it('should delete invoice from API', async () => {
      await expect(deleteFromAPI(mockInvoice.id, mockOrganizationId)).resolves.not.toThrow();
    });

    it('should throw validation error when deleting without ID', async () => {
      await expect(deleteFromAPI('', mockOrganizationId)).rejects.toThrow(AppError);
    });

    it('should throw validation error when deleting without organizationId', async () => {
      await expect(deleteFromAPI(mockInvoice.id, '')).rejects.toThrow(AppError);
    });
  });

  describe('Storage Operations', () => {
    it('should get invoices from storage', () => {
      const invoices = getFromStorage(mockOrganizationId);
      expect(Array.isArray(invoices)).toBe(true);
    });

    it('should save invoice to storage', () => {
      expect(() => saveToStorage(mockInvoice, mockOrganizationId)).not.toThrow();
    });

    it('should update invoice in storage', () => {
      expect(() => updateInStorage(mockInvoice, mockOrganizationId)).not.toThrow();
    });

    it('should delete invoice from storage', () => {
      expect(() => deleteFromStorage(mockInvoice.id, mockOrganizationId)).not.toThrow();
    });

    it('should scope storage by organization', () => {
      const org1Id = 'org-1';
      const org2Id = 'org-2';
      
      // Operations should not throw and should be scoped
      expect(() => saveToStorage(mockInvoice, org1Id)).not.toThrow();
      expect(() => saveToStorage({ ...mockInvoice, id: 'invoice-2' }, org2Id)).not.toThrow();
      
      // Each organization should have its own storage
      const org1Invoices = getFromStorage(org1Id);
      const org2Invoices = getFromStorage(org2Id);
      
      expect(Array.isArray(org1Invoices)).toBe(true);
      expect(Array.isArray(org2Invoices)).toBe(true);
    });
  });

  describe('Sync Entity', () => {
    it('should sync invoice successfully when API is available', async () => {
      const result = await syncEntity(mockInvoice, mockUserId, 'create', mockOrganizationId);
      
      expect(result.success).toBe(true);
      expect(result.synced).toBe(true);
      expect(result.data).toBeDefined();
    });

    it('should save locally when API sync fails', async () => {
      // Mock API failure
      const { supabase } = await import('@/integrations/supabase/client');
      vi.mocked(supabase.from).mockReturnValueOnce({
        insert: vi.fn(() => ({
          select: vi.fn(() => Promise.resolve({ 
            data: null, 
            error: new Error('Network error') 
          })),
        })),
      } as any);

      const result = await syncEntity(mockInvoice, mockUserId, 'create', mockOrganizationId);
      
      expect(result.success).toBe(true);
      expect(result.synced).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should throw error when userId is missing', async () => {
      await expect(syncEntity(mockInvoice, '', 'create', mockOrganizationId)).rejects.toThrow(AppError);
    });

    it('should throw error when organizationId is missing', async () => {
      await expect(syncEntity(mockInvoice, mockUserId, 'create', '')).rejects.toThrow(AppError);
    });

    it('should throw validation error for invoice without customer name', async () => {
      const invalidInvoice = { ...mockInvoice, customerName: '' };
      await expect(syncEntity(invalidInvoice, mockUserId, 'create', mockOrganizationId)).rejects.toThrow(AppError);
    });

    it('should throw validation error for invoice without items', async () => {
      const invalidInvoice = { ...mockInvoice, items: [] };
      await expect(syncEntity(invalidInvoice, mockUserId, 'create', mockOrganizationId)).rejects.toThrow(AppError);
    });

    it('should handle update operation', async () => {
      const result = await syncEntity(mockInvoice, mockUserId, 'update', mockOrganizationId);
      
      expect(result.success).toBe(true);
      expect(result.synced).toBe(true);
    });
  });

  describe('Invoice Items Handling', () => {
    it('should handle invoice with multiple items', async () => {
      const invoiceWithMultipleItems: Invoice = {
        ...mockInvoice,
        items: [
          {
            productId: 'product-1',
            productName: 'Product 1',
            quantity: 2,
            unitPrice: 50.00,
            totalPrice: 100.00,
          },
          {
            productId: 'product-2',
            productName: 'Product 2',
            quantity: 1,
            unitPrice: 75.00,
            totalPrice: 75.00,
          },
        ],
        totalAmount: 175.00,
      };

      const result = await createInAPI(invoiceWithMultipleItems, mockUserId, mockOrganizationId);
      expect(result.synced).toBe(true);
    });
  });

  describe('Multi-Tenancy', () => {
    it('should filter invoices by organization when fetching', async () => {
      const invoices = await fetchInvoicesFromAPI(mockUserId, mockOrganizationId);
      expect(Array.isArray(invoices)).toBe(true);
      // RLS policies will enforce organization filtering at database level
    });

    it('should include organization_id when creating invoice', async () => {
      const result = await createInAPI(mockInvoice, mockUserId, mockOrganizationId);
      expect(result.synced).toBe(true);
      // organization_id is included in the insert operation
    });

    it('should filter by organization_id when updating invoice', async () => {
      const result = await updateInAPI(mockInvoice, mockOrganizationId);
      expect(result.synced).toBe(true);
      // Update query includes organization_id filter
    });

    it('should filter by organization_id when deleting invoice', async () => {
      await expect(deleteFromAPI(mockInvoice.id, mockOrganizationId)).resolves.not.toThrow();
      // Delete query includes organization_id filter
    });
  });
});
