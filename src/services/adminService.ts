/**
 * Admin Service
 * 
 * Service for admin operations including organization management,
 * user management, and platform analytics
 */

import { supabase } from '@/integrations/supabase/client';
import {
  Organization,
  OrganizationMember,
  Subscription,
  UsageMetric,
  AuditLog,
  PlatformStats,
  OrganizationStats,
} from '@/types/admin';

/**
 * Organization Management
 */
export const adminService = {
  // ===== Organizations =====
  
  async getAllOrganizations(): Promise<Organization[]> {
    const { data, error } = await supabase
      .from('organizations')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as Organization[];
  },

  async getOrganization(id: string): Promise<Organization> {
    const { data, error } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data as Organization;
  },

  async createOrganization(org: Partial<Organization>): Promise<Organization> {
    // Use the database function to create organization and add owner atomically
    const { data, error } = await supabase.rpc('create_organization_with_owner', {
      org_name: org.name!,
      org_slug: org.slug!,
      org_email: org.email || null,
      org_phone: org.phone || null,
      org_address: org.address || null,
      subscription_tier: org.subscription_tier || 'free',
    });

    if (error) throw error;
    if (!data || data.length === 0) throw new Error('Failed to create organization');
    
    const result = data[0];
    const organization = result.organization_data as Organization;
    
    // Log the action
    await this.logAuditAction('organization_created', 'organization', organization.id, { organization });
    
    return organization;
  },

  async updateOrganization(id: string, updates: Partial<Organization>): Promise<Organization> {
    const { data, error } = await supabase
      .from('organizations')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    
    // Log the action
    await this.logAuditAction('organization_updated', 'organization', id, { updates });
    
    return data as Organization;
  },

  async suspendOrganization(id: string): Promise<void> {
    await this.updateOrganization(id, {
      is_active: false,
      subscription_status: 'suspended',
    });
    
    await this.logAuditAction('organization_suspended', 'organization', id);
  },

  async activateOrganization(id: string): Promise<void> {
    await this.updateOrganization(id, {
      is_active: true,
      subscription_status: 'active',
    });
    
    await this.logAuditAction('organization_activated', 'organization', id);
  },

  async deleteOrganization(id: string): Promise<void> {
    const { error } = await supabase
      .from('organizations')
      .delete()
      .eq('id', id);

    if (error) throw error;
    
    await this.logAuditAction('organization_deleted', 'organization', id);
  },

  // ===== Organization Members =====

  async getOrganizationMembers(organizationId: string): Promise<OrganizationMember[]> {
    const { data, error } = await supabase
      .from('organization_members')
      .select(`
        *,
        user:user_id (
          email
        )
      `)
      .eq('organization_id', organizationId)
      .order('joined_at', { ascending: false });

    if (error) throw error;
    return data as any;
  },

  async addOrganizationMember(
    organizationId: string,
    userId: string,
    role: 'owner' | 'admin' | 'member'
  ): Promise<OrganizationMember> {
    const { data, error } = await supabase
      .from('organization_members')
      .insert({
        organization_id: organizationId,
        user_id: userId,
        role,
      })
      .select()
      .single();

    if (error) throw error;
    
    await this.logAuditAction('member_added', 'organization_member', data.id, {
      organization_id: organizationId,
      user_id: userId,
      role,
    });
    
    return data as OrganizationMember;
  },

  async removeOrganizationMember(memberId: string): Promise<void> {
    const { error } = await supabase
      .from('organization_members')
      .delete()
      .eq('id', memberId);

    if (error) throw error;
    
    await this.logAuditAction('member_removed', 'organization_member', memberId);
  },

  // ===== Subscriptions =====

  async getOrganizationSubscription(organizationId: string): Promise<Subscription | null> {
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    
    return data as Subscription;
  },

  async getAllSubscriptions(): Promise<Subscription[]> {
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as Subscription[];
  },

  async createSubscription(subscription: Partial<Subscription>): Promise<Subscription> {
    const { data, error } = await supabase
      .from('subscriptions')
      .insert(subscription)
      .select()
      .single();

    if (error) throw error;
    
    await this.logAuditAction('subscription_created', 'subscription', data.id, { subscription: data });
    
    return data as Subscription;
  },

  async updateSubscription(id: string, updates: Partial<Subscription>): Promise<Subscription> {
    const { data, error } = await supabase
      .from('subscriptions')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    
    await this.logAuditAction('subscription_updated', 'subscription', id, { updates });
    
    return data as Subscription;
  },

  async cancelSubscription(id: string): Promise<void> {
    await this.updateSubscription(id, {
      status: 'cancelled',
      cancelled_at: new Date().toISOString(),
    });
    
    await this.logAuditAction('subscription_cancelled', 'subscription', id);
  },

  // ===== Usage Metrics =====

  async recordUsageMetric(metric: Partial<UsageMetric>): Promise<UsageMetric> {
    const { data, error } = await supabase
      .from('usage_metrics')
      .insert(metric)
      .select()
      .single();

    if (error) throw error;
    return data as UsageMetric;
  },

  async getOrganizationUsage(
    organizationId: string,
    metricType?: string
  ): Promise<UsageMetric[]> {
    let query = supabase
      .from('usage_metrics')
      .select('*')
      .eq('organization_id', organizationId)
      .order('recorded_at', { ascending: false });

    if (metricType) {
      query = query.eq('metric_type', metricType);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data as UsageMetric[];
  },

  // ===== Platform Analytics =====

  async getPlatformStats(): Promise<PlatformStats> {
    // Get total organizations
    const { count: totalOrgs } = await supabase
      .from('organizations')
      .select('*', { count: 'exact', head: true });

    // Get active organizations
    const { count: activeOrgs } = await supabase
      .from('organizations')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true);

    // Get total users (from organization_members)
    const { count: totalUsers } = await supabase
      .from('organization_members')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true);

    // Get active subscriptions for MRR calculation
    const { data: subscriptions } = await supabase
      .from('subscriptions')
      .select('amount, interval')
      .eq('status', 'active');

    let mrr = 0;
    if (subscriptions) {
      mrr = subscriptions.reduce((sum, sub) => {
        const monthlyAmount = sub.interval === 'yearly' ? sub.amount / 12 : sub.amount;
        return sum + monthlyAmount;
      }, 0);
    }

    // Get new signups this month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const { count: newSignups } = await supabase
      .from('organizations')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', startOfMonth.toISOString());

    return {
      total_organizations: totalOrgs || 0,
      active_organizations: activeOrgs || 0,
      total_users: totalUsers || 0,
      total_revenue: mrr * 12, // Annualized
      mrr,
      new_signups_this_month: newSignups || 0,
      churn_rate: await this.calculateChurnRate(),
    };
  },

  async getOrganizationStats(organizationId: string): Promise<OrganizationStats> {
    // Get member count
    const { count: userCount } = await supabase
      .from('organization_members')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', organizationId)
      .eq('is_active', true);

    // Get product count
    const { count: productCount } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', organizationId);

    // Get invoice count
    const { count: invoiceCount } = await supabase
      .from('invoices')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', organizationId);

    // Get total revenue from invoices
    const { data: invoices } = await supabase
      .from('invoices')
      .select('total_amount')
      .eq('organization_id', organizationId)
      .eq('status', 'paid');

    const totalRevenue = invoices?.reduce((sum, inv) => sum + inv.total_amount, 0) || 0;

    return {
      organization_id: organizationId,
      total_users: userCount || 0,
      total_products: productCount || 0,
      total_invoices: invoiceCount || 0,
      total_revenue: totalRevenue,
      storage_used_mb: await this.calculateStorageUsage(organizationId),
      api_calls_this_month: await this.getApiCallsThisMonth(organizationId),
    };
  },

  /**
   * Calculate churn rate for the platform
   * Churn rate = (Cancelled subscriptions this month / Active subscriptions at start of month) * 100
   */
  async calculateChurnRate(): Promise<number> {
    try {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

      // Get active subscriptions at start of month
      const { count: activeAtStart } = await supabase
        .from('subscriptions')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active')
        .lt('created_at', startOfMonth.toISOString());

      // Get cancelled subscriptions this month
      const { count: cancelledThisMonth } = await supabase
        .from('subscriptions')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'cancelled')
        .gte('updated_at', startOfMonth.toISOString())
        .lt('updated_at', now.toISOString());

      if (!activeAtStart || activeAtStart === 0) {
        return 0;
      }

      const churnRate = ((cancelledThisMonth || 0) / activeAtStart) * 100;
      return Math.round(churnRate * 100) / 100; // Round to 2 decimal places
    } catch (error) {
      console.error('Error calculating churn rate:', error);
      return 0;
    }
  },

  /**
   * Calculate storage usage for an organization
   */
  async calculateStorageUsage(organizationId: string): Promise<number> {
    try {
      // Query storage.objects for files belonging to this organization
      const { data: files, error } = await supabase
        .from('storage.objects')
        .select('metadata')
        .like('name', `${organizationId}/%`);

      if (error) {
        console.error('Error fetching storage usage:', error);
        return 0;
      }

      if (!files || files.length === 0) {
        return 0;
      }

      // Sum up file sizes
      const totalBytes = files.reduce((sum, file) => {
        const size = file.metadata?.size || 0;
        return sum + size;
      }, 0);

      // Convert to MB
      return Math.round((totalBytes / (1024 * 1024)) * 100) / 100;
    } catch (error) {
      console.error('Error calculating storage usage:', error);
      return 0;
    }
  },

  /**
   * Get API calls for an organization this month
   * This tracks calls via audit logs
   */
  async getApiCallsThisMonth(organizationId: string): Promise<number> {
    try {
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      // Count audit log entries for API operations this month
      const { count, error } = await supabase
        .from('audit_logs')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', organizationId)
        .gte('created_at', startOfMonth.toISOString())
        .in('action', [
          'product.create', 'product.update', 'product.delete',
          'invoice.create', 'invoice.update', 'invoice.delete',
          'customer.create', 'customer.update', 'customer.delete',
          'category.create', 'category.update', 'category.delete'
        ]);

      if (error) {
        console.error('Error fetching API calls:', error);
        return 0;
      }

      return count || 0;
    } catch (error) {
      console.error('Error getting API calls:', error);
      return 0;
    }
  },

  // ===== Audit Logging =====

  async logAuditAction(
    action: string,
    targetType?: string,
    targetId?: string,
    details?: Record<string, any>
  ): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) return;

    await supabase.from('audit_logs').insert({
      admin_user_id: user.id,
      action,
      target_type: targetType,
      target_id: targetId,
      details,
    });
  },

  async getAuditLogs(filters?: {
    organizationId?: string;
    action?: string;
    limit?: number;
  }): Promise<AuditLog[]> {
    let query = supabase
      .from('audit_logs')
      .select('*')
      .order('created_at', { ascending: false });

    if (filters?.organizationId) {
      query = query.eq('organization_id', filters.organizationId);
    }

    if (filters?.action) {
      query = query.eq('action', filters.action);
    }

    if (filters?.limit) {
      query = query.limit(filters.limit);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data as AuditLog[];
  },
};
