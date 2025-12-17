/**
 * Multi-Tenant Migration Utility
 * 
 * Handles migration of existing single-tenant data to multi-tenant architecture.
 * Creates a default organization for existing users and assigns all their data to it.
 */

import { supabase } from '@/integrations/supabase/client';
import { adminService } from '@/services/adminService';
import type { Organization } from '@/types/admin';

// Migration status tracking
const MULTI_TENANT_MIGRATION_KEY = 'multi_tenant_migration_status';
const MULTI_TENANT_MIGRATION_VERSION = 1;

export interface MultiTenantMigrationStatus {
  version: number;
  completed: boolean;
  organizationId?: string;
  timestamp?: string;
  error?: string;
}

export interface MultiTenantMigrationResult {
  success: boolean;
  organizationId?: string;
  error?: string;
  details: {
    organizationCreated: boolean;
    membershipCreated: boolean;
    productsUpdated: number;
    categoriesUpdated: number;
    customersUpdated: number;
    invoicesUpdated: number;
    transactionsUpdated: number;
  };
}

/**
 * Get the current migration status from localStorage
 */
export function getMultiTenantMigrationStatus(): MultiTenantMigrationStatus {
  try {
    const statusJson = localStorage.getItem(MULTI_TENANT_MIGRATION_KEY);
    if (!statusJson) {
      return {
        version: 0,
        completed: false,
      };
    }
    return JSON.parse(statusJson);
  } catch (error) {
    console.error('Error reading multi-tenant migration status:', error);
    return {
      version: 0,
      completed: false,
    };
  }
}

/**
 * Set the migration status in localStorage
 */
function setMultiTenantMigrationStatus(status: MultiTenantMigrationStatus): void {
  try {
    localStorage.setItem(MULTI_TENANT_MIGRATION_KEY, JSON.stringify(status));
  } catch (error) {
    console.error('Error setting multi-tenant migration status:', error);
  }
}

/**
 * Check if the user needs multi-tenant migration
 */
export async function needsMultiTenantMigration(): Promise<boolean> {
  try {
    // Check localStorage status first
    const status = getMultiTenantMigrationStatus();
    if (status.completed && status.version >= MULTI_TENANT_MIGRATION_VERSION) {
      return false;
    }

    // Check if user is authenticated
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return false;
    }

    // Check if user already has an organization membership
    const { data: memberships, error } = await supabase
      .from('organization_members' as any)
      .select('id')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .limit(1);

    if (error) {
      console.error('Error checking organization membership:', error);
      return false;
    }

    // If user has a membership, no migration needed
    if (memberships && memberships.length > 0) {
      // Update localStorage to reflect this
      setMultiTenantMigrationStatus({
        version: MULTI_TENANT_MIGRATION_VERSION,
        completed: true,
        timestamp: new Date().toISOString(),
      });
      return false;
    }

    // Check if user has any existing data that needs migration
    const hasExistingData = await checkForExistingData(user.id);
    
    return hasExistingData;
  } catch (error) {
    console.error('Error checking migration need:', error);
    return false;
  }
}

/**
 * Check if user has existing data in the database
 */
async function checkForExistingData(userId: string): Promise<boolean> {
  try {
    // Check for products
    const { count: productCount } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .is('organization_id', null);

    if (productCount && productCount > 0) {
      return true;
    }

    // Check for categories
    const { count: categoryCount } = await supabase
      .from('categories')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .is('organization_id', null);

    if (categoryCount && categoryCount > 0) {
      return true;
    }

    // Check for customers
    const { count: customerCount } = await supabase
      .from('customers')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .is('organization_id', null);

    if (customerCount && customerCount > 0) {
      return true;
    }

    // Check for invoices
    const { count: invoiceCount } = await supabase
      .from('invoices')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .is('organization_id', null);

    if (invoiceCount && invoiceCount > 0) {
      return true;
    }

    // Check for transactions
    const { count: transactionCount } = await supabase
      .from('transactions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .is('organization_id', null);

    if (transactionCount && transactionCount > 0) {
      return true;
    }

    return false;
  } catch (error) {
    console.error('Error checking for existing data:', error);
    return false;
  }
}

/**
 * Generate a unique slug from a name
 */
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 50);
}

/**
 * Run the multi-tenant migration for the current user
 */
