# Batch Tracking System Guide

## Overview

Your inventory system now includes comprehensive batch tracking to address the concerns about knowing when goods came in and tracking expiry dates. This system implements industry-standard practices for inventory management.

## Key Features

### 1. **Batch/Lot Tracking**
- Each product can have multiple batches with unique batch numbers
- Track when goods were received (`received_date`)
- Monitor current vs. original quantities
- Automatic batch number generation if not provided

### 2. **Expiry Date Management**
- Optional expiry dates for each batch
- Automatic alerts for expiring products (configurable timeframe)
- Visual indicators for expired, critical, warning, and good status
- FEFO (First Expired, First Out) automatic allocation

### 3. **Supplier Information**
- Track which supplier provided each batch
- Store supplier reference numbers (invoice, PO, etc.)
- Maintain supplier history for each product

### 4. **Cost Tracking**
- Unit cost per batch for accurate COGS calculation
- Weighted average cost calculations
- Total inventory value tracking

### 5. **Movement Audit Trail**
- Complete history of all stock movements
- Track reasons for adjustments (expired, damaged, etc.)
- Reference linking to sales, purchases, adjustments

## How It Works

### Automatic Stock Allocation (FEFO)
When you make a sale, the system automatically:
1. Finds batches with the earliest expiry dates first
2. Allocates stock from those batches
3. Creates movement records for audit trail
4. Updates batch quantities automatically

### Database Structure
```sql
-- Main batch table
product_batches (
  id, product_id, batch_number, 
  quantity_received, quantity_current,
  received_date, expiry_date,
  supplier_name, unit_cost, notes
)

-- Movement audit trail
batch_movements (
  id, batch_id, movement_type, quantity,
  reference_type, reference_id, movement_date
)
```

### Key Functions Available

#### BatchService Methods:
- `createBatch()` - Add new inventory batch
- `getExpiringBatches(days)` - Find batches expiring soon
- `getExpiredBatches()` - Find already expired batches
- `allocateStock()` - FEFO allocation for sales
- `adjustBatchQuantity()` - Handle corrections/damage
- `getBatchMovements()` - View audit trail

#### UI Components:
- `BatchManagement` - Full batch management interface
- `ExpiryDashboard` - Expiry alerts and timeline
- `BatchTrackingWidget` - Dashboard overview

## Usage Examples

### Enable Batch Tracking for a Product
```typescript
// Enable batch tracking with 30-day default shelf life
await enableBatchTracking(productId, 30, 10); // 10 = reorder point
```

### Add New Inventory Batch
```typescript
await createBatch({
  productId: 'product-123',
  batchNumber: 'MILK-20241223-ABC', // Auto-generated if empty
  quantityReceived: 100,
  quantityCurrent: 100,
  unitCost: 2.50,
  receivedDate: '2024-12-23',
  expiryDate: '2025-01-22', // 30 days later
  supplierName: 'Fresh Dairy Co',
  supplierReference: 'INV-2024-001',
  notes: 'Grade A milk, store refrigerated'
});
```

### Make a Sale (Automatic FEFO)
```typescript
// System automatically uses oldest/expiring stock first
const allocations = await allocateStock(productId, 25, 'sale', saleId);
// Returns: [{ batchId, allocatedQuantity, unitCost }]
```

### Check Expiring Products
```typescript
// Get products expiring in next 7 days
const expiring = await getExpiringBatches(7);

// Get already expired products
const expired = await getExpiredBatches();
```

## Benefits for Your Business

### 1. **Food Safety & Compliance**
- Never accidentally sell expired products
- Maintain proper rotation (oldest first)
- Complete traceability for recalls

### 2. **Waste Reduction**
- Early warnings for expiring products
- Opportunity for discounts/promotions
- Better purchasing decisions

### 3. **Accurate Costing**
- True COGS calculation per batch
- Better profit margin analysis
- Inventory valuation accuracy

### 4. **Supplier Management**
- Track which suppliers provide quality products
- Monitor supplier delivery patterns
- Reference supplier invoices easily

### 5. **Audit Trail**
- Complete movement history
- Regulatory compliance
- Loss prevention and investigation

## Dashboard Insights

The system provides several dashboard widgets:

1. **Batch Tracking Overview** - Total products, batches, and value
2. **Expiry Alerts** - Products expiring soon or already expired
3. **Low Stock Alerts** - Batch-tracked products below reorder point
4. **Supplier Performance** - Track supplier quality and timing

## Best Practices

1. **Enable batch tracking** for perishable products
2. **Set realistic expiry dates** based on product shelf life
3. **Use consistent batch numbering** (auto-generation recommended)
4. **Regular expiry checks** (daily/weekly depending on business)
5. **Train staff** on FEFO principles
6. **Monitor supplier performance** through batch tracking data

## Migration from Simple Inventory

If you have existing products without batch tracking:
1. Products continue to work normally
2. Enable batch tracking per product as needed
3. Create initial batches for current stock
4. System handles mixed batch/non-batch products seamlessly

Your batch tracking system is now ready to help you manage inventory more effectively, reduce waste, and ensure product quality!