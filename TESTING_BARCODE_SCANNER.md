# Testing the Barcode Scanner - Quick Guide

## Prerequisites

1. **Apply Database Migration**
   ```bash
   # Run in Supabase SQL Editor or via CLI
   ```
   Or run this SQL in Supabase dashboard:
   ```sql
   ALTER TABLE products ADD COLUMN IF NOT EXISTS barcode TEXT;
   CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode) WHERE barcode IS NOT NULL;
   ```

2. **Add Test Barcodes to Products**
   - Run the script: `scripts/add-sample-barcodes.sql`
   - Or manually add barcodes through the product edit form

## Testing Steps

### 1. Test Camera Scanner

1. **Start the app**
   ```bash
   npm run dev
   ```

2. **Navigate to Cashdesk**
   - Login to your account
   - Go to Cashdesk page
   - Start a cashier session

3. **Open the Scanner**
   - Click the "Scan" button with camera icon
   - Allow camera permissions when prompted

4. **Test Scanning**
   - Use one of these methods:
     - **Real Barcode**: Print a test barcode from https://barcode.tec-it.com/en/EAN13
     - **Phone Screen**: Display a barcode image on your phone
     - **Test Barcode**: Use barcode `5901234123457`

5. **Verify Results**
   - Scanner should detect the barcode
   - Hear a beep sound
   - Product should be added to cart
   - Scanner should close automatically

### 2. Test Manual Entry

1. **In Product Search Field**
   - Type a barcode number (8+ digits): `5901234123457`
   - Press Enter

2. **Verify**
   - Product should be added to cart
   - Toast notification should appear

### 3. Test Error Handling

1. **Invalid Barcode**
   - Scan or type a barcode that doesn't exist: `9999999999999`
   - Should show "Product Not Found" error

2. **No Camera**
   - Block camera permissions
   - Should show permission error message

3. **Out of Stock**
   - Scan a product with quantity = 0
   - Should show "Out of Stock" error

### 4. Test Settings

1. **Go to Settings**
   - Navigate to Settings page
   - Find "System Preferences" section

2. **Toggle Barcode Scanner**
   - Turn off "Barcode Scanner"
   - Go back to Cashdesk
   - Scan button should be disabled or hidden

3. **Auto-Scan Mode**
   - Enable "Auto-Scan Mode"
   - Reload Cashdesk page
   - Scanner should open automatically

## Test Barcodes

Use these valid EAN-13 barcodes for testing:

| Barcode | Product Name (Example) |
|---------|------------------------|
| 5901234123457 | Sample Product 1 |
| 5901234123464 | Sample Product 2 |
| 5901234123471 | Sample Product 3 |
| 5901234123488 | Sample Product 4 |
| 5901234123495 | Sample Product 5 |

## Generate Test Barcodes

### Online Barcode Generator
1. Visit: https://barcode.tec-it.com/en/EAN13
2. Enter barcode: `5901234123457`
3. Download or print the barcode image
4. Use your phone camera or webcam to scan

### Print Test Sheet
1. Create a document with multiple barcodes
2. Print on paper
3. Use for physical testing

## Common Issues & Solutions

### Camera Not Working
- **Issue**: Camera permission denied
- **Solution**: Check browser settings, allow camera access

### Barcode Not Detected
- **Issue**: Scanner can't read barcode
- **Solution**: 
  - Ensure good lighting
  - Hold barcode steady
  - Try different distances
  - Check barcode quality

### Product Not Found
- **Issue**: Barcode scanned but product not found
- **Solution**:
  - Verify barcode exists in database
  - Check organization_id matches
  - Run: `SELECT * FROM products WHERE barcode = 'YOUR_BARCODE'`

### Scanner Freezes
- **Issue**: Video feed stops
- **Solution**:
  - Close and reopen scanner
  - Refresh page
  - Check browser console for errors

## Browser Testing

Test in multiple browsers:
- [ ] Chrome (recommended)
- [ ] Edge
- [ ] Firefox
- [ ] Safari (Mac/iOS)

## Mobile Testing

Test on mobile devices:
- [ ] Android Chrome
- [ ] iOS Safari
- [ ] Tablet devices

## Performance Testing

1. **Multiple Scans**
   - Scan 10+ products in succession
   - Verify no memory leaks
   - Check scanner responsiveness

2. **Camera Switching**
   - If multiple cameras available
   - Switch between cameras
   - Verify each camera works

3. **Network Conditions**
   - Test with slow network
   - Test offline mode
   - Verify error handling

## Checklist

### Functionality
- [ ] Camera opens successfully
- [ ] Barcode detection works
- [ ] Product added to cart
- [ ] Audio feedback plays
- [ ] Scanner closes after scan
- [ ] Manual entry works
- [ ] Error messages display
- [ ] Settings toggle works

### UI/UX
- [ ] Scanner UI is responsive
- [ ] Loading states are clear
- [ ] Error states are helpful
- [ ] Success feedback is obvious
- [ ] Mobile layout works

### Data
- [ ] Barcode field saves to database
- [ ] Products fetch with barcodes
- [ ] Barcode search is fast
- [ ] No duplicate barcodes

### Edge Cases
- [ ] Empty barcode field
- [ ] Very long barcodes
- [ ] Special characters in barcode
- [ ] Multiple products same barcode
- [ ] Product deleted but barcode exists

## Next Steps After Testing

1. **Report Issues**
   - Document any bugs found
   - Include browser/device info
   - Provide reproduction steps

2. **Add Real Barcodes**
   - Update products with actual barcodes
   - Import from supplier data
   - Scan existing product barcodes

3. **Train Users**
   - Create user guide
   - Demonstrate scanner usage
   - Explain error messages

4. **Monitor Performance**
   - Track scan success rate
   - Monitor error logs
   - Gather user feedback

## Support Resources

- **Documentation**: See `BARCODE_SCANNER_SETUP.md`
- **Sample Data**: Run `scripts/add-sample-barcodes.sql`
- **Component**: `src/components/cashdesk/BarcodeScanner.tsx`
- **Integration**: `src/components/cashdesk/ProductSearch.tsx`

## Quick Commands

```bash
# Start development server
npm run dev

# Check TypeScript errors
npx tsc --noEmit

# Run tests (if available)
npm test

# Build for production
npm run build
```

Happy Testing! 🎉
