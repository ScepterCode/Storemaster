import { useState, useEffect } from 'react';
import { ProductBatch, BatchMovement, ProductBatchSummary } from '../types';
import { BatchService } from '../services/batchService';

export const useBatches = (productId?: string) => {
  const [batches, setBatches] = useState<ProductBatch[]>([]);
  const [batchSummary, setBatchSummary] = useState<ProductBatchSummary[]>([]);
  const [expiringBatches, setExpiringBatches] = useState<ProductBatch[]>([]);
  const [expiredBatches, setExpiredBatches] = useState<ProductBatch[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load batches for a specific product
  const loadBatches = async (productId: string) => {
    try {
      setLoading(true);
      setError(null);
      const data = await BatchService.getBatchesForProduct(productId);
      setBatches(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load batches');
    } finally {
      setLoading(false);
    }
  };

  // Load batch summary
  const loadBatchSummary = async (productId?: string) => {
    try {
      setLoading(true);
      setError(null);
      const data = await BatchService.getProductBatchSummary(productId);
      setBatchSummary(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load batch summary');
    } finally {
      setLoading(false);
    }
  };

  // Load expiring batches
  const loadExpiringBatches = async (daysAhead: number = 30) => {
    try {
      setLoading(true);
      setError(null);
      const data = await BatchService.getExpiringBatches(daysAhead);
      setExpiringBatches(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load expiring batches');
    } finally {
      setLoading(false);
    }
  };

  // Load expired batches
  const loadExpiredBatches = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await BatchService.getExpiredBatches();
      setExpiredBatches(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load expired batches');
    } finally {
      setLoading(false);
    }
  };

  // Create a new batch
  const createBatch = async (batchData: Omit<ProductBatch, 'id' | 'synced' | 'lastModified'>) => {
    try {
      setLoading(true);
      setError(null);
      const newBatch = await BatchService.createBatch(batchData);
      
      // Refresh batches if we're viewing the same product
      if (productId === batchData.productId) {
        await loadBatches(productId);
      }
      
      return newBatch;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create batch');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Update batch
  const updateBatch = async (batchId: string, updates: Partial<ProductBatch>) => {
    try {
      setLoading(true);
      setError(null);
      const updatedBatch = await BatchService.updateBatch(batchId, updates);
      
      // Update local state
      setBatches(prev => prev.map(batch => 
        batch.id === batchId ? updatedBatch : batch
      ));
      
      return updatedBatch;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update batch');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Add stock to batch
  const addStock = async (
    batchId: string,
    quantity: number,
    unitCost?: number,
    referenceType?: string,
    referenceId?: string,
    notes?: string
  ) => {
    try {
      setLoading(true);
      setError(null);
      await BatchService.addStock(batchId, quantity, unitCost, referenceType, referenceId, notes);
      
      // Refresh batches
      if (productId) {
        await loadBatches(productId);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add stock');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Adjust batch quantity
  const adjustBatchQuantity = async (
    batchId: string,
    adjustmentQuantity: number,
    movementType: 'adjustment' | 'expired' | 'damaged' = 'adjustment',
    notes?: string
  ) => {
    try {
      setLoading(true);
      setError(null);
      await BatchService.adjustBatchQuantity(batchId, adjustmentQuantity, movementType, notes);
      
      // Refresh batches
      if (productId) {
        await loadBatches(productId);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to adjust batch quantity');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Allocate stock using FEFO
  const allocateStock = async (
    productId: string,
    quantityNeeded: number,
    referenceType?: string,
    referenceId?: string
  ) => {
    try {
      setLoading(true);
      setError(null);
      const allocations = await BatchService.allocateStock(
        productId, 
        quantityNeeded, 
        referenceType, 
        referenceId
      );
      
      // Refresh batches
      await loadBatches(productId);
      
      return allocations;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to allocate stock');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Delete batch
  const deleteBatch = async (batchId: string) => {
    try {
      setLoading(true);
      setError(null);
      await BatchService.deleteBatch(batchId);
      
      // Remove from local state
      setBatches(prev => prev.filter(batch => batch.id !== batchId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete batch');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Auto-load batches when productId changes
  useEffect(() => {
    if (productId) {
      loadBatches(productId);
    }
  }, [productId]);

  return {
    batches,
    batchSummary,
    expiringBatches,
    expiredBatches,
    loading,
    error,
    loadBatches,
    loadBatchSummary,
    loadExpiringBatches,
    loadExpiredBatches,
    createBatch,
    updateBatch,
    addStock,
    adjustBatchQuantity,
    allocateStock,
    deleteBatch,
  };
};