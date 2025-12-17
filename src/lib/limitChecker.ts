/**
 * Limit Checker Utility
 * 
 * Provides functions to check current usage against subscription plan limits.
 * Used to enforce plan restrictions and prompt upgrades when limits are reached.
 * 
 * @module limitChecker
 */

import { supabase } from '@/integrations/supabase/client';
import { Organization, SubscriptionPlan } from '@/types/admin';
import { getPlanByTier } from '@/config/subscriptionPlans';

/**
 * Limit status for a specific resource type
 */
export interface LimitStatus {
  current: number;
  limit: number;
  isAtLimit: boolean;
  isNearLimit: boolean; // Within 80% of limit
  percentage: number;
  remaining: number;
}

/**
 * Complete limit check result for an organization
 */
export interface OrganizationLimits {
  users: LimitStatus;
  products: LimitStatus;
  invoices: LimitStatus;
  storage: LimitStatus;
  plan: SubscriptionPlan;
  organization: Organization;
}

/**
 * Calculate limit status for a resource
 * 
 * @param current - Current usage count
 * @param limit - Maximum allowed by plan (-1 for unlimited)
 * @returns Limit status with usage details
 */
const calculateLimitStatus = (current: number, limit: number): LimitStatus => {
  // Handle unlimited plans
  if (limit === -1) {
    return {
      current,
      limit: -1,
      isAtLimit: false,
      isNearLimit: false,
      percentage: 0,
      remaining: -1,
    };
  }

  const percentage = (current / limit) * 100;
  const remaining = Math.max(0, limit - current);

  return {
    current,
    limit,
    isAtLimit: current >= limit,
    isNearLimit: percentage >= 80,
    percentage,
    remaining,
  };
};

/**
 * Get current user count for an organization
 * 
 * @param organizationId - The organization ID
 * @returns Current number of active users
 */
export const getCurrentUserCount = async (organizationId: string): Promise<number> => {
  const { count, error } = await supabase
    .from('organization_members')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', organizationId)
    .eq('is_active', true);

  if (error) {
    console.error('Error fetching user count:', error);
    throw error;
  }

  return count || 0;
};

/**
 * Get current product count for an organization
 * 
 * @param organizationId - The organization ID
 * @returns Current number of products
 */
export const getCurrentProductCount = async (organizationId: string): Promise<number> => {
  const { count, error } = await supabase
    .from('products')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', organizationId);

  if (error) {
    console.error('Error fetching product count:', error);
    throw error;
  }

  return count || 0;
};

/**
 * Get current invoice count for the current month
 * 
 * @param organizationId - The organization ID
 * @returns Current number of invoices this month
 */
export const getCurrentInvoiceCount = async (organizationId: string): Promise<number> => {
  // Get start of current month
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const { count, error } = await supabase
    .from('invoices')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', organizationId)
    .gte('created_at', startOfMonth.toISOString());

  if (error) {
    console.error('Error fetching invoice count:', error);
    throw error;
  }

  return count || 0;
};

/**
 * Get current storage usage for an organization
 * 
 * Calculates storage usage from:
 * - Product images/attachments
 * - Invoice attachments
 * - Customer documents
 * - Any other uploaded files
 * 
 * @param organizationId - The organization ID
 * @returns Current storage usage in MB
 */
export const getCurrentStorageUsage = async (organizationId: string): Promise<number> => {
  try {
    // Get storage usage from Supabase Storage
    // This queries the storage.objects table for files belonging to this organization
    const { data: files, error } = await supabase
      .from('storage.objects')
      .select('metadata')
      .like('name', `${organizationId}/%`);

    if (error) {
      console.error('Error fetching storage usage:', error);
      // Return 0 on error rather than failing
      return 0;
    }

    if (!files || files.length === 0) {
      return 0;
    }

    // Sum up file sizes (metadata contains size in bytes)
    const totalBytes = files.reduce((sum, file) => {
      const size = file.metadata?.size || 0;
      return sum + size;
    }, 0);

    // Convert bytes to MB
    const totalMB = totalBytes / (1024 * 1024);
    
    return Math.round(totalMB * 100) / 100; // Round to 2 decimal places
  } catch (error) {
    console.error('Error calculating storage usage:', error);
    return 0;
  }
};

