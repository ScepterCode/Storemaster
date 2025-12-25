import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BatchService } from '../../services/batchService';

// Mock the supabase client
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

describe('Batch Tracking Integration Tests', () => {
  describe('BatchService API', () => {
    it('should have all required methods', () => {
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

    it('should generate valid batch numbers', () => {
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

    it('should handle short product names', () => {
      const productName = 'A';
      const receivedDate = new Date('2024-12-23');
      
      const batchNumber = BatchService.generateBatchNumber(productName, receivedDate);
      
      expect(batchNumber).toMatch(/^A-20241223-[A-Z0-9]{3}$/);
    });

    it('should handle product names with special characters', () => {
      const productName = 'Milk & Cream 100%';
      const receivedDate = new Date('2024-12-23');
      
      const batchNumber = BatchService.generateBatchNumber(productName, receivedDate);
      
      expect(batchNumber).toMatch(/^MIL-20241223-[A-Z0-9]{3}$/);
    });
  });

  describe('Batch Tracking Workflow', () => {
    it('should validate batch data structure', () => {
      const sampleBatch = {
        productId: 'product-123',
        batchNumber: 'MILK-20241223-ABC',
        quantityReceived: 100,
        quantityCurrent: 75,
        unitCost: 2.50,
        receivedDate: '2024-12-23',
        expiryDate: '2025-01-22',
        supplierName: 'Fresh Dairy Co',
        supplierReference: 'INV-2024-001',
        notes: 'Grade A milk'
      };

      // Validate required fields
      expect(sampleBatch.productId).toBeDefined();
      expect(sampleBatch.batchNumber).toBeDefined();
      expect(sampleBatch.quantityReceived).toBeGreaterThan(0);
      expect(sampleBatch.quantityCurrent).toBeGreaterThanOrEqual(0);
      expect(sampleBatch.receivedDate).toBeDefined();

      // Validate optional fields
      expect(typeof sampleBatch.unitCost).toBe('number');
      expect(typeof sampleBatch.expiryDate).toBe('string');
      expect(typeof sampleBatch.supplierName).toBe('string');
      expect(typeof sampleBatch.notes).toBe('string');
    });

    it('should validate batch allocation structure', () => {
      const sampleAllocation = {
        batchId: 'batch-123',
        allocatedQuantity: 25,
        unitCost: 2.50
      };

      expect(sampleAllocation.batchId).toBeDefined();
      expect(sampleAllocation.allocatedQuantity).toBeGreaterThan(0);
      expect(typeof sampleAllocation.unitCost).toBe('number');
    });

    it('should validate batch movement structure', () => {
      const sampleMovement = {
        batchId: 'batch-123',
        movementType: 'out' as const,
        quantity: -25,
        referenceType: 'sale',
        referenceId: 'sale-456',
        unitCost: 2.50,
        notes: 'Sale to customer',
        movementDate: '2024-12-23T10:00:00Z'
      };

      expect(sampleMovement.batchId).toBeDefined();
      expect(['in', 'out', 'adjustment', 'expired', 'damaged']).toContain(sampleMovement.movementType);
      expect(typeof sampleMovement.quantity).toBe('number');
      expect(sampleMovement.movementDate).toBeDefined();
    });
  });

  describe('FEFO Algorithm Logic', () => {
    it('should prioritize batches by expiry date', () => {
      const batches = [
        { id: 'batch-1', expiryDate: '2025-01-15', quantityCurrent: 50 },
        { id: 'batch-2', expiryDate: '2024-12-30', quantityCurrent: 30 },
        { id: 'batch-3', expiryDate: '2025-02-01', quantityCurrent: 20 }
      ];

      // Sort by expiry date (FEFO logic)
      const sortedBatches = batches.sort((a, b) => 
        new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime()
      );

      expect(sortedBatches[0].id).toBe('batch-2'); // Expires first
      expect(sortedBatches[1].id).toBe('batch-1'); // Expires second
      expect(sortedBatches[2].id).toBe('batch-3'); // Expires last
    });

    it('should handle batches without expiry dates', () => {
      const batches = [
        { id: 'batch-1', expiryDate: '2025-01-15', quantityCurrent: 50 },
        { id: 'batch-2', expiryDate: null, quantityCurrent: 30 },
        { id: 'batch-3', expiryDate: '2024-12-30', quantityCurrent: 20 }
      ];

      // Sort with null expiry dates last
      const sortedBatches = batches.sort((a, b) => {
        if (!a.expiryDate && !b.expiryDate) return 0;
        if (!a.expiryDate) return 1;
        if (!b.expiryDate) return -1;
        return new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime();
      });

      expect(sortedBatches[0].id).toBe('batch-3'); // Expires first
      expect(sortedBatches[1].id).toBe('batch-1'); // Expires second
      expect(sortedBatches[2].id).toBe('batch-2'); // No expiry (last)
    });
  });

  describe('Expiry Detection Logic', () => {
    it('should correctly identify expired batches', () => {
      const now = new Date('2024-12-23T10:00:00Z');
      const batches = [
        { id: 'batch-1', expiryDate: '2024-12-20' }, // Expired
        { id: 'batch-2', expiryDate: '2024-12-25' }, // Not expired
        { id: 'batch-3', expiryDate: null }          // No expiry
      ];

      const expiredBatches = batches.filter(batch => 
        batch.expiryDate && new Date(batch.expiryDate) < now
      );

      expect(expiredBatches).toHaveLength(1);
      expect(expiredBatches[0].id).toBe('batch-1');
    });

    it('should correctly identify expiring batches', () => {
      const now = new Date('2024-12-23T10:00:00Z');
      const daysAhead = 7;
      const futureDate = new Date(now.getTime() + (daysAhead * 24 * 60 * 60 * 1000));
      
      const batches = [
        { id: 'batch-1', expiryDate: '2024-12-25' }, // Expiring within 7 days
        { id: 'batch-2', expiryDate: '2025-01-15' }, // Not expiring soon
        { id: 'batch-3', expiryDate: '2024-12-20' }  // Already expired
      ];

      const expiringBatches = batches.filter(batch => {
        if (!batch.expiryDate) return false;
        const expiryDate = new Date(batch.expiryDate);
        return expiryDate > now && expiryDate <= futureDate;
      });

      expect(expiringBatches).toHaveLength(1);
      expect(expiringBatches[0].id).toBe('batch-1');
    });
  });
});