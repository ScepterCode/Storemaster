-- Debug Product-Category Relationship
-- Run this to see what's in your database and fix any issues

-- Step 1: Check current state of products
SELECT 
  p.id,
  p.name as product_name,
  p.category as old_category_text,
  p.category_id,
  c.name as linked_category_name,
  p.organization_id
FROM products p
LEFT JOIN categories c ON p.category_id = c.id AND p.organization_id = c.organization_id
ORDER BY p.name;

-- Step 2: Check categories
SELECT 
  id,
  name,
  organization_id,
  (SELECT COUNT(*) FROM products WHERE category_id = categories.id) as product_count
FROM categories
ORDER BY name;

-- Step 3: Fix products that have category text but no category_id
-- This matches category names to IDs
UPDATE products p
SET category_id = c.id
FROM categories c
WHERE p.category = c.name
  AND p.organization_id = c.organization_id
  AND (p.category_id IS NULL OR p.category_id = '')
  AND p.category IS NOT NULL
  AND p.category != '';

-- Step 4: Also try matching by ID if category field contains an ID
UPDATE products p
SET category_id = p.category
FROM categories c
WHERE p.category = c.id
  AND p.organization_id = c.organization_id
  AND (p.category_id IS NULL OR p.category_id = '');

-- Step 5: Verify the fix
SELECT 
  'After Fix:' as status,
  p.name as product_name,
  p.category_id,
  c.name as category_name
FROM products p
LEFT JOIN categories c ON p.category_id = c.id
ORDER BY p.name;

-- Step 6: Check category product counts
SELECT 
  c.name as category_name,
  COUNT(p.id) as product_count
FROM categories c
LEFT JOIN products p ON p.category_id = c.id
GROUP BY c.id, c.name
ORDER BY c.name;
