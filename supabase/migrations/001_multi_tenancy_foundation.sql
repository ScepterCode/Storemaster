-- Multi-Tenancy Foundation Migration
-- This migration sets up the core multi-tenant architecture

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Organizations/Tenants Table
CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  email TEXT,
  phone TEXT,
  address TEXT,
  
  -- Subscription details
  subscription_tier TEXT NOT NULL DEFAULT 'free' CHECK (subscription_tier IN ('free', 'basic', 'pro', 'enterprise')),
  subscription_status TEXT NOT NULL DEFAULT 'trial' CHECK (subscription_status IN ('trial', 'active', 'suspended', 'cancelled', 'expired')),
  trial_ends_at TIMESTAMP WITH TIME ZONE,
  subscription_starts_at TIMESTAMP WITH TIME ZONE,
  subscription_ends_at TIMESTAMP WITH TIME ZONE,
  
  -- Limits based on subscription
  max_users INTEGER DEFAULT 5,
  max_products INTEGER DEFAULT 100,
  max_invoices_per_month INTEGER DEFAULT 50,
  max_storage_mb INTEGER DEFAULT 500,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  -- Metadata
  settings JSONB DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- Create index on slug for fast lookups
CREATE INDEX idx_organizations_slug ON organizations(slug);
CREATE INDEX idx_organizations_status ON organizations(subscription_status);
CREATE INDEX idx_organizations_active ON organizations(is_active) WHERE is_active = true;

-- Admin Users Table
CREATE TABLE IF NOT EXISTS admin_users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  is_super_admin BOOLEAN DEFAULT false,
  permissions JSONB DEFAULT '[]',
  last_login_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Organization Members (link users to organizations)
CREATE TABLE IF NOT EXISTS organization_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  is_active BOOLEAN DEFAULT true,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(organization_id, user_id)
);

CREATE INDEX idx_org_members_org ON organization_members(organization_id);
CREATE INDEX idx_org_members_user ON organization_members(user_id);

-- Subscriptions Table (for Flutterwave integration)
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Plan details
  plan_id TEXT NOT NULL,
  plan_name TEXT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'NGN',
  interval TEXT NOT NULL DEFAULT 'monthly' CHECK (interval IN ('monthly', 'yearly')),
  
  -- Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'cancelled', 'expired', 'failed')),
  
  -- Billing periods
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  cancel_at_period_end BOOLEAN DEFAULT false,
  cancelled_at TIMESTAMP WITH TIME ZONE,
  
  -- Flutterwave details
  flutterwave_subscription_id TEXT,
  flutterwave_customer_id TEXT,
  flutterwave_plan_id TEXT,
  
  -- Payment tracking
  next_payment_date TIMESTAMP WITH TIME ZONE,
  last_payment_date TIMESTAMP WITH TIME ZONE,
  failed_payment_count INTEGER DEFAULT 0,
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_subscriptions_org ON subscriptions(organization_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_subscriptions_flutterwave ON subscriptions(flutterwave_subscription_id);

-- Usage Metrics Table
CREATE TABLE IF NOT EXISTS usage_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Metric details
  metric_type TEXT NOT NULL CHECK (metric_type IN ('users', 'products', 'invoices', 'storage', 'api_calls')),
  metric_value INTEGER NOT NULL DEFAULT 0,
  
  -- Period tracking
  period_start TIMESTAMP WITH TIME ZONE NOT NULL,
  period_end TIMESTAMP WITH TIME ZONE NOT NULL,
  
  -- Metadata
  details JSONB DEFAULT '{}',
  
  -- Timestamp
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_usage_metrics_org ON usage_metrics(organization_id);
CREATE INDEX idx_usage_metrics_type ON usage_metrics(metric_type);
CREATE INDEX idx_usage_metrics_period ON usage_metrics(period_start, period_end);

-- Audit Logs Table
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Actor
  admin_user_id UUID REFERENCES admin_users(id),
  user_id UUID REFERENCES auth.users(id),
  
  -- Action details
  action TEXT NOT NULL,
  target_type TEXT,
  target_id UUID,
  organization_id UUID REFERENCES organizations(id),
  
  -- Context
  details JSONB DEFAULT '{}',
  ip_address TEXT,
  user_agent TEXT,
  
  -- Timestamp
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_admin ON audit_logs(admin_user_id);
CREATE INDEX idx_audit_logs_org ON audit_logs(organization_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at DESC);

-- Add organization_id to existing tables
ALTER TABLE products ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
ALTER TABLE categories ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

-- Create indexes for organization_id on existing tables
CREATE INDEX IF NOT EXISTS idx_products_org ON products(organization_id);
CREATE INDEX IF NOT EXISTS idx_categories_org ON categories(organization_id);
CREATE INDEX IF NOT EXISTS idx_customers_org ON customers(organization_id);
CREATE INDEX IF NOT EXISTS idx_invoices_org ON invoices(organization_id);
CREATE INDEX IF NOT EXISTS idx_transactions_org ON transactions(organization_id);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_admin_users_updated_at BEFORE UPDATE ON admin_users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_organization_members_updated_at BEFORE UPDATE ON organization_members
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) Policies

