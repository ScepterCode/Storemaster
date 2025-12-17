-- Fix Product-Category Relationship
-- Change products.category from TEXT to a proper foreign key reference

-- Step 1: Add new category_id column
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS category_id TEXT REFERENCES categories(id) ON DELETE SET NULL;

-- Step 2: Migrate existing data
-- Try to match existing category names to category IDs
UPDATE products p
SET category_id = c.id
FROM categories c
WHERE p.category = c.name
  AND p.organization_id = c.organization_id
  AND p.category IS NOT NULL
  AND p.category != '';

-- Step 3: Add index for better performance
CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_organization_category ON products(organization_id, category_id);

-- Step 4: Keep the old category column for now (for backwards compatibility)
-- We'll remove it in a future migration after confirming everything works

-- Add a comment
COMMENT ON COLUMN products.category_id IS 'Foreign key reference to categories table';
COMMENT ON COLUMN products.category IS 'DEPRECATED: Use category_id instead. Kept for backwards compatibility.';
