-- Create Base Tables
-- This migration creates the foundational tables for the application
-- Run this BEFORE 001_multi_tenancy_foundation.sql

-- Products Table
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 0,
  unit_price DECIMAL(10, 2) NOT NULL,
  category TEXT,
  description TEXT,
  synced BOOLEAN DEFAULT false,
  last_modified TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  sync_attempts INTEGER DEFAULT 0,
  last_sync_error TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Categories Table
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  synced BOOLEAN DEFAULT false,
  last_modified TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  sync_attempts INTEGER DEFAULT 0,
  last_sync_error TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Customers Table
CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  address TEXT,
  synced BOOLEAN DEFAULT false,
  last_modified TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  sync_attempts INTEGER DEFAULT 0,
  last_sync_error TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Invoices Table
CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_name TEXT NOT NULL,
  customer_id UUID,
  date TIMESTAMP WITH TIME ZONE NOT NULL,
  items JSONB NOT NULL DEFAULT '[]',
  total_amount DECIMAL(10, 2) NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('draft', 'issued', 'paid', 'overdue')),
  due_date TIMESTAMP WITH TIME ZONE,
  synced BOOLEAN DEFAULT false,
  last_modified TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  sync_attempts INTEGER DEFAULT 0,
  last_sync_error TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Transactions Table
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  amount DECIMAL(10, 2) NOT NULL,
  description TEXT NOT NULL,
  date TIMESTAMP WITH TIME ZONE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('sale', 'purchase', 'expense')),
  category TEXT,
  reference TEXT,
  synced BOOLEAN DEFAULT false,
  last_modified TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  sync_attempts INTEGER DEFAULT 0,
  last_sync_error TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_products_name ON products(name);
CREATE INDEX IF NOT EXISTS idx_categories_name ON categories(name);
CREATE INDEX IF NOT EXISTS idx_customers_name ON customers(name);
CREATE INDEX IF NOT EXISTS idx_invoices_date ON invoices(date DESC);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);

COMMENT ON TABLE products IS 'Stores product/inventory information';
COMMENT ON TABLE categories IS 'Stores product categories';
COMMENT ON TABLE customers IS 'Stores customer information';
COMMENT ON TABLE invoices IS 'Stores invoice records';
COMMENT ON TABLE transactions IS 'Stores financial transactions';