-- Enable RLS on all tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Organizations: Users can only see their own organization
CREATE POLICY "Users can view their organization"
  ON organizations FOR SELECT
  USING (
    id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

-- Organizations: Admins can view all organizations
CREATE POLICY "Admins can view all organizations"
  ON organizations FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE id = auth.uid()
    )
  );

-- Organization Members: Users can view members of their organization
CREATE POLICY "Users can view their organization members"
  ON organization_members FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

-- Organization Members: Admins can view all
CREATE POLICY "Admins can view all organization members"
  ON organization_members FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE id = auth.uid()
    )
  );

-- Products: Users can only access their organization's products
CREATE POLICY "Users can access their organization products"
  ON products FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

-- Products: Admins can access all products
CREATE POLICY "Admins can access all products"
  ON products FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE id = auth.uid()
    )
  );

-- Similar policies for other tables
CREATE POLICY "Users can access their organization categories"
  ON categories FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "Admins can access all categories"
  ON categories FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can access their organization customers"
  ON customers FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "Admins can access all customers"
  ON customers FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can access their organization invoices"
  ON invoices FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "Admins can access all invoices"
  ON invoices FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can access their organization transactions"
  ON transactions FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "Admins can access all transactions"
  ON transactions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE id = auth.uid()
    )
  );

-- Subscriptions: Users can view their organization's subscription
CREATE POLICY "Users can view their organization subscription"
  ON subscriptions FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

-- Subscriptions: Admins can manage all subscriptions
CREATE POLICY "Admins can manage all subscriptions"
  ON subscriptions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE id = auth.uid()
    )
  );

-- Usage Metrics: Admins only
CREATE POLICY "Admins can access usage metrics"
  ON usage_metrics FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE id = auth.uid()
    )
  );

-- Audit Logs: Admins only
CREATE POLICY "Admins can access audit logs"
  ON audit_logs FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE id = auth.uid()
    )
  );

-- Helper function to get user's organization
CREATE OR REPLACE FUNCTION get_user_organization_id(user_uuid UUID)
RETURNS UUID AS $$
  SELECT organization_id FROM organization_members
  WHERE user_id = user_uuid AND is_active = true
  LIMIT 1;
$$ LANGUAGE SQL STABLE;

-- Helper function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin(user_uuid UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM admin_users
    WHERE id = user_uuid
  );
$$ LANGUAGE SQL STABLE;

-- Helper function to check if user is super admin
CREATE OR REPLACE FUNCTION is_super_admin(user_uuid UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM admin_users
    WHERE id = user_uuid AND is_super_admin = true
  );
$$ LANGUAGE SQL STABLE;

COMMENT ON TABLE organizations IS 'Stores tenant/organization information for multi-tenancy';
COMMENT ON TABLE admin_users IS 'Stores platform administrators who can manage all organizations';
COMMENT ON TABLE organization_members IS 'Links users to organizations with roles';
COMMENT ON TABLE subscriptions IS 'Stores subscription and billing information (Flutterwave integration)';
COMMENT ON TABLE usage_metrics IS 'Tracks usage metrics per organization for billing and limits';
COMMENT ON TABLE audit_logs IS 'Audit trail for admin actions and important events';
