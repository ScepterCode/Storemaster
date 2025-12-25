-- Add Sample Barcodes to Products for Testing
-- This script adds realistic barcodes to existing products for testing the barcode scanner

-- Note: Replace 'YOUR_ORGANIZATION_ID' with your actual organization ID
-- You can find your organization ID by running: SELECT id FROM organizations WHERE name = 'Your Org Name';

-- Sample EAN-13 barcodes for common products
-- These are valid EAN-13 format barcodes (13 digits with valid check digit)

-- Example 1: Update first 5 products with sample barcodes
UPDATE products 
SET barcode = '5901234123457'
WHERE id IN (
  SELECT id FROM products 
  ORDER BY created_at 
  LIMIT 1 OFFSET 0
);

UPDATE products 
SET barcode = '5901234123464'
WHERE id IN (
  SELECT id FROM products 
  ORDER BY created_at 
  LIMIT 1 OFFSET 1
);

UPDATE products 
SET barcode = '5901234123471'
WHERE id IN (
  SELECT id FROM products 
  ORDER BY created_at 
  LIMIT 1 OFFSET 2
);

UPDATE products 
SET barcode = '5901234123488'
WHERE id IN (
  SELECT id FROM products 
  ORDER BY created_at 
  LIMIT 1 OFFSET 3
);

UPDATE products 
SET barcode = '5901234123495'
WHERE id IN (
  SELECT id FROM products 
  ORDER BY created_at 
  LIMIT 1 OFFSET 4
);

-- Alternative: Update all products with sequential barcodes
-- Uncomment the following to generate sequential barcodes for all products
/*
WITH numbered_products AS (
  SELECT 
    id,
    ROW_NUMBER() OVER (ORDER BY created_at) as rn
  FROM products
)
UPDATE products p
SET barcode = '59012341234' || LPAD((np.rn % 100)::text, 2, '0')
FROM numbered_products np
WHERE p.id = np.id;
*/

-- Verify the updates
SELECT 
  id,
  name,
  barcode,
  unit_price,
  quantity
FROM products
WHERE barcode IS NOT NULL
ORDER BY created_at
LIMIT 10;

-- Common EAN-13 Barcodes for Testing (Valid Check Digits)
-- You can print these or use an online barcode generator to create test barcodes:
-- 
-- 5901234123457 - Sample Product 1
-- 5901234123464 - Sample Product 2
-- 5901234123471 - Sample Product 3
-- 5901234123488 - Sample Product 4
-- 5901234123495 - Sample Product 5
-- 5901234123501 - Sample Product 6
-- 5901234123518 - Sample Product 7
-- 5901234123525 - Sample Product 8
-- 5901234123532 - Sample Product 9
-- 5901234123549 - Sample Product 10
--
-- To generate test barcode images, visit:
-- https://barcode.tec-it.com/en/EAN13
-- Enter the barcode number and download the image

-- For testing with QR codes, you can also add QR code data:
/*
UPDATE products 
SET barcode = 'QR:PRODUCT-001'
WHERE name = 'Test Product 1';
*/
