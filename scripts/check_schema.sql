-- Run this in Supabase SQL Editor to check the actual table schemas

-- Check categories table
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'categories'
ORDER BY ordinal_position;

-- Check products table  
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'products'
ORDER BY ordinal_position;
