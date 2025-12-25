import { supabase } from '@/integrations/supabase/client';
import { ProductBatch, BatchMovement, BatchAllocation, ProductBatchSummary } from '../types';
import { v4 as uuidv4 } from 'uuid';

export class BatchService {
  // Create a new batch
  static async createBatch(batch: Omit<ProductBatch, 'id' | 'synced' | 'lastModified'>): Promise<ProductBatch> {
    const newBatch: ProductBatch = {
      ...batch,
      id: uuidv4(),
      synced: false,
      lastModified: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('product_batches')
      .insert({
        id: newBatch.id,
        product_id: newBatch.productId,
        batch_number: newBatch.batchNumber,
        quantity_received: newBatch.quantityReceived,
        quantity_current: newBatch.quantityCurrent,
        unit_cost: newBatch.unitCost,
        received_date: newBatch.receivedDate,
        expiry_date: newBatch.expiryDate,
        supplier_name: newBatch.supplierName,
        supplier_reference: newBatch.supplierReference,
        notes: newBatch.notes,
        synced: newBatch.synced,
        last_modified: newBatch.lastModified,
      })
      .select()
      .single();

    if (error) throw error;
    return this.mapBatchFromDb(data);
  }

  // Get all batches for a product
  static async getBatchesForProduct(productId: string): Promise<ProductBatch[]> {
    const { data, error } = await supabase
      .from('product_batches')
      .select('*')
      .eq('product_id', productId)
      .order('expiry_date', { ascending: true, nullsLast: true })
      .order('received_date', { ascending: true });

    if (error) throw error;
    return data.map(this.mapBatchFromDb);
  }

  // Get batches that are expiring soon (within specified days)
  static async getExpiringBatches(daysAhead: number = 30): Promise<ProductBatch[]> {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + daysAhead);

    const { data, error } = await supabase
      .from('product_batches')
      .select(`
        *,
        products!inner(name)
      `)
      .lte('expiry_date', futureDate.toISOString())
      .gt('quantity_current', 0)
      .order('expiry_date', { ascending: true });

    if (error) throw error;
    return data.map(this.mapBatchFromDb);
  }

  // Get expired batches
  static async getExpiredBatches(): Promise<ProductBatch[]> {
    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from('product_batches')
      .select(`
        *,
        products!inner(name)
      `)
      .lte('expiry_date', now)
      .gt('quantity_current', 0)
      .order('expiry_date', { ascending: true });

    if (error) throw error;
    return data.map(this.mapBatchFromDb);
  }

  // Allocate stock using FEFO (First Expired, First Out)
  static async allocateStock(
    productId: string, 
    quantityNeeded: number,
    referenceType: string = 'sale',
    referenceId?: string
  ): Promise<BatchAllocation[]> {
    const { data, error } = await supabase
      .rpc('allocate_stock_fefo', {
        p_product_id: productId,
        p_quantity_needed: quantityNeeded,
        p_reference_type: referenceType,
        p_reference_id: referenceId
      });

    if (error) throw error;
    
    return data.map((allocation: any) => ({
      batchId: allocation.batch_id,
      allocatedQuantity: allocation.allocated_quantity,
      unitCost: allocation.unit_cost
    }));
  }

  // Add stock to a batch (receive inventory)
  static async addStock(
    batchId: string,
    quantity: number,
    unitCost?: number,
    referenceType: string = 'purchase',
    referenceId?: string,
    notes?: string
  ): Promise<void> {
    const { error } = await supabase
      .rpc('create_batch_movement', {
        p_batch_id: batchId,
        p_movement_type: 'in',
        p_quantity: quantity,
        p_reference_type: referenceType,
        p_reference_id: referenceId,
        p_unit_cost: unitCost,
        p_notes: notes
      });

    if (error) throw error;
  }

