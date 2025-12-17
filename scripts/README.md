# SQL Scripts

This folder contains SQL scripts for database setup, maintenance, and testing.

## Admin Setup Scripts

- `create-first-admin.sql` - Create the first system administrator
- `make-me-admin.sql` - Grant admin privileges to a user
- `setup-admin-complete.sql` - Complete admin setup
- `create-admin-organization.sql` - Create admin organization

## Premium Access Scripts

- `grant-premium-access.sql` - Grant premium access to a user (with error handling)
- `grant-premium-simple.sql` - Simple premium access grant (recommended)

## Database Maintenance Scripts

- `check_schema.sql` - Verify database schema
- `check-account-status.sql` - Check user account status
- `check-existing-users.sql` - List existing users
- `run-this-now.sql` - Quick fixes and updates

## Product & Category Scripts

- `debug-product-categories.sql` - Debug product-category relationships
- `fix-existing-products-categories.sql` - Fix product category data
- `fix-product-prices.sql` - Fix product pricing issues

## Usage

Run these scripts in your Supabase SQL Editor:
1. Open Supabase Dashboard
2. Navigate to SQL Editor
3. Copy and paste the script content
4. Execute the query

**Note:** Always backup your database before running maintenance scripts.
