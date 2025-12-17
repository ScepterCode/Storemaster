-- Fix RLS Policies for Data Tables (Products, Categories, Customers, Invoices, Transactions)
-- Use the user_organizations() security definer function to avoid recursion

-- Drop old policies that cause recursion
DROP POLICY IF EXISTS "Users can access their organization products" ON products;
DROP POLICY IF EXISTS "Admins can access all products" ON products;
DROP POLICY IF EXISTS "Users can access their organization categories" ON categories;
DROP POLICY IF EXISTS "Admins can access all categories" ON categories;
DROP POLICY IF EXISTS "Users can access their organization customers" ON customers;
DROP POLICY IF EXISTS "Admins can access all customers" ON customers;
DROP POLICY IF EXISTS "Users can access their organization invoices" ON invoices;
DROP POLICY IF EXISTS "Admins can access all invoices" ON invoices;
DROP POLICY IF EXISTS "Users can access their organization transactions" ON transactions;
DROP POLICY IF EXISTS "Admins can access all transactions" ON transactions;

-- Products: Users can access their organization's products
CREATE POLICY "Users can access their organization products"
  ON products FOR ALL
  USING (organization_id IN (SELECT user_organizations()));

-- Products: Admins can access all products
CREATE POLICY "Admins can access all products"
  ON products FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE id = auth.uid()
    )
  );

-- Categories: Users can access their organization's categories
CREATE POLICY "Users can access their organization categories"
  ON categories FOR ALL
  USING (organization_id IN (SELECT user_organizations()));

-- Categories: Admins can access all categories
CREATE POLICY "Admins can access all categories"
  ON categories FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE id = auth.uid()
    )
  );

-- Customers: Users can access their organization's customers
CREATE POLICY "Users can access their organization customers"
  ON customers FOR ALL
  USING (organization_id IN (SELECT user_organizations()));

-- Customers: Admins can access all customers
CREATE POLICY "Admins can access all customers"
  ON customers FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE id = auth.uid()
    )
  );

-- Invoices: Users can access their organization's invoices
CREATE POLICY "Users can access their organization invoices"
  ON invoices FOR ALL
  USING (organization_id IN (SELECT user_organizations()));

-- Invoices: Admins can access all invoices
CREATE POLICY "Admins can access all invoices"
  ON invoices FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE id = auth.uid()
    )
  );

-- Transactions: Users can access their organization's transactions
CREATE POLICY "Users can access their organization transactions"
  ON transactions FOR ALL
  USING (organization_id IN (SELECT user_organizations()));

-- Transactions: Admins can access all transactions
CREATE POLICY "Admins can access all transactions"
  ON transactions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE id = auth.uid()
    )
  );

COMMENT ON POLICY "Users can access their organization products" ON products IS 'Uses security definer function to avoid RLS recursion';
COMMENT ON POLICY "Users can access their organization categories" ON categories IS 'Uses security definer function to avoid RLS recursion';
COMMENT ON POLICY "Users can access their organization customers" ON customers IS 'Uses security definer function to avoid RLS recursion';
COMMENT ON POLICY "Users can access their organization invoices" ON invoices IS 'Uses security definer function to avoid RLS recursion';
COMMENT ON POLICY "Users can access their organization transactions" ON transactions IS 'Uses security definer function to avoid RLS recursion';
