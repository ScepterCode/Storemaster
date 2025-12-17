/**
 * Integration tests for useSale hook
 * Tests complete sale flow from item selection to inventory update
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useSale } from '../useSale';
import * as productService from '@/services/productService';
import * as transactionService from '@/services/transactionService';
import { Product, Transaction } from '@/types';
import { SaleItem, PaymentMethod } from '@/types/cashdesk';

// Mock dependencies
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'test-user-123', email: 'test@example.com' },
  }),
}));

vi.mock('@/components/ui/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

vi.mock('@/hooks/useProducts', () => ({
  useProducts: () => ({
    products: mockProducts,
    refreshProducts: vi.fn(),
  }),
}));

vi.mock('@/hooks/useCashdeskSession', () => ({
  useCashdeskSession: () => ({
    currentSession: {
      id: 'session-123',
      totalSales: 0,
      transactionCount: 0,
    },
    updateSession: vi.fn(),
  }),
}));

// Mock product service
vi.mock('@/services/productService', () => ({
  syncEntity: vi.fn(),
}));

// Mock transaction service
vi.mock('@/services/transactionService', () => ({
  syncEntity: vi.fn(),
}));

const mockProducts: Product[] = [
  {
    id: 'product-1',
    name: 'Test Product 1',
    quantity: 50,
    unitPrice: 10.0,
    category: 'test-category',
    synced: true,
    lastModified: '2024-01-01T00:00:00Z',
  },
  {
    id: 'product-2',
    name: 'Test Product 2',
    quantity: 20,
    unitPrice: 25.0,
    synced: true,
    lastModified: '2024-01-01T00:00:00Z',
  },
];

describe('useSale Integration Tests', () => {
  const sessionId = 'test-session-123';

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  describe('Complete Sale Flow', () => {
    it('should process a complete sale with inventory update and transaction persistence', async () => {
      // Setup mocks
      const mockProductSyncResult = {
        success: true,
        synced: true,
        data: { ...mockProducts[0], quantity: 45 },
      };

      const mockTransactionSyncResult = {
        success: true,
        synced: true,
        data: {} as Transaction,
      };

      vi.mocked(productService.syncEntity).mockResolvedValue(mockProductSyncResult);
      vi.mocked(transactionService.syncEntity).mockResolvedValue(mockTransactionSyncResult);

      const { result } = renderHook(() => useSale(sessionId));

      // Add item to sale
      act(() => {
        const saleItem: Omit<SaleItem, 'id'> = {
          productId: 'product-1',
          productName: 'Test Product 1',
          unitPrice: 10.0,
          quantity: 5,
          subtotal: 50.0,
          total: 50.0,
        };
        result.current.addItem(saleItem);
      });

      // Verify item was added
      expect(result.current.currentSale.items).toHaveLength(1);
      expect(result.current.currentSale.items[0].quantity).toBe(5);

      // Process sale
      const payments: PaymentMethod[] = [
        {
          type: 'cash',
          amount: 53.75,
        },
      ];

      await act(async () => {
        await result.current.processSale(payments);
      });

      // Verify product service was called to update inventory
      await waitFor(() => {
        expect(productService.syncEntity).toHaveBeenCalledWith(
          expect.objectContaining({
            id: 'product-1',
            quantity: 45, // 50 - 5
          }),
          'test-user-123',
          'update'
        );
      });

      // Verify transaction service was called
      await waitFor(() => {
        expect(transactionService.syncEntity).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'sale',
            amount: expect.any(Number),
          }),
          'test-user-123',
          'create'
        );
      });

      // Verify sale was reset
      expect(result.current.currentSale.items).toHaveLength(0);
    });

    it('should handle multiple items in a sale', async () => {
      const mockProductSyncResult = {
        success: true,
        synced: true,
      };

      const mockTransactionSyncResult = {
        success: true,
        synced: true,
      };

      vi.mocked(productService.syncEntity).mockResolvedValue(mockProductSyncResult);
      vi.mocked(transactionService.syncEntity).mockResolvedValue(mockTransactionSyncResult);

      const { result } = renderHook(() => useSale(sessionId));

      // Add multiple items
      act(() => {
        result.current.addItem({
          productId: 'product-1',
          productName: 'Test Product 1',
          unitPrice: 10.0,
          quantity: 3,
          subtotal: 30.0,
          total: 30.0,
        });

        result.current.addItem({
          productId: 'product-2',
          productName: 'Test Product 2',
          unitPrice: 25.0,
          quantity: 2,
          subtotal: 50.0,
          total: 50.0,
        });
      });

      expect(result.current.currentSale.items).toHaveLength(2);

      // Process sale
      await act(async () => {
        await result.current.processSale([{ type: 'cash', amount: 100 }]);
      });

      // Verify both products were updated
      await waitFor(() => {
        expect(productService.syncEntity).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('Stock Validation', () => {
    it('should prevent sale when insufficient stock', async () => {
      const { result } = renderHook(() => useSale(sessionId));

      // Try to add more items than available
      act(() => {
        result.current.addItem({
          productId: 'product-2',
          productName: 'Test Product 2',
          unitPrice: 25.0,
          quantity: 25, // More than available (20)
          subtotal: 625.0,
          total: 625.0,
        });
      });

      // Try to process sale
      await act(async () => {
        await result.current.processSale([{ type: 'cash', amount: 700 }]);
      });

      // Verify product service was NOT called
      expect(productService.syncEntity).not.toHaveBeenCalled();
      
      // Verify transaction service was NOT called
      expect(transactionService.syncEntity).not.toHaveBeenCalled();
    });

    it('should validate stock for all items before processing', async () => {
      const { result } = renderHook(() => useSale(sessionId));

      // Add valid item
      act(() => {
        result.current.addItem({
          productId: 'product-1',
          productName: 'Test Product 1',
          unitPrice: 10.0,
          quantity: 5,
          subtotal: 50.0,
          total: 50.0,
        });

        // Add item with insufficient stock
        result.current.addItem({
          productId: 'product-2',
          productName: 'Test Product 2',
          unitPrice: 25.0,
          quantity: 25,
          subtotal: 625.0,
          total: 625.0,
        });
      });

      // Try to process sale
      await act(async () => {
        await result.current.processSale([{ type: 'cash', amount: 700 }]);
      });

      // Verify no updates were made
      expect(productService.syncEntity).not.toHaveBeenCalled();
    });
  });

  describe('Transaction Persistence', () => {
    it('should create transaction record with correct details', async () => {
      const mockProductSyncResult = {
        success: true,
        synced: true,
      };

      const mockTransactionSyncResult = {
        success: true,
        synced: true,
      };

      vi.mocked(productService.syncEntity).mockResolvedValue(mockProductSyncResult);
      vi.mocked(transactionService.syncEntity).mockResolvedValue(mockTransactionSyncResult);

      const { result } = renderHook(() => useSale(sessionId));

      // Add item
      act(() => {
        result.current.addItem({
          productId: 'product-1',
          productName: 'Test Product 1',
          unitPrice: 10.0,
          quantity: 5,
          subtotal: 50.0,
          total: 50.0,
        });
      });

      // Process sale
      await act(async () => {
        await result.current.processSale([{ type: 'cash', amount: 60 }]);
      });

      // Verify transaction was created with correct type and amount
      await waitFor(() => {
        expect(transactionService.syncEntity).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'sale',
            amount: expect.any(Number),
            description: expect.stringContaining('Test Product 1'),
            category: 'sales',
          }),
          'test-user-123',
          'create'
        );
      });
    });

    it('should continue sale even if transaction persistence fails', async () => {
      const mockProductSyncResult = {
        success: true,
        synced: true,
      };

      const mockTransactionSyncResult = {
        success: false,
        synced: false,
        error: new Error('Transaction save failed'),
      };

      vi.mocked(productService.syncEntity).mockResolvedValue(mockProductSyncResult);
      vi.mocked(transactionService.syncEntity).mockResolvedValue(mockTransactionSyncResult);

      const { result } = renderHook(() => useSale(sessionId));

      // Add item
      act(() => {
        result.current.addItem({
          productId: 'product-1',
          productName: 'Test Product 1',
          unitPrice: 10.0,
          quantity: 5,
          subtotal: 50.0,
          total: 50.0,
        });
      });

      // Process sale
      await act(async () => {
        await result.current.processSale([{ type: 'cash', amount: 60 }]);
      });

      // Verify sale was still completed (items cleared)
      expect(result.current.currentSale.items).toHaveLength(0);
    });
  });

  describe('Concurrent Update Handling', () => {
    it('should detect and handle concurrent inventory updates', async () => {
      const mockConflictError = new Error('Product was modified by another user. Please refresh and try again.');
      
      const mockProductSyncResult = {
        success: false,
        synced: false,
        error: mockConflictError,
      };

      vi.mocked(productService.syncEntity).mockResolvedValue(mockProductSyncResult);

      const { result } = renderHook(() => useSale(sessionId));

      // Add item
      act(() => {
        result.current.addItem({
          productId: 'product-1',
          productName: 'Test Product 1',
          unitPrice: 10.0,
          quantity: 5,
          subtotal: 50.0,
          total: 50.0,
        });
      });

      // Process sale
      await act(async () => {
        await result.current.processSale([{ type: 'cash', amount: 60 }]);
      });

      // Verify sale was not completed (items still present)
      expect(result.current.currentSale.items).toHaveLength(1);
      
      // Verify transaction was not created
      expect(transactionService.syncEntity).not.toHaveBeenCalled();
    });
  });

  describe('Sale Item Management', () => {
    it('should update quantity when adding same product twice', async () => {
      const { result } = renderHook(() => useSale(sessionId));

      // Add item first time
      act(() => {
        result.current.addItem({
          productId: 'product-1',
          productName: 'Test Product 1',
          unitPrice: 10.0,
          quantity: 3,
          subtotal: 30.0,
          total: 30.0,
        });
      });

      expect(result.current.currentSale.items).toHaveLength(1);
      expect(result.current.currentSale.items[0].quantity).toBe(3);

      // Add same item again
      act(() => {
        result.current.addItem({
          productId: 'product-1',
          productName: 'Test Product 1',
          unitPrice: 10.0,
          quantity: 2,
          subtotal: 20.0,
          total: 20.0,
        });
      });

      // Should still have one item with combined quantity
      expect(result.current.currentSale.items).toHaveLength(1);
      expect(result.current.currentSale.items[0].quantity).toBe(5);
    });

    it('should remove item when quantity is set to 0', async () => {
      const { result } = renderHook(() => useSale(sessionId));

      // Add item
      act(() => {
        result.current.addItem({
          productId: 'product-1',
          productName: 'Test Product 1',
          unitPrice: 10.0,
          quantity: 5,
          subtotal: 50.0,
          total: 50.0,
        });
      });

      const itemId = result.current.currentSale.items[0].id;

      // Update quantity to 0
      act(() => {
        result.current.updateQuantity(itemId, 0);
      });

      // Item should be removed
      expect(result.current.currentSale.items).toHaveLength(0);
    });
  });
});