export async function runMultiTenantMigration(): Promise<MultiTenantMigrationResult> {
  const result: MultiTenantMigrationResult = {
    success: false,
    details: {
      organizationCreated: false,
      membershipCreated: false,
      productsUpdated: 0,
      categoriesUpdated: 0,
      customersUpdated: 0,
      invoicesUpdated: 0,
      transactionsUpdated: 0,
    },
  };

  try {
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('User not authenticated');
    }

    console.log('Starting multi-tenant migration for user:', user.id);

    // Step 1: Create default organization
    const organizationName = user.email?.split('@')[0] || 'My Organization';
    const slug = generateSlug(organizationName) + '-' + user.id.substring(0, 8);

    const organization: Partial<Organization> = {
      name: organizationName,
      slug,
      email: user.email,
      subscription_tier: 'free',
      subscription_status: 'active',
      max_users: 2,
      max_products: 50,
      max_invoices_per_month: 20,
      max_storage_mb: 100,
      is_active: true,
    };

    console.log('Creating organization:', organization);

    const createdOrg = await adminService.createOrganization(organization);
    result.details.organizationCreated = true;
    result.organizationId = createdOrg.id;

    console.log('Organization created:', createdOrg.id);

    // Step 2: Create organization membership for the user
    await adminService.addOrganizationMember(createdOrg.id, user.id, 'owner');
    result.details.membershipCreated = true;

    console.log('Membership created for user:', user.id);

    // Step 3: Update all existing data to belong to the new organization
    
    // Update products
    const productsQuery = await supabase
      .from('products')
      .update({ organization_id: createdOrg.id } as any)
      .eq('user_id', user.id)
      .is('organization_id', null)
      .select();
    
    result.details.productsUpdated = productsQuery.data?.length || 0;
    console.log('Products updated:', productsQuery.data?.length);

    // Update categories
    const categoriesQuery = await supabase
      .from('categories')
      .update({ organization_id: createdOrg.id } as any)
      .eq('user_id', user.id)
      .is('organization_id', null)
      .select();
    
    result.details.categoriesUpdated = categoriesQuery.data?.length || 0;
    console.log('Categories updated:', categoriesQuery.data?.length);

    // Update customers
    const customersQuery = await supabase
      .from('customers')
      .update({ organization_id: createdOrg.id } as any)
      .eq('user_id', user.id)
      .is('organization_id', null)
      .select();
    
    result.details.customersUpdated = customersQuery.data?.length || 0;
    console.log('Customers updated:', customersQuery.data?.length);

    // Update invoices
    const invoicesQuery = await supabase
      .from('invoices')
      .update({ organization_id: createdOrg.id } as any)
      .eq('user_id', user.id)
      .is('organization_id', null)
      .select();
    
    result.details.invoicesUpdated = invoicesQuery.data?.length || 0;
    console.log('Invoices updated:', invoicesQuery.data?.length);

    // Update transactions
    const transactionsQuery = await supabase
      .from('transactions')
      .update({ organization_id: createdOrg.id } as any)
      .eq('user_id', user.id)
      .is('organization_id', null)
      .select();
    
    result.details.transactionsUpdated = transactionsQuery.data?.length || 0;
    console.log('Transactions updated:', transactionsQuery.data?.length);

    // Step 4: Mark migration as complete
    setMultiTenantMigrationStatus({
      version: MULTI_TENANT_MIGRATION_VERSION,
      completed: true,
      organizationId: createdOrg.id,
      timestamp: new Date().toISOString(),
    });

    result.success = true;
    console.log('Multi-tenant migration completed successfully');

    return result;
  } catch (error) {
    console.error('Multi-tenant migration failed:', error);
    
    result.error = error instanceof Error ? error.message : 'Unknown error';
    
    // Save error status
    setMultiTenantMigrationStatus({
      version: MULTI_TENANT_MIGRATION_VERSION,
      completed: false,
      timestamp: new Date().toISOString(),
      error: result.error,
    });

    return result;
  }
}

/**
 * Reset migration status (for testing purposes)
 */
export function resetMultiTenantMigration(): void {
  try {
    localStorage.removeItem(MULTI_TENANT_MIGRATION_KEY);
    console.log('Multi-tenant migration status reset');
  } catch (error) {
    console.error('Error resetting multi-tenant migration status:', error);
  }
}
