-- Performance Optimization Indexes
-- This migration adds indexes to improve query performance for multi-tenant operations

-- Organizations indexes
CREATE INDEX IF NOT EXISTS idx_organizations_subscription_status 
  ON organizations(subscription_status);

CREATE INDEX IF NOT EXISTS idx_organizations_is_active 
  ON organizations(is_active);

CREATE INDEX IF NOT EXISTS idx_organizations_created_at 
  ON organizations(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_organizations_slug 
  ON organizations(slug);

-- Organization Members indexes
CREATE INDEX IF NOT EXISTS idx_org_members_org_id 
  ON organization_members(organization_id);

CREATE INDEX IF NOT EXISTS idx_org_members_user_id 
  ON organization_members(user_id);

CREATE INDEX IF NOT EXISTS idx_org_members_is_active 
  ON organization_members(is_active);

CREATE INDEX IF NOT EXISTS idx_org_members_role 
  ON organization_members(role);

-- Composite index for common query pattern
CREATE INDEX IF NOT EXISTS idx_org_members_org_user 
  ON organization_members(organization_id, user_id);

-- Subscriptions indexes
CREATE INDEX IF NOT EXISTS idx_subscriptions_org_id 
  ON subscriptions(organization_id);

CREATE INDEX IF NOT EXISTS idx_subscriptions_status 
  ON subscriptions(status);

CREATE INDEX IF NOT EXISTS idx_subscriptions_period_end 
  ON subscriptions(current_period_end);

CREATE INDEX IF NOT EXISTS idx_subscriptions_flutterwave_id 
  ON subscriptions(flutterwave_subscription_id);

-- Products indexes
CREATE INDEX IF NOT EXISTS idx_products_org_id 
  ON products(organization_id);

CREATE INDEX IF NOT EXISTS idx_products_name 
  ON products(name);

-- Categories indexes
CREATE INDEX IF NOT EXISTS idx_categories_org_id 
  ON categories(organization_id);

CREATE INDEX IF NOT EXISTS idx_categories_name 
  ON categories(name);

-- Customers indexes
CREATE INDEX IF NOT EXISTS idx_customers_org_id 
  ON customers(organization_id);

CREATE INDEX IF NOT EXISTS idx_customers_email 
  ON customers(email);

CREATE INDEX IF NOT EXISTS idx_customers_phone 
  ON customers(phone) WHERE phone IS NOT NULL;

-- Invoices indexes
CREATE INDEX IF NOT EXISTS idx_invoices_org_id 
  ON invoices(organization_id);

CREATE INDEX IF NOT EXISTS idx_invoices_status 
  ON invoices(status);

CREATE INDEX IF NOT EXISTS idx_invoices_created_at 
  ON invoices(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_invoices_customer_id 
  ON invoices(customer_id);

-- Composite index for common query pattern
CREATE INDEX IF NOT EXISTS idx_invoices_org_status 
  ON invoices(organization_id, status);

-- Transactions indexes
CREATE INDEX IF NOT EXISTS idx_transactions_org_id 
  ON transactions(organization_id);

CREATE INDEX IF NOT EXISTS idx_transactions_date 
  ON transactions(date DESC);

-- Audit Logs indexes
CREATE INDEX IF NOT EXISTS idx_audit_logs_org_id 
  ON audit_logs(organization_id) WHERE organization_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_audit_logs_action 
  ON audit_logs(action);

CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at 
  ON audit_logs(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_audit_logs_admin_user 
  ON audit_logs(admin_user_id);

-- Composite index for common query pattern
CREATE INDEX IF NOT EXISTS idx_audit_logs_org_action 
  ON audit_logs(organization_id, action) WHERE organization_id IS NOT NULL;

-- Usage Metrics indexes
CREATE INDEX IF NOT EXISTS idx_usage_metrics_org_id 
  ON usage_metrics(organization_id);

CREATE INDEX IF NOT EXISTS idx_usage_metrics_type 
  ON usage_metrics(metric_type);

CREATE INDEX IF NOT EXISTS idx_usage_metrics_recorded_at 
  ON usage_metrics(recorded_at DESC);

-- Composite index for common query pattern
CREATE INDEX IF NOT EXISTS idx_usage_metrics_org_type 
  ON usage_metrics(organization_id, metric_type);

-- Organization Invitations indexes (if table exists)
CREATE INDEX IF NOT EXISTS idx_org_invitations_token 
  ON organization_invitations(token);

CREATE INDEX IF NOT EXISTS idx_org_invitations_email 
  ON organization_invitations(email);

CREATE INDEX IF NOT EXISTS idx_org_invitations_status 
  ON organization_invitations(status);

CREATE INDEX IF NOT EXISTS idx_org_invitations_org_id 
  ON organization_invitations(organization_id);

-- Add comments for documentation
COMMENT ON INDEX idx_organizations_subscription_status IS 'Optimize queries filtering by subscription status';
COMMENT ON INDEX idx_org_members_org_user IS 'Optimize membership lookups by organization and user';
COMMENT ON INDEX idx_invoices_org_status IS 'Optimize invoice queries by organization and status';
COMMENT ON INDEX idx_audit_logs_org_action IS 'Optimize audit log queries by organization and action';
COMMENT ON INDEX idx_usage_metrics_org_type IS 'Optimize usage metric queries by organization and type';

-- Analyze tables to update statistics
ANALYZE organizations;
ANALYZE organization_members;
ANALYZE subscriptions;
ANALYZE products;
ANALYZE categories;
ANALYZE customers;
ANALYZE invoices;
ANALYZE transactions;
ANALYZE audit_logs;
ANALYZE usage_metrics;
