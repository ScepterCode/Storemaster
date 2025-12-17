-- Recreate Data Tables with Correct Schema
-- This drops and recreates the data tables to ensure they have the correct columns

-- Drop existing tables (this will delete all data!)
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS customers CASCADE;
DROP TABLE IF EXISTS invoices CASCADE;
DROP TABLE IF EXISTS transactions CASCADE;

-- Products Table
CREATE TABLE products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 0,
  unit_price DECIMAL(10, 2) NOT NULL,
  category TEXT,
  description TEXT,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  synced BOOLEAN DEFAULT true,
  last_modified TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Categories Table
CREATE TABLE categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  synced BOOLEAN DEFAULT true,
  last_modified TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Customers Table
CREATE TABLE customers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  address TEXT,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  synced BOOLEAN DEFAULT true,
  last_modified TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Invoices Table
CREATE TABLE invoices (
  id TEXT PRIMARY KEY,
  customer_name TEXT NOT NULL,
  customer_id TEXT,
  date TIMESTAMP WITH TIME ZONE NOT NULL,
  items JSONB NOT NULL DEFAULT '[]',
  total_amount DECIMAL(10, 2) NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('draft', 'issued', 'paid', 'overdue')),
  due_date TIMESTAMP WITH TIME ZONE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  synced BOOLEAN DEFAULT true,
  last_modified TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Transactions Table
CREATE TABLE transactions (
  id TEXT PRIMARY KEY,
  amount DECIMAL(10, 2) NOT NULL,
  description TEXT NOT NULL,
  date TIMESTAMP WITH TIME ZONE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('sale', 'purchase', 'expense')),
  category TEXT,
  reference TEXT,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  synced BOOLEAN DEFAULT true,
  last_modified TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_products_org ON products(organization_id);
CREATE INDEX idx_products_name ON products(name);
CREATE INDEX idx_categories_org ON categories(organization_id);
CREATE INDEX idx_categories_name ON categories(name);
CREATE INDEX idx_customers_org ON customers(organization_id);
CREATE INDEX idx_customers_name ON customers(name);
CREATE INDEX idx_invoices_org ON invoices(organization_id);
CREATE INDEX idx_invoices_date ON invoices(date DESC);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_transactions_org ON transactions(organization_id);
CREATE INDEX idx_transactions_date ON transactions(date DESC);
CREATE INDEX idx_transactions_type ON transactions(type);

-- Enable RLS
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE products IS 'Stores product/inventory information with multi-tenant support';
COMMENT ON TABLE categories IS 'Stores product categories with multi-tenant support';
COMMENT ON TABLE customers IS 'Stores customer information with multi-tenant support';
COMMENT ON TABLE invoices IS 'Stores invoice records with multi-tenant support';
COMMENT ON TABLE transactions IS 'Stores financial transactions with multi-tenant support';
