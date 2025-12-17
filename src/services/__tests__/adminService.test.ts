/**
 * Unit tests for Admin Service
 * Tests organization CRUD, member management, subscription operations, and analytics
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Organization, OrganizationMember, Subscription } from '@/types/admin';

// Mock Supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(),
    auth: {
      getUser: vi.fn(),
    },
  },
}));

import { adminService } from '../adminService';
import { supabase } from '@/integrations/supabase/client';

describe('Admin Service', () => {
  const mockOrganization: Organization = {
    id: 'org-123',
    name: 'Test Organization',
    slug: 'test-org',
    subscription_tier: 'basic',
    subscription_status: 'active',
    max_users: 5,
    max_products: 500,
    max_invoices_per_month: 100,
    max_storage_mb: 1000,
    is_active: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  };

  const mockMember: OrganizationMember = {
    id: 'member-123',
    organization_id: 'org-123',
    user_id: 'user-123',
    role: 'member',
    is_active: true,
    joined_at: '2024-01-01T00:00:00Z',
  };

  const mockSubscription: Subscription = {
    id: 'sub-123',
    organization_id: 'org-123',
    plan_id: 'basic',
    plan_name: 'Basic Plan',
    amount: 15000,
    currency: 'NGN',
    interval: 'monthly',
    status: 'active',
    cancel_at_period_end: false,
    failed_payment_count: 0,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock auth.getUser for audit logging
    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: { id: 'admin-user-123' } },
      error: null,
    } as any);
  });

  describe('Organization CRUD Operations', () => {
    it('should get all organizations', async () => {
      const mockData = [mockOrganization];
      
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: mockData, error: null }),
        }),
      } as any);

      const result = await adminService.getAllOrganizations();
      
      expect(result).toEqual(mockData);
      expect(supabase.from).toHaveBeenCalledWith('organizations');
    });

    it('should get single organization by id', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: mockOrganization, error: null }),
          }),
        }),
      } as any);

      const result = await adminService.getOrganization('org-123');
      
      expect(result).toEqual(mockOrganization);
    });

    it('should create organization and log audit action', async () => {
      const newOrg = { name: 'New Org', slug: 'new-org' };
      
      vi.mocked(supabase.from).mockImplementation((table) => {
        if (table === 'organizations') {
          return {
            insert: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: mockOrganization, error: null }),
              }),
            }),
          } as any;
        }
        if (table === 'audit_logs') {
          return {
            insert: vi.fn().mockResolvedValue({ error: null }),
          } as any;
        }
        return {} as any;
      });

      const result = await adminService.createOrganization(newOrg);
      
      expect(result).toEqual(mockOrganization);
    });

    it('should update organization', async () => {
      const updates = { name: 'Updated Name' };
      
      vi.mocked(supabase.from).mockImplementation((table) => {
        if (table === 'organizations') {
          return {
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                select: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({ 
                    data: { ...mockOrganization, ...updates }, 
                    error: null 
                  }),
                }),
              }),
            }),
          } as any;
        }
        if (table === 'audit_logs') {
          return {
            insert: vi.fn().mockResolvedValue({ error: null }),
          } as any;
        }
        return {} as any;
      });

      const result = await adminService.updateOrganization('org-123', updates);
      
      expect(result.name).toBe('Updated Name');
    });

    it('should suspend organization', async () => {
      vi.mocked(supabase.from).mockImplementation((table) => {
        if (table === 'organizations') {
          return {
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                select: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({ 
                    data: { ...mockOrganization, is_active: false, subscription_status: 'suspended' }, 
                    error: null 
                  }),
                }),
              }),
            }),
          } as any;
        }
        if (table === 'audit_logs') {
          return {
            insert: vi.fn().mockResolvedValue({ error: null }),
          } as any;
        }
        return {} as any;
      });

      await adminService.suspendOrganization('org-123');
      
      expect(supabase.from).toHaveBeenCalledWith('organizations');
    });

    it('should throw error when organization not found', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ 
              data: null, 
              error: { message: 'Not found' } 
            }),
          }),
        }),
      } as any);

      await expect(adminService.getOrganization('invalid-id')).rejects.toThrow();
    });
  });

  describe('Member Management', () => {
    it('should get organization members', async () => {
      const mockMembers = [mockMember];
      
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({ data: mockMembers, error: null }),
          }),
        }),
      } as any);

      const result = await adminService.getOrganizationMembers('org-123');
      
      expect(result).toEqual(mockMembers);
      expect(supabase.from).toHaveBeenCalledWith('organization_members');
    });

    it('should add organization member', async () => {
      vi.mocked(supabase.from).mockImplementation((table) => {
        if (table === 'organization_members') {
          return {
            insert: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: mockMember, error: null }),
              }),
            }),
          } as any;
        }
        if (table === 'audit_logs') {
          return {
            insert: vi.fn().mockResolvedValue({ error: null }),
          } as any;
        }
        return {} as any;
      });

      const result = await adminService.addOrganizationMember('org-123', 'user-123', 'member');
      
      expect(result).toEqual(mockMember);
    });

    it('should remove organization member', async () => {
      vi.mocked(supabase.from).mockImplementation((table) => {
        if (table === 'organization_members') {
          return {
            delete: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ error: null }),
            }),
          } as any;
        }
        if (table === 'audit_logs') {
          return {
            insert: vi.fn().mockResolvedValue({ error: null }),
          } as any;
        }
        return {} as any;
      });

      await adminService.removeOrganizationMember('member-123');
      
      expect(supabase.from).toHaveBeenCalledWith('organization_members');
    });
  });

  describe('Subscription Operations', () => {
    it('should get organization subscription', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              limit: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: mockSubscription, error: null }),
              }),
            }),
          }),
        }),
      } as any);

      const result = await adminService.getOrganizationSubscription('org-123');
      
      expect(result).toEqual(mockSubscription);
    });

    it('should return null when no subscription exists', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              limit: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ 
                  data: null, 
                  error: { code: 'PGRST116' } 
                }),
              }),
            }),
          }),
        }),
      } as any);

      const result = await adminService.getOrganizationSubscription('org-123');
      
      expect(result).toBeNull();
    });

    it('should create subscription', async () => {
      vi.mocked(supabase.from).mockImplementation((table) => {
        if (table === 'subscriptions') {
          return {
            insert: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: mockSubscription, error: null }),
              }),
            }),
          } as any;
        }
        if (table === 'audit_logs') {
          return {
            insert: vi.fn().mockResolvedValue({ error: null }),
          } as any;
        }
        return {} as any;
      });

      const result = await adminService.createSubscription(mockSubscription);
      
      expect(result).toEqual(mockSubscription);
    });

    it('should cancel subscription', async () => {
      vi.mocked(supabase.from).mockImplementation((table) => {
        if (table === 'subscriptions') {
          return {
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                select: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({ 
                    data: { ...mockSubscription, status: 'cancelled' }, 
                    error: null 
                  }),
                }),
              }),
            }),
          } as any;
        }
        if (table === 'audit_logs') {
          return {
            insert: vi.fn().mockResolvedValue({ error: null }),
          } as any;
        }
        return {} as any;
      });

      await adminService.cancelSubscription('sub-123');
      
      expect(supabase.from).toHaveBeenCalledWith('subscriptions');
    });
  });

  describe('Analytics Calculations', () => {
    it('should calculate platform stats with MRR', async () => {
      let orgCallCount = 0;
      
      vi.mocked(supabase.from).mockImplementation((table) => {
        if (table === 'organizations') {
          orgCallCount++;
          return {
            select: vi.fn().mockImplementation((query, options) => {
              if (options?.count === 'exact') {
                if (orgCallCount === 1) {
                  // First call: total organizations
                  return Promise.resolve({ count: 10, error: null });
                } else if (orgCallCount === 2) {
                  // Second call: active organizations
                  return {
                    eq: vi.fn().mockResolvedValue({ count: 8, error: null }),
                  };
                } else {
                  // Third call: new signups
                  return {
                    gte: vi.fn().mockResolvedValue({ count: 3, error: null }),
                  };
                }
              }
              return Promise.resolve({ count: 0, error: null });
            }),
          } as any;
        }
        if (table === 'organization_members') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ count: 50, error: null }),
            }),
          } as any;
        }
        if (table === 'subscriptions') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({
                data: [
                  { amount: 15000, interval: 'monthly' },
                  { amount: 35000, interval: 'monthly' },
                  { amount: 900000, interval: 'yearly' },
                ],
                error: null,
              }),
            }),
          } as any;
        }
        return {} as any;
      });

      const result = await adminService.getPlatformStats();
      
      expect(result.total_organizations).toBe(10);
      expect(result.active_organizations).toBe(8);
      expect(result.total_users).toBe(50);
      expect(result.new_signups_this_month).toBe(3);
      expect(result.mrr).toBeGreaterThan(0);
    });

    it('should calculate organization stats', async () => {
      vi.mocked(supabase.from).mockImplementation((table) => {
        if (table === 'organization_members') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockResolvedValue({ count: 5, error: null }),
              }),
            }),
          } as any;
        }
        if (table === 'products') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ count: 100, error: null }),
            }),
          } as any;
        }
        if (table === 'invoices') {
          const selectFn = vi.fn();
          selectFn.mockImplementation((query, options) => {
            if (options?.count === 'exact') {
              return {
                eq: vi.fn().mockResolvedValue({ count: 50, error: null }),
              };
            }
            return {
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockResolvedValue({
                  data: [
                    { total_amount: 10000 },
                    { total_amount: 25000 },
                  ],
                  error: null,
                }),
              }),
            };
          });
          return { select: selectFn } as any;
        }
        return {} as any;
      });

      const result = await adminService.getOrganizationStats('org-123');
      
      expect(result.organization_id).toBe('org-123');
      expect(result.total_users).toBe(5);
      expect(result.total_products).toBe(100);
      expect(result.total_invoices).toBe(50);
      expect(result.total_revenue).toBe(35000);
    });
  });

  describe('Audit Logging', () => {
    it('should log audit action', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        insert: vi.fn().mockResolvedValue({ error: null }),
      } as any);

      await adminService.logAuditAction('test_action', 'organization', 'org-123', { test: 'data' });
      
      expect(supabase.from).toHaveBeenCalledWith('audit_logs');
    });

    it('should get audit logs with filters', async () => {
      const mockLogs = [
        {
          id: 'log-1',
          admin_user_id: 'admin-123',
          action: 'organization_created',
          target_type: 'organization',
          target_id: 'org-123',
          created_at: '2024-01-01T00:00:00Z',
        },
      ];

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                limit: vi.fn().mockResolvedValue({ data: mockLogs, error: null }),
              }),
            }),
          }),
        }),
      } as any);

      const result = await adminService.getAuditLogs({
        organizationId: 'org-123',
        action: 'organization_created',
        limit: 10,
      });
      
      expect(result).toEqual(mockLogs);
    });
  });
});
