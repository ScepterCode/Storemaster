# Barcode Scanner Troubleshooting Guide

## Issue: Camera opens but barcode not detected

### Step 1: Check Browser Console

1. Open Developer Tools (F12)
2. Go to Console tab
3. Look for these messages when scanner opens:
   - "Starting barcode scanner with device: ..."
   - "Scanner initialized successfully"
   - "✅ Barcode detected: ..." (when scanning)

### Step 2: What to Look For

**Good Signs:**
- ✅ "Scanner initialized successfully"
- ✅ "🔍 Scanning active..." appears on screen
- ✅ Video feed is clear and not frozen

**Bad Signs:**
- ❌ Any error messages in console
- ❌ "CodeReader or video ref not available"
- ❌ Video feed is black or frozen
- ❌ No "Scanning active..." message

### Step 3: Common Issues & Solutions

#### Issue 1: ZXing Library Not Detecting Barcodes

**Symptoms:**
- Camera works
- No errors in console
- Barcode not detected even when clearly visible

**Solutions:**

1. **Try a different barcode type**
   - ZXing works best with high-quality barcodes
   - Try EAN-13 or QR codes first
   - Avoid damaged or low-quality barcodes

2. **Improve lighting and positioning**
   - Ensure good, even lighting
   - Hold barcode 6-12 inches from camera
   - Keep barcode flat and steady
   - Avoid glare or shadows

3. **Test with known-good barcode**
   - Generate a test barcode: https://barcode.tec-it.com/en/EAN13
   - Use barcode: `5901234123457`
   - Print it or display on another screen

#### Issue 2: Camera Permission Issues

**Symptoms:**
- Error: "Failed to access camera"
- Black video feed

**Solutions:**
1. Check browser permissions (click lock icon in address bar)
2. Ensure HTTPS is enabled (required for camera API)
3. Try a different browser (Chrome recommended)
4. Restart browser after granting permissions

#### Issue 3: Wrong Camera Selected

**Symptoms:**
- Video shows but wrong camera (e.g., front camera on laptop)

**Solutions:**
1. Use the camera dropdown to select different camera
2. Try each camera option
3. Use rear camera on mobile devices

### Step 4: Test Barcode Quality

**Good Barcodes:**
- Clear, high-contrast print
- No damage or smudges
- Standard size (not too small)
- Flat surface (not curved)

**Bad Barcodes:**
- Faded or low contrast
- Damaged or scratched
- Very small (< 1 inch wide)
- On curved/reflective surface

### Step 5: Browser Compatibility Check

**Recommended Browsers:**
- Chrome 60+ ✅ (Best support)
- Edge 79+ ✅
- Firefox 55+ ⚠️ (May be slower)
- Safari 11+ ⚠️ (Limited support)

**Not Supported:**
- Internet Explorer ❌
- Very old browser versions ❌

### Step 6: Debug Mode

Open browser console and watch for these logs:

```
Starting barcode scanner with device: [device-id]
Scanner initialized successfully
🔍 Scanning active...
```

When you scan a barcode, you should see:
```
✅ Barcode detected: 5901234123457
```

If you see "Scan error (non-critical)" repeatedly, the scanner is working but not finding barcodes.

### Step 7: Manual Testing

Try manual barcode entry to verify the product exists:

1. In the search field, type: `5901234123457`
2. Press Enter
3. If product is found → Database is OK, scanner is the issue
4. If product not found → Need to add barcodes to products first

### Step 8: Verify Product Has Barcode

Check if your products have barcodes in the database:

```sql
SELECT id, name, barcode 
FROM products 
WHERE barcode IS NOT NULL 
LIMIT 10;
```

If no results → You need to add barcodes first!

Run: `scripts/add-sample-barcodes.sql`

### Step 9: Alternative - Use Phone as Barcode

If scanner still not working:

1. Open barcode generator on your phone: https://barcode.tec-it.com/en/EAN13
2. Enter: `5901234123457`
3. Display barcode on phone screen
4. Scan phone screen with computer camera

### Step 10: Check Network/API

If barcode is detected but product not added:

1. Check browser Network tab
2. Look for API calls to products endpoint
3. Check for errors in product lookup
4. Verify organization_id matches

## Quick Diagnostic Checklist

- [ ] Browser console shows "Scanner initialized successfully"
- [ ] "🔍 Scanning active..." appears on screen
- [ ] Video feed is clear and working
- [ ] Using Chrome or Edge browser
- [ ] Camera permissions granted
- [ ] HTTPS enabled (or localhost)
- [ ] Products have barcodes in database
- [ ] Barcode is high quality and well-lit
- [ ] Barcode is 6-12 inches from camera
- [ ] Tried multiple different barcodes
- [ ] Manual entry works (confirms database OK)

## Still Not Working?

### Try Alternative Scanner Implementation

I can provide an alternative implementation using:
1. HTML5 Barcode Detection API (newer, may work better)
2. Quagga.js library (alternative to ZXing)
3. Manual camera capture + decode (more control)

### Collect Debug Info

Please provide:
1. Browser name and version
2. Operating system
3. Console logs when opening scanner
4. Screenshot of scanner screen
5. Type of barcode being tested
6. Whether manual entry works

## Common ZXing Issues

### Issue: ZXing is slow or doesn't detect

**Reason:** ZXing can be picky about:
- Barcode quality
- Camera resolution
- Lighting conditions
- Barcode format

**Solution:** Try these barcodes in order:
1. QR Code (easiest to detect)
2. EAN-13 (retail standard)
3. Code128 (logistics)
4. UPC-A (North America)

### Test with QR Code

Generate a QR code with text: `5901234123457`
- Visit: https://www.qr-code-generator.com/
- Enter: `5901234123457`
- Scan the QR code

QR codes are much easier for ZXing to detect!

## Emergency Workaround

If camera scanning doesn't work, you can still use:

1. **Manual Entry**: Type barcode in search field
2. **USB Scanner**: Use keyboard wedge barcode scanner
3. **Mobile App**: Use phone camera (if available)
4. **Product Search**: Search by name instead

## Next Steps

Based on console logs, we can:
1. Adjust scanner sensitivity
2. Change barcode formats supported
3. Implement alternative scanning library
4. Add manual calibration options
5. Improve error messages

---

**Need Help?**
Share your browser console logs and I can provide specific fixes!
