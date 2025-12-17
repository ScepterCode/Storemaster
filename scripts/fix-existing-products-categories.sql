-- Fix existing products that have category names but no category_id
-- This will match category names to category IDs

-- Update products where category_id is null but category name exists
UPDATE products p
SET category_id = c.id
FROM categories c
WHERE p.category = c.name
  AND p.organization_id = c.organization_id
  AND p.category_id IS NULL
  AND p.category IS NOT NULL
  AND p.category != '';

-- Check the results
SELECT 
  p.name as product_name,
  p.category as old_category_name,
  p.category_id,
  c.name as new_category_name
FROM products p
LEFT JOIN categories c ON p.category_id = c.id
WHERE p.organization_id = (SELECT id FROM organizations LIMIT 1)
ORDER BY p.name;
