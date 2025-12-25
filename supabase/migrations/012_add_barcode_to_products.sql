-- Add barcode column to products table for scanner integration
-- This migration adds support for barcode scanning in the cashdesk

-- Add barcode column to products table
ALTER TABLE products ADD COLUMN IF NOT EXISTS barcode TEXT;

-- Create index on barcode for faster lookups during scanning
CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode) WHERE barcode IS NOT NULL;

-- Add comment
COMMENT ON COLUMN products.barcode IS 'Product barcode for scanner integration (EAN-13, UPC-A, Code128, etc.)';
