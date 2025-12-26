# Barcode Scanner Implementation Guide

## Overview
Camera-based barcode scanning has been implemented for the cashdesk dashboard using the @zxing/browser library.

## Features Implemented

### 1. **Database Schema**
- Added `barcode` field to the `products` table
- Created migration file: `supabase/migrations/012_add_barcode_to_products.sql`
- Added index on barcode column for fast lookups

### 2. **Type Definitions**
- Updated `Product` interface in `src/types/index.ts` to include `barcode?: string`
- Updated `BarcodeProduct` interface in `src/types/cashdesk.ts`

### 3. **Product Service**
- Updated `productService.ts` to handle barcode field in:
  - `fetchProductsFromAPI()` - Retrieves barcode from database
  - `createInAPI()` - Saves barcode when creating products
  - `updateInAPI()` - Updates barcode when editing products

### 4. **BarcodeScanner Component**
Location: `src/components/cashdesk/BarcodeScanner.tsx`

Features:
- Camera access with permission handling
- Real-time barcode detection
- Support for multiple barcode formats (EAN-13, UPC-A, Code128, QR codes, etc.)
- Audio feedback (beep) on successful scan
- Multiple camera selection (if available)
- Visual scanning indicator
- Error handling and user feedback

### 5. **ProductSearch Component**
Updated: `src/components/cashdesk/ProductSearch.tsx`

Features:
- Integrated BarcodeScanner component
- Enhanced barcode detection logic
- Supports both manual barcode entry and camera scanning
- Fallback to product ID if barcode not found
- Toast notifications for scan results

### 6. **Settings**
Updated: `src/components/settings/GeneralSettings.tsx`

New Settings:
- **Enable Barcode Scanner**: Toggle camera-based scanning
- **Auto-Scan Mode**: Automatically open scanner on cashdesk load

## Setup Instructions

### 1. Apply Database Migration

Run the migration to add the barcode column:

```bash
# If using Supabase CLI
supabase db push

# Or run the SQL directly in Supabase dashboard
```

SQL to run manually:
```sql
ALTER TABLE products ADD COLUMN IF NOT EXISTS barcode TEXT;
CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode) WHERE barcode IS NOT NULL;
```

### 2. Add Barcodes to Products

You can add barcodes to products in two ways:

#### Option A: Through the UI
1. Go to Inventory/Products page
2. Edit a product
3. Add the barcode value in the barcode field

#### Option B: Bulk Update via SQL
```sql
-- Example: Update specific products with barcodes
UPDATE products SET barcode = '1234567890123' WHERE id = 'product-id-1';
UPDATE products SET barcode = '9876543210987' WHERE id = 'product-id-2';
```

### 3. Test the Scanner

1. **Navigate to Cashdesk**
   - Go to the Cashdesk page
   - Start a cashier session

2. **Open Scanner**
   - Click the "Scan" button in the Product Search section
   - Grant camera permissions when prompted

3. **Scan a Barcode**
   - Position a barcode in front of the camera
   - The scanner will automatically detect and add the product
   - You'll hear a beep on successful scan

4. **Manual Entry**
   - Type a barcode (8+ digits) in the search field
   - Press Enter to add the product

## Testing Checklist

### Camera Scanner
- [ ] Camera permissions are requested
- [ ] Video feed displays correctly
- [ ] Barcode detection works (test with real barcodes)
- [ ] Success beep plays on scan
- [ ] Product is added to cart after scan
- [ ] Scanner closes after successful scan
- [ ] Error messages display for invalid barcodes
- [ ] Multiple camera selection works (if available)

### Manual Entry
- [ ] Typing 8+ digit barcode triggers search
- [ ] Product is found by barcode field
- [ ] Fallback to product ID works
- [ ] Toast notifications appear correctly

### Settings
- [ ] Barcode scanner toggle works
- [ ] Auto-scan mode toggle works
- [ ] Settings persist after save

### Database
- [ ] Migration applied successfully
- [ ] Barcode column exists in products table
- [ ] Index created on barcode column
- [ ] Products can be created with barcodes
- [ ] Products can be updated with barcodes

## Supported Barcode Formats

The scanner supports multiple barcode formats:
- **EAN-13** (most common retail barcodes)
- **UPC-A** (North American retail)
- **Code 128** (logistics and shipping)
- **Code 39**
- **QR Codes**
- **Data Matrix**
- **PDF417**
- And many more...

## Troubleshooting

### Camera Not Working
1. Check browser permissions (camera must be allowed)
2. Ensure HTTPS is enabled (camera API requires secure context)
3. Try a different browser (Chrome/Edge recommended)
4. Check if another app is using the camera

### Barcode Not Detected
1. Ensure good lighting
2. Hold barcode steady and flat
3. Try different distances from camera
4. Verify barcode is in a supported format
5. Check if barcode is damaged or printed clearly

### Product Not Found
1. Verify the product has a barcode in the database
2. Check if the barcode matches exactly
3. Ensure the product belongs to your organization
4. Try manual entry to verify the barcode value

### Performance Issues
1. Close other camera-using applications
2. Use a device with better camera quality
3. Ensure good internet connection for API calls
4. Check browser console for errors

## Browser Compatibility

**Recommended Browsers:**
- Chrome 60+
- Edge 79+
- Firefox 55+
- Safari 11+

**Note:** Camera access requires HTTPS in production environments.

## Future Enhancements

Potential improvements:
- [ ] Barcode generation for new products
- [ ] Batch barcode printing
- [ ] USB barcode scanner support (keyboard wedge)
- [ ] Barcode format validation
- [ ] Duplicate barcode detection
- [ ] Barcode history/audit log
- [ ] Mobile app integration
- [ ] Offline barcode caching

## Support

For issues or questions:
1. Check browser console for errors
2. Verify database migration was applied
3. Test with known working barcodes
4. Review component props and state
5. Check network requests in DevTools

## Code Examples

### Adding a Product with Barcode
```typescript
const newProduct = {
  id: generateId(),
  name: 'Sample Product',
  unitPrice: 19.99,
  quantity: 100,
  barcode: '1234567890123', // EAN-13 format
  category_id: 'category-id',
  synced: false,
  lastModified: new Date().toISOString()
};

await syncEntity(newProduct, userId, 'create', organizationId);
```

### Searching by Barcode
```typescript
const product = products.find(p => p.barcode === scannedBarcode);
if (product) {
  handleAddProduct(product);
}
```

## License
Part of ABA Cash Ledger Pro - Internal Documentation
