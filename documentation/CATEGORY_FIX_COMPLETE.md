# Category Display Fix - Complete

## Problem
Products were showing "Unknown" category instead of their actual category names.

## Root Causes
1. **Product Service Join**: Using incorrect Supabase join syntax
2. **Product Mapping**: Not properly extracting category name from join
3. **Filtering Logic**: Comparing wrong fields (category name vs category ID)
4. **Display Logic**: Looking for category in wrong product field

## Fixes Applied

### 1. Product Service (`src/services/productService.ts`)
- ✅ Changed join from `category:categories(id, name)` to `categories!category_id(id, name)`
- ✅ Updated mapping to use `product.categories?.name` for categoryName
- ✅ Set `product.category` to `category_id` for consistent filtering

### 2. Inventory View Page (`src/pages/InventoryViewPage.tsx`)
- ✅ Fixed category counting to check both `category_id` and `category` fields
- ✅ Fixed product filtering to match by `category_id` or `category`
- ✅ Fixed uncategorized detection to check both fields

### 3. Product Table (`src/components/inventory/InventoryProductTable.tsx`)
- ✅ Updated display to use `categoryName` first, then fallback to lookup by `category_id`

## Testing Steps

1. **Run the migration** (if not already done):
   ```sql
   -- Run: supabase/migrations/010_fix_product_category_relationship.sql
   ```

2. **Fix existing products**:
   ```sql
   -- Run: debug-product-categories.sql
   ```

3. **Test in the app**:
   - Refresh the inventory page
   - Categories should now display correctly
   - Create a new product with a category
   - Verify it shows the correct category name
   - Filter by category to ensure filtering works

## Expected Behavior

✅ Products display their actual category names
✅ Category filtering works correctly
✅ Category counts are accurate
✅ "Uncategorized" only shows for products without categories
✅ No more "Unknown" categories

## Additional Fix: Price Display ($NaN Issue)

### Problem
Prices were showing as `$NaN` in the Stock Overview page.

### Root Cause
- `useStock.ts` was mapping `unitPrice: product.selling_price` but the database column is `unit_price`
- `syncCoordinator.ts` was writing `selling_price` instead of `unit_price`
- Generated TypeScript types were out of sync with actual database schema

### Fixes Applied
- ✅ Updated `useStock.ts` to use `product.unit_price`
- ✅ Updated `syncCoordinator.ts` to write `unit_price` instead of `selling_price`
- ✅ Added type assertions to bypass outdated generated types
- ✅ Added category join to `useStock` for consistency

## Files Modified
- `src/services/productService.ts`
- `src/pages/InventoryViewPage.tsx`
- `src/components/inventory/InventoryProductTable.tsx`
- `src/hooks/useStock.ts`
- `src/services/syncCoordinator.ts`

## Additional Testing
Run `fix-product-prices.sql` to verify all products have valid prices in the database.