/**
 * Check if organization can add a new user
 * 
 * @param organizationId - The organization ID
 * @returns True if user can be added, false if at limit
 */
export const canAddUser = async (organizationId: string): Promise<boolean> => {
  const { data: org, error: orgError } = await supabase
    .from('organizations')
    .select('max_users')
    .eq('id', organizationId)
    .single();

  if (orgError || !org) {
    throw new Error('Failed to fetch organization limits');
  }

  // Unlimited users
  if (org.max_users === -1) {
    return true;
  }

  const currentCount = await getCurrentUserCount(organizationId);
  return currentCount < org.max_users;
};

/**
 * Check if organization can add a new product
 * 
 * @param organizationId - The organization ID
 * @returns True if product can be added, false if at limit
 */
export const canAddProduct = async (organizationId: string): Promise<boolean> => {
  const { data: org, error: orgError } = await supabase
    .from('organizations')
    .select('max_products')
    .eq('id', organizationId)
    .single();

  if (orgError || !org) {
    throw new Error('Failed to fetch organization limits');
  }

  // Unlimited products
  if (org.max_products === -1) {
    return true;
  }

  const currentCount = await getCurrentProductCount(organizationId);
  return currentCount < org.max_products;
};

/**
 * Check if organization can add a new invoice
 * 
 * @param organizationId - The organization ID
 * @returns True if invoice can be added, false if at limit
 */
export const canAddInvoice = async (organizationId: string): Promise<boolean> => {
  const { data: org, error: orgError } = await supabase
    .from('organizations')
    .select('max_invoices_per_month')
    .eq('id', organizationId)
    .single();

  if (orgError || !org) {
    throw new Error('Failed to fetch organization limits');
  }

  // Unlimited invoices
  if (org.max_invoices_per_month === -1) {
    return true;
  }

  const currentCount = await getCurrentInvoiceCount(organizationId);
  return currentCount < org.max_invoices_per_month;
};

/**
 * Get comprehensive limit status for an organization
 * 
 * This is the primary function to check all limits at once.
 * Returns detailed status for users, products, invoices, and storage.
 * 
 * @param organizationId - The organization ID
 * @returns Complete limit status for all resources
 * @throws Error if organization not found or limits cannot be fetched
 * 
 * @example
 * const limits = await checkOrganizationLimits(org.id);
 * if (limits.products.isAtLimit) {
 *   showUpgradePrompt('products', limits);
 * }
 */
export const checkOrganizationLimits = async (
  organizationId: string
): Promise<OrganizationLimits> => {
  // Fetch organization details
  const { data: org, error: orgError } = await supabase
    .from('organizations')
    .select('*')
    .eq('id', organizationId)
    .single();

  if (orgError || !org) {
    throw new Error('Failed to fetch organization');
  }

  const organization = org as Organization;

  // Get the plan details
  const plan = getPlanByTier(organization.subscription_tier);
  if (!plan) {
    throw new Error(`Invalid subscription tier: ${organization.subscription_tier}`);
  }

  // Fetch current usage for all resources in parallel
  const [userCount, productCount, invoiceCount, storageUsage] = await Promise.all([
    getCurrentUserCount(organizationId),
    getCurrentProductCount(organizationId),
    getCurrentInvoiceCount(organizationId),
    getCurrentStorageUsage(organizationId),
  ]);

  // Calculate limit status for each resource
  return {
    users: calculateLimitStatus(userCount, plan.features.max_users),
    products: calculateLimitStatus(productCount, plan.features.max_products),
    invoices: calculateLimitStatus(invoiceCount, plan.features.max_invoices_per_month),
    storage: calculateLimitStatus(storageUsage, plan.features.max_storage_mb),
    plan,
    organization,
  };
};

/**
 * Check a specific limit type
 * 
 * @param organizationId - The organization ID
 * @param limitType - The type of limit to check
 * @returns Limit status for the specified resource
 */
export const checkSpecificLimit = async (
  organizationId: string,
  limitType: 'users' | 'products' | 'invoices' | 'storage'
): Promise<LimitStatus> => {
  const limits = await checkOrganizationLimits(organizationId);
  return limits[limitType];
};
