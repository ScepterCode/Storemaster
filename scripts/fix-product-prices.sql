-- Fix Product Prices
-- This script checks for products with NULL or 0 prices and helps identify issues

-- 1. Check for products with NULL or 0 prices
SELECT 
  id,
  name,
  quantity,
  unit_price,
  category_id,
  organization_id
FROM products
WHERE unit_price IS NULL OR unit_price = 0
ORDER BY name;

-- 2. Check if there's a selling_price column (shouldn't exist)
-- If this query fails, it means selling_price doesn't exist (which is correct)
-- SELECT id, name, selling_price FROM products LIMIT 1;

-- 3. Verify all products have valid prices
SELECT 
  COUNT(*) as total_products,
  COUNT(CASE WHEN unit_price IS NULL OR unit_price = 0 THEN 1 END) as products_with_no_price,
  COUNT(CASE WHEN unit_price > 0 THEN 1 END) as products_with_price
FROM products;

-- 4. If you need to set a default price for products with NULL/0 prices:
-- UPDATE products 
-- SET unit_price = 1.00 
-- WHERE unit_price IS NULL OR unit_price = 0;

-- 5. Check the actual column names in the products table
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'products' 
  AND column_name IN ('unit_price', 'selling_price')
ORDER BY column_name;
