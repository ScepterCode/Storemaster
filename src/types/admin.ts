/**
 * Admin and Multi-Tenancy Types
 * 
 * Types for the SaaS admin dashboard and multi-tenant architecture
 */

export type SubscriptionTier = 'free' | 'basic' | 'pro' | 'enterprise';

export type SubscriptionStatus = 'trial' | 'active' | 'suspended' | 'cancelled' | 'expired';

export type OrganizationRole = 'owner' | 'admin' | 'member';

export type PaymentInterval = 'monthly' | 'yearly';

export type MetricType = 'users' | 'products' | 'invoices' | 'storage' | 'api_calls';

export interface Organization {
  id: string;
  name: string;
  slug: string;
  email?: string;
  phone?: string;
  address?: string;
  
  // Subscription
  subscription_tier: SubscriptionTier;
  subscription_status: SubscriptionStatus;
  trial_ends_at?: string;
  subscription_starts_at?: string;
  subscription_ends_at?: string;
  
  // Limits
  max_users: number;
  max_products: number;
  max_invoices_per_month: number;
  max_storage_mb: number;
  
  // Status
  is_active: boolean;
  
  // Metadata
  settings?: Record<string, any>;
  metadata?: Record<string, any>;
  
  // Timestamps
  created_at: string;
  updated_at: string;
  deleted_at?: string;
}

export interface AdminUser {
  id: string;
  is_super_admin: boolean;
  permissions: string[];
  last_login_at?: string;
  created_at: string;
  updated_at: string;
}

export interface OrganizationMember {
  id: string;
  organization_id: string;
  user_id: string;
  role: OrganizationRole;
  is_active: boolean;
  joined_at: string;
  created_at: string;
  updated_at: string;
  
  // Populated fields
  user?: {
    email: string;
    name?: string;
  };
}

export interface OrganizationInvitation {
  id: string;
  organization_id: string;
  email: string;
  role: OrganizationRole;
  token: string;
  invited_by: string;
  status: 'pending' | 'accepted' | 'expired' | 'cancelled';
  expires_at: string;
  accepted_at?: string;
  created_at: string;
  updated_at: string;
  
  // Populated fields
  organization?: Organization;
  inviter?: {
    email: string;
    name?: string;
  };
}

export interface Subscription {
  id: string;
  organization_id: string;
  
  // Plan details
  plan_id: string;
  plan_name: string;
  amount: number;
  currency: string;
  interval: PaymentInterval;
  
  // Status
  status: 'pending' | 'active' | 'cancelled' | 'expired' | 'failed';
  
  // Billing periods
  current_period_start?: string;
  current_period_end?: string;
  cancel_at_period_end: boolean;
  cancelled_at?: string;
  
  // Flutterwave details
  flutterwave_subscription_id?: string;
  flutterwave_customer_id?: string;
  flutterwave_plan_id?: string;
  
  // Payment tracking
  next_payment_date?: string;
  last_payment_date?: string;
  failed_payment_count: number;
  
  // Metadata
  metadata?: Record<string, any>;
  
  // Timestamps
  created_at: string;
  updated_at: string;
}

export interface UsageMetric {
  id: string;
  organization_id: string;
  metric_type: MetricType;
  metric_value: number;
  period_start: string;
  period_end: string;
  details?: Record<string, any>;
  recorded_at: string;
}

export interface AuditLog {
  id: string;
  admin_user_id?: string;
  user_id?: string;
  action: string;
  target_type?: string;
  target_id?: string;
  organization_id?: string;
  details?: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

// Admin Dashboard Stats
export interface PlatformStats {
  total_organizations: number;
  active_organizations: number;
  total_users: number;
  total_revenue: number;
  mrr: number; // Monthly Recurring Revenue
  new_signups_this_month: number;
  churn_rate: number;
}

export interface OrganizationStats {
  organization_id: string;
  total_users: number;
  total_products: number;
  total_invoices: number;
  total_revenue: number;
  storage_used_mb: number;
  api_calls_this_month: number;
}

// Subscription Plans
export interface SubscriptionPlan {
  id: string;
  name: string;
  tier: SubscriptionTier;
  price_monthly: number;
  price_yearly: number;
  currency: string;
  description?: string;
  features: {
    max_users: number;
    max_products: number;
    max_invoices_per_month: number;
    max_storage_mb: number;
    api_rate_limit: number;
    support_level: 'email' | 'priority' | '24/7';
    custom_branding: boolean;
    advanced_reports: boolean;
    multi_location: boolean;
  };
  flutterwave_plan_id_monthly?: string;
  flutterwave_plan_id_yearly?: string;
}

// Flutterwave Types
export interface FlutterwavePaymentData {
  tx_ref: string;
  amount: number;
  currency: string;
  redirect_url: string;
  customer: {
    email: string;
    name: string;
    phonenumber?: string;
  };
  customizations: {
    title: string;
    description: string;
    logo?: string;
  };
  payment_plan?: string;
}

export interface FlutterwaveWebhookPayload {
  event: string;
  data: {
    id: number;
    tx_ref: string;
    flw_ref: string;
    amount: number;
    currency: string;
    charged_amount: number;
    status: string;
    payment_type: string;
    customer: {
      id: number;
      email: string;
      name: string;
    };
    created_at: string;
  };
}
