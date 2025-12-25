import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BatchService } from '../batchService';
import { supabase } from '@/integrations/supabase/client';

// Mock supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn()
        }))
      })),
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn(() => ({
            order: vi.fn()
          }))
        })),
        lte: vi.fn(() => ({
          gt: vi.fn(() => ({
            order: vi.fn()
          }))
        }))
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn()
          }))
        }))
      })),
      delete: vi.fn(() => ({
        eq: vi.fn()
      })),
      rpc: vi.fn()
    }))
  }
}));

describe('BatchService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createBatch', () => {
    it('should create a new batch successfully', async () => {
      const mockBatch = {
        id: 'batch-123',
        product_id: 'product-123',
        batch_number: 'MILK-20241223-ABC',
        quantity_received: 100,
        quantity_current: 100,
        unit_cost: 2.50,
        received_date: '2024-12-23',
        expiry_date: '2025-01-22',
        supplier_name: 'Fresh Dairy Co',
        supplier_reference: 'INV-2024-001',
        notes: 'Grade A milk',
        synced: false,
        last_modified: '2024-12-23T10:00:00Z'
      };

      const mockSupabaseResponse = { data: mockBatch, error: null };
      
      // Mock the supabase chain
      const mockSingle = vi.fn().mockResolvedValue(mockSupabaseResponse);
      const mockSelect = vi.fn().mockReturnValue({ single: mockSingle });
      const mockInsert = vi.fn().mockReturnValue({ select: mockSelect });
      const mockFrom = vi.fn().mockReturnValue({ insert: mockInsert });
      
      (supabase.from as any).mockImplementation(mockFrom);

      const batchData = {
        productId: 'product-123',
        batchNumber: 'MILK-20241223-ABC',
        quantityReceived: 100,
        quantityCurrent: 100,
        unitCost: 2.50,
        receivedDate: '2024-12-23',
        expiryDate: '2025-01-22',
        supplierName: 'Fresh Dairy Co',
        supplierReference: 'INV-2024-001',
        notes: 'Grade A milk'
      };

      const result = await BatchService.createBatch(batchData);

      expect(mockFrom).toHaveBeenCalledWith('product_batches');
      expect(result.id).toBeDefined();
      expect(result.productId).toBe('product-123');
      expect(result.batchNumber).toBe('MILK-20241223-ABC');
      expect(result.quantityReceived).toBe(100);
    });

    it('should handle creation errors', async () => {
      const mockError = new Error('Database error');
      const mockSupabaseResponse = { data: null, error: mockError };
      
      const mockSingle = vi.fn().mockResolvedValue(mockSupabaseResponse);
      const mockSelect = vi.fn().mockReturnValue({ single: mockSingle });
      const mockInsert = vi.fn().mockReturnValue({ select: mockSelect });
      const mockFrom = vi.fn().mockReturnValue({ insert: mockInsert });
      
      (supabase.from as any).mockImplementation(mockFrom);

      const batchData = {
        productId: 'product-123',
        batchNumber: 'MILK-20241223-ABC',
        quantityReceived: 100,
        quantityCurrent: 100,
        receivedDate: '2024-12-23'
      };

      await expect(BatchService.createBatch(batchData)).rejects.toThrow('Database error');
    });
  });

  describe('getExpiringBatches', () => {
    it('should return batches expiring within specified days', async () => {
      const mockBatches = [
        {
          id: 'batch-1',
          product_id: 'product-1',
          batch_number: 'MILK-001',
          quantity_current: 50,
          expiry_date: '2024-12-30',
          products: { name: 'Milk' }
        }
      ];

      const mockSupabaseResponse = { data: mockBatches, error: null };
      
      const mockOrder = vi.fn().mockResolvedValue(mockSupabaseResponse);
      const mockGt = vi.fn().mockReturnValue({ order: mockOrder });
      const mockLte = vi.fn().mockReturnValue({ gt: mockGt });
      const mockSelect = vi.fn().mockReturnValue({ lte: mockLte });
      const mockFrom = vi.fn().mockReturnValue({ select: mockSelect });
      
      (supabase.from as any).mockImplementation(mockFrom);

      const result = await BatchService.getExpiringBatches(7);

      expect(mockFrom).toHaveBeenCalledWith('product_batches');
      expect(result).toHaveLength(1);
      expect(result[0].batchNumber).toBe('MILK-001');
    });
  });

  describe('generateBatchNumber', () => {
    it('should generate a valid batch number', () => {
      const productName = 'Fresh Milk';
      const receivedDate = new Date('2024-12-23');
      
      const batchNumber = BatchService.generateBatchNumber(productName, receivedDate);
      
      expect(batchNumber).toMatch(/^FRE-20241223-[A-Z0-9]{3}$/);
    });

    it('should generate different batch numbers for same product', () => {
      const productName = 'Fresh Milk';
      const receivedDate = new Date('2024-12-23');
      
      const batch1 = BatchService.generateBatchNumber(productName, receivedDate);
      const batch2 = BatchService.generateBatchNumber(productName, receivedDate);
      
      expect(batch1).not.toBe(batch2);
    });
  });

  describe('allocateStock', () => {
    it('should allocate stock using FEFO method', async () => {
      const mockAllocations = [
        {
          batch_id: 'batch-1',
          allocated_quantity: 25,
          unit_cost: 2.50
        },
        {
          batch_id: 'batch-2', 
          allocated_quantity: 25,
          unit_cost: 2.60
        }
      ];

      const mockSupabaseResponse = { data: mockAllocations, error: null };
      
      // Mock the rpc function directly
      const mockRpc = vi.fn().mockResolvedValue(mockSupabaseResponse);
      const mockFrom = vi.fn().mockReturnValue({ rpc: mockRpc });
      
      (supabase.from as any).mockImplementation(mockFrom);
      (supabase.rpc as any) = mockRpc;

      const result = await BatchService.allocateStock('product-123', 50, 'sale', 'sale-123');

      expect(mockRpc).toHaveBeenCalledWith('allocate_stock_fefo', {
        p_product_id: 'product-123',
        p_quantity_needed: 50,
        p_reference_type: 'sale',
        p_reference_id: 'sale-123'
      });

      expect(result).toHaveLength(2);
      expect(result[0].allocatedQuantity).toBe(25);
      expect(result[1].allocatedQuantity).toBe(25);
    });
  });
});

// Integration test for batch workflow
describe('BatchService Integration', () => {
  it('should handle complete batch lifecycle', async () => {
    // This would be a more comprehensive test that would run against a real database
    // For now, we'll just verify the service methods exist and have correct signatures
    
    expect(typeof BatchService.createBatch).toBe('function');
    expect(typeof BatchService.getBatchesForProduct).toBe('function');
    expect(typeof BatchService.getExpiringBatches).toBe('function');
    expect(typeof BatchService.getExpiredBatches).toBe('function');
    expect(typeof BatchService.allocateStock).toBe('function');
    expect(typeof BatchService.addStock).toBe('function');
    expect(typeof BatchService.adjustBatchQuantity).toBe('function');
    expect(typeof BatchService.updateBatch).toBe('function');
    expect(typeof BatchService.deleteBatch).toBe('function');
    expect(typeof BatchService.generateBatchNumber).toBe('function');
  });
});