  // Adjust batch quantity (for corrections, damage, etc.)
  static async adjustBatchQuantity(
    batchId: string,
    adjustmentQuantity: number, // Can be positive or negative
    movementType: 'adjustment' | 'expired' | 'damaged' = 'adjustment',
    notes?: string
  ): Promise<void> {
    const { error } = await supabase
      .rpc('create_batch_movement', {
        p_batch_id: batchId,
        p_movement_type: movementType,
        p_quantity: adjustmentQuantity,
        p_reference_type: movementType,
        p_notes: notes
      });

    if (error) throw error;
  }

  // Get batch movement history
  static async getBatchMovements(batchId: string): Promise<BatchMovement[]> {
    const { data, error } = await supabase
      .from('batch_movements')
      .select('*')
      .eq('batch_id', batchId)
      .order('movement_date', { ascending: false });

    if (error) throw error;
    return data.map(this.mapMovementFromDb);
  }

  // Get product batch summary
  static async getProductBatchSummary(productId?: string): Promise<ProductBatchSummary[]> {
    let query = supabase
      .from('product_batch_summary')
      .select('*');

    if (productId) {
      query = query.eq('product_id', productId);
    }

    const { data, error } = await query;
    if (error) throw error;

    return data.map((item: any) => ({
      productId: item.product_id,
      productName: item.product_name,
      totalBatches: item.total_batches,
      totalQuantity: item.total_quantity,
      earliestExpiry: item.earliest_expiry,
      expiringSoonCount: item.expiring_soon_count,
      expiredCount: item.expired_count,
      averageCost: item.average_cost
    }));
  }

  // Update batch details
  static async updateBatch(batchId: string, updates: Partial<ProductBatch>): Promise<ProductBatch> {
    const { data, error } = await supabase
      .from('product_batches')
      .update({
        batch_number: updates.batchNumber,
        expiry_date: updates.expiryDate,
        supplier_name: updates.supplierName,
        supplier_reference: updates.supplierReference,
        notes: updates.notes,
        last_modified: new Date().toISOString()
      })
      .eq('id', batchId)
      .select()
      .single();

    if (error) throw error;
    return this.mapBatchFromDb(data);
  }

  // Delete a batch (only if quantity is 0)
  static async deleteBatch(batchId: string): Promise<void> {
    // First check if batch has any remaining quantity
    const { data: batch, error: fetchError } = await supabase
      .from('product_batches')
      .select('quantity_current')
      .eq('id', batchId)
      .single();

    if (fetchError) throw fetchError;
    
    if (batch.quantity_current > 0) {
      throw new Error('Cannot delete batch with remaining quantity. Adjust quantity to 0 first.');
    }

    const { error } = await supabase
      .from('product_batches')
      .delete()
      .eq('id', batchId);

    if (error) throw error;
  }

  // Generate automatic batch number
  static generateBatchNumber(productName: string, receivedDate: Date = new Date()): string {
    const dateStr = receivedDate.toISOString().slice(0, 10).replace(/-/g, '');
    const productCode = productName.substring(0, 3).toUpperCase();
    const randomSuffix = Math.random().toString(36).substring(2, 5).toUpperCase();
    return `${productCode}-${dateStr}-${randomSuffix}`;
  }

  // Helper methods for mapping database records
  private static mapBatchFromDb(data: any): ProductBatch {
    return {
      id: data.id,
      productId: data.product_id,
      batchNumber: data.batch_number,
      quantityReceived: data.quantity_received,
      quantityCurrent: data.quantity_current,
      unitCost: data.unit_cost,
      receivedDate: data.received_date,
      expiryDate: data.expiry_date,
      supplierName: data.supplier_name,
      supplierReference: data.supplier_reference,
      notes: data.notes,
      synced: data.synced,
      lastModified: data.last_modified,
    };
  }

  private static mapMovementFromDb(data: any): BatchMovement {
    return {
      id: data.id,
      batchId: data.batch_id,
      movementType: data.movement_type,
      quantity: data.quantity,
      referenceType: data.reference_type,
      referenceId: data.reference_id,
      unitCost: data.unit_cost,
      notes: data.notes,
      movementDate: data.movement_date,
      synced: data.synced,
      lastModified: data.last_modified,
    };
  }
}