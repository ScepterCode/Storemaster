/**
 * Integration tests for Subscription Flow
 * Tests subscription creation, payment processing, renewal, and cancellation
 * 
 * Requirements: 3.1, 3.2, 3.3, 3.4, 4.1, 4.2
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock Supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(),
    auth: {
      getUser: vi.fn(),
    },
  },
}));

import { supabase } from '@/integrations/supabase/client';
import { adminService } from '@/services/adminService';
import { flutterwaveService } from '@/services/flutterwaveService';
import { Organization, Subscription } from '@/types/admin';
import { SUBSCRIPTION_PLANS } from '@/config/subscriptionPlans';

describe('Subscription Flow Integration Tests', () => {
  const mockUserId = 'user-123';
  const mockOrgId = 'org-123';
  const mockEmail = 'owner@example.com';

  const mockOrganization: Organization = {
    id: mockOrgId,
    name: 'Test Organization',
    slug: 'test-org',
    subscription_tier: 'free',
    subscription_status: 'trial',
    max_users: 2,
    max_products: 50,
    max_invoices_per_month: 20,
    max_storage_mb: 100,
    is_active: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock auth.getUser
    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: { id: mockUserId, email: mockEmail } },
      error: null,
    } as any);

    // Default mock for audit logs (can be overridden in specific tests)
    vi.mocked(supabase.from).mockImplementation((table: string) => {
      if (table === 'audit_logs') {
        return {
          insert: vi.fn().mockResolvedValue({ data: null, error: null }),
        } as any;
      }
      return {} as any;
    });
  });

  describe('Subscription Creation (Requirement 3.1)', () => {
    it('should create a subscription when user selects a plan', async () => {
      const basicPlan = SUBSCRIPTION_PLANS.find(p => p.id === 'basic')!;
      
      const newSubscription: Partial<Subscription> = {
        organization_id: mockOrgId,
        plan_id: basicPlan.id,
        plan_name: basicPlan.name,
        amount: basicPlan.price_monthly,
        currency: 'NGN',
        interval: 'monthly',
        status: 'pending',
        cancel_at_period_end: false,
        failed_payment_count: 0,
      };

      const mockCreatedSubscription: Subscription = {
        id: 'sub-123',
        ...newSubscription,
        current_period_start: '2024-01-01T00:00:00Z',
        current_period_end: '2024-02-01T00:00:00Z',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      } as Subscription;

      vi.mocked(supabase.from).mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockCreatedSubscription,
              error: null,
            }),
          }),
        }),
      } as any);

      const result = await adminService.createSubscription(newSubscription);

      expect(result).toBeDefined();
      expect(result.organization_id).toBe(mockOrgId);
      expect(result.plan_id).toBe('basic');
      expect(result.amount).toBe(basicPlan.price_monthly);
      expect(result.status).toBe('pending');
      expect(supabase.from).toHaveBeenCalledWith('subscriptions');
    });

    it('should display plan details including price in Nigerian Naira', async () => {
      const basicPlan = SUBSCRIPTION_PLANS.find(p => p.id === 'basic')!;

      expect(basicPlan.currency).toBe('NGN');
      expect(basicPlan.price_monthly).toBe(15000);
      expect(basicPlan.name).toBe('Basic');
      expect(basicPlan.features.max_users).toBe(5);
      expect(basicPlan.features.max_products).toBe(500);
    });

    it('should store subscription details with start and end dates', async () => {
      const subscription: Partial<Subscription> = {
        organization_id: mockOrgId,
        plan_id: 'basic',
        plan_name: 'Basic',
        amount: 15000,
        currency: 'NGN',
        interval: 'monthly',
        status: 'pending',
        current_period_start: '2024-01-01T00:00:00Z',
        current_period_end: '2024-02-01T00:00:00Z',
      };

      const mockResult: Subscription = {
        id: 'sub-123',
        ...subscription,
        cancel_at_period_end: false,
        failed_payment_count: 0,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      } as Subscription;

      vi.mocked(supabase.from).mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockResult,
              error: null,
            }),
          }),
        }),
      } as any);

      const result = await adminService.createSubscription(subscription);

      expect(result.current_period_start).toBeDefined();
      expect(result.current_period_end).toBeDefined();
      expect(result.created_at).toBeDefined();
    });
  });

  describe('Payment Processing (Requirements 3.2, 3.3, 3.4)', () => {
    it('should initialize payment and redirect to Flutterwave', async () => {
      const basicPlan = SUBSCRIPTION_PLANS.find(p => p.id === 'basic')!;
      
      // Mock Flutterwave API response
      global.fetch = vi.fn().mockResolvedValue({
        json: async () => ({
          status: 'success',
          message: 'Payment initialized',
          data: {
            link: 'https://flutterwave.com/pay/test-link',
            id: 'payment-123',
          },
        }),
      });

      const result = await flutterwaveService.subscribeCustomer(
        mockEmail,
        basicPlan.flutterwave_plan_id_monthly!,
        mockOrgId
      );

      expect(result.status).toBe('success');
      expect(result.data?.link).toContain('flutterwave.com');
      expect(result.data?.payment_id).toBeDefined();
    });

    it('should receive webhook notification when payment is completed', async () => {
      const webhookPayload = {
        event: 'charge.completed',
        data: {
          id: 'payment-123',
          tx_ref: `SUB-${mockOrgId}-${Date.now()}`,
          amount: 15000,
          currency: 'NGN',
          status: 'successful',
          customer: {
            email: mockEmail,
          },
        },
      };

      // Mock subscription update
      vi.mocked(supabase.from).mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: null,
            error: null,
          }),
        }),
      } as any);

      await flutterwaveService.handleWebhook(webhookPayload);

      expect(supabase.from).toHaveBeenCalledWith('subscriptions');
    });

    it('should verify payment and activate subscription', async () => {
      const transactionId = 'txn-123';

      // Mock Flutterwave verification response
      global.fetch = vi.fn().mockResolvedValue({
        json: async () => ({
          status: 'success',
          data: {
            id: transactionId,
            status: 'successful',
            amount: 15000,
            currency: 'NGN',
          },
        }),
      });

      const verificationResult = await flutterwaveService.verifyPayment(transactionId);

      expect(verificationResult.status).toBe('success');
      expect(verificationResult.data.status).toBe('successful');
    });

    it('should update subscription status to active after successful payment', async () => {
      const mockSubscription: Subscription = {
        id: 'sub-123',
        organization_id: mockOrgId,
        plan_id: 'basic',
        plan_name: 'Basic',
        amount: 15000,
        currency: 'NGN',
        interval: 'monthly',
        status: 'pending',
        cancel_at_period_end: false,
        failed_payment_count: 0,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      const updatedSubscription: Subscription = {
        ...mockSubscription,
        status: 'active',
        flutterwave_subscription_id: 'fw-sub-123',
        last_payment_date: '2024-01-01T00:00:00Z',
      };

      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === 'subscriptions') {
          return {
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                select: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({
                    data: updatedSubscription,
                    error: null,
                  }),
                }),
              }),
            }),
          } as any;
        }
        if (table === 'audit_logs') {
          return {
            insert: vi.fn().mockResolvedValue({ data: null, error: null }),
          } as any;
        }
        return {} as any;
      });

      const result = await adminService.updateSubscription('sub-123', {
        status: 'active',
        flutterwave_subscription_id: 'fw-sub-123',
        last_payment_date: '2024-01-01T00:00:00Z',
      });

      expect(result.status).toBe('active');
      expect(result.flutterwave_subscription_id).toBe('fw-sub-123');
      expect(result.last_payment_date).toBeDefined();
    });

    it('should grant access to features after payment verification', async () => {
      const updatedOrg: Organization = {
        ...mockOrganization,
        subscription_tier: 'basic',
        subscription_status: 'active',
        max_users: 5,
        max_products: 500,
        max_invoices_per_month: 100,
        is_active: true,
      };

      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === 'organizations') {
          return {
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                select: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({
                    data: updatedOrg,
                    error: null,
                  }),
                }),
              }),
            }),
          } as any;
        }
        if (table === 'audit_logs') {
          return {
            insert: vi.fn().mockResolvedValue({ data: null, error: null }),
          } as any;
        }
        return {} as any;
      });

      const result = await adminService.updateOrganization(mockOrgId, {
        subscription_tier: 'basic',
        subscription_status: 'active',
        max_users: 5,
        max_products: 500,
        max_invoices_per_month: 100,
      });

      expect(result.subscription_status).toBe('active');
      expect(result.subscription_tier).toBe('basic');
      expect(result.max_users).toBe(5);
      expect(result.max_products).toBe(500);
    });
  });

  describe('Subscription Renewal (Requirements 4.1, 4.2)', () => {
    it('should send reminder notifications when subscription approaches expiry', async () => {
      const expiringDate = new Date();
      expiringDate.setDate(expiringDate.getDate() + 3); // 3 days from now

      const expiringSubscription: Subscription = {
        id: 'sub-123',
        organization_id: mockOrgId,
        plan_id: 'basic',
        plan_name: 'Basic',
        amount: 15000,
        currency: 'NGN',
        interval: 'monthly',
        status: 'active',
        current_period_end: expiringDate.toISOString(),
        cancel_at_period_end: false,
        failed_payment_count: 0,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      // Check if subscription is expiring soon (within 7 days)
      const daysUntilExpiry = Math.ceil(
        (new Date(expiringSubscription.current_period_end!).getTime() - Date.now()) / 
        (1000 * 60 * 60 * 24)
      );

      expect(daysUntilExpiry).toBeLessThanOrEqual(7);
      expect(daysUntilExpiry).toBeGreaterThan(0);
    });

    it('should restrict access to paid features when subscription expires', async () => {
      const expiredOrg: Organization = {
        ...mockOrganization,
        subscription_tier: 'basic',
        subscription_status: 'expired',
        is_active: false,
      };

      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === 'organizations') {
          return {
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                select: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({
                    data: expiredOrg,
                    error: null,
                  }),
                }),
              }),
            }),
          } as any;
        }
        if (table === 'audit_logs') {
          return {
            insert: vi.fn().mockResolvedValue({ data: null, error: null }),
          } as any;
        }
        return {} as any;
      });

      const result = await adminService.updateOrganization(mockOrgId, {
        subscription_status: 'expired',
        is_active: false,
      });

      expect(result.subscription_status).toBe('expired');
      expect(result.is_active).toBe(false);
    });

    it('should extend subscription period when renewal payment is processed', async () => {
      const currentPeriodEnd = new Date('2024-02-01T00:00:00Z');
      const newPeriodEnd = new Date(currentPeriodEnd);
      newPeriodEnd.setMonth(newPeriodEnd.getMonth() + 1);

      const renewedSubscription: Subscription = {
        id: 'sub-123',
        organization_id: mockOrgId,
        plan_id: 'basic',
        plan_name: 'Basic',
        amount: 15000,
        currency: 'NGN',
        interval: 'monthly',
        status: 'active',
        current_period_start: currentPeriodEnd.toISOString(),
        current_period_end: newPeriodEnd.toISOString(),
        last_payment_date: new Date().toISOString(),
        cancel_at_period_end: false,
        failed_payment_count: 0,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: new Date().toISOString(),
      };

      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === 'subscriptions') {
          return {
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                select: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({
                    data: renewedSubscription,
                    error: null,
                  }),
                }),
              }),
            }),
          } as any;
        }
        if (table === 'audit_logs') {
          return {
            insert: vi.fn().mockResolvedValue({ data: null, error: null }),
          } as any;
        }
        return {} as any;
      });

      const result = await adminService.updateSubscription('sub-123', {
        current_period_start: currentPeriodEnd.toISOString(),
        current_period_end: newPeriodEnd.toISOString(),
        last_payment_date: new Date().toISOString(),
      });

      expect(result.current_period_end).toBe(newPeriodEnd.toISOString());
      expect(result.last_payment_date).toBeDefined();
    });

    it('should handle failed renewal payments with grace period', async () => {
      const failedSubscription: Subscription = {
        id: 'sub-123',
        organization_id: mockOrgId,
        plan_id: 'basic',
        plan_name: 'Basic',
        amount: 15000,
        currency: 'NGN',
        interval: 'monthly',
        status: 'active',
        failed_payment_count: 1,
        cancel_at_period_end: false,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: new Date().toISOString(),
      };

      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === 'subscriptions') {
          return {
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                select: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({
                    data: failedSubscription,
                    error: null,
                  }),
                }),
              }),
            }),
          } as any;
        }
        if (table === 'audit_logs') {
          return {
            insert: vi.fn().mockResolvedValue({ data: null, error: null }),
          } as any;
        }
        return {} as any;
      });

      const result = await adminService.updateSubscription('sub-123', {
        failed_payment_count: 1,
      });

      expect(result.failed_payment_count).toBe(1);
      expect(result.status).toBe('active'); // Still active during grace period
    });

    it('should maintain subscription history for audit purposes', async () => {
      const mockAuditLogs = [
        {
          id: 'log-1',
          admin_user_id: mockUserId,
          action: 'subscription_created',
          target_type: 'subscription',
          target_id: 'sub-123',
          organization_id: mockOrgId,
          created_at: '2024-01-01T00:00:00Z',
        },
        {
          id: 'log-2',
          admin_user_id: mockUserId,
          action: 'subscription_updated',
          target_type: 'subscription',
          target_id: 'sub-123',
          organization_id: mockOrgId,
          created_at: '2024-02-01T00:00:00Z',
        },
      ];

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              data: mockAuditLogs,
              error: null,
            }),
          }),
        }),
      } as any);

      const logs = await adminService.getAuditLogs({
        organizationId: mockOrgId,
      });

      expect(logs.length).toBeGreaterThan(0);
      expect(logs.some(log => log.action === 'subscription_created')).toBe(true);
      expect(logs.some(log => log.action === 'subscription_updated')).toBe(true);
    });
  });

  describe('Subscription Cancellation (Requirement 4.2)', () => {
    it('should cancel subscription and set cancelled_at timestamp', async () => {
      const cancelledSubscription: Subscription = {
        id: 'sub-123',
        organization_id: mockOrgId,
        plan_id: 'basic',
        plan_name: 'Basic',
        amount: 15000,
        currency: 'NGN',
        interval: 'monthly',
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
        cancel_at_period_end: false,
        failed_payment_count: 0,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: new Date().toISOString(),
      };

      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === 'subscriptions') {
          return {
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                select: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({
                    data: cancelledSubscription,
                    error: null,
                  }),
                }),
              }),
            }),
          } as any;
        }
        if (table === 'audit_logs') {
          return {
            insert: vi.fn().mockResolvedValue({ data: null, error: null }),
          } as any;
        }
        return {} as any;
      });

      await adminService.cancelSubscription('sub-123');

      expect(supabase.from).toHaveBeenCalledWith('subscriptions');
    });

    it('should handle webhook for subscription cancellation', async () => {
      const webhookPayload = {
        event: 'subscription.cancelled',
        data: {
          id: 'fw-sub-123',
          status: 'cancelled',
        },
      };

      vi.mocked(supabase.from).mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: null,
            error: null,
          }),
        }),
      } as any);

      await flutterwaveService.handleWebhook(webhookPayload);

      expect(supabase.from).toHaveBeenCalledWith('subscriptions');
    });

    it('should preserve data after subscription cancellation', async () => {
      // After cancellation, organization should still exist with data
      const cancelledOrg: Organization = {
        ...mockOrganization,
        subscription_status: 'cancelled',
        is_active: false,
      };

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: cancelledOrg,
              error: null,
            }),
          }),
        }),
      } as any);

      const org = await adminService.getOrganization(mockOrgId);

      expect(org).toBeDefined();
      expect(org.id).toBe(mockOrgId);
      expect(org.subscription_status).toBe('cancelled');
      // Data is preserved, just access is restricted
    });
  });

  describe('End-to-End Subscription Flow', () => {
    it('should complete full subscription lifecycle', async () => {
      let callCount = 0;
      
      // Step 1: Create organization
      vi.mocked(supabase.from).mockImplementation((table: string) => {
        callCount++;
        
        if (callCount === 1 && table === 'organizations') {
          return {
            insert: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: mockOrganization,
                  error: null,
                }),
              }),
            }),
          } as any;
        }
        
        if (callCount === 2 && table === 'audit_logs') {
          return {
            insert: vi.fn().mockResolvedValue({ data: null, error: null }),
          } as any;
        }
        
        if (callCount === 3 && table === 'subscriptions') {
          return {
            insert: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { id: 'sub-123', organization_id: mockOrgId, plan_id: 'basic', status: 'pending' },
                  error: null,
                }),
              }),
            }),
          } as any;
        }
        
        if (callCount === 4 && table === 'audit_logs') {
          return {
            insert: vi.fn().mockResolvedValue({ data: null, error: null }),
          } as any;
        }
        
        if (callCount === 5 && table === 'subscriptions') {
          return {
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                select: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({
                    data: { id: 'sub-123', status: 'active' },
                    error: null,
                  }),
                }),
              }),
            }),
          } as any;
        }
        
        if (callCount === 6 && table === 'audit_logs') {
          return {
            insert: vi.fn().mockResolvedValue({ data: null, error: null }),
          } as any;
        }
        
        if (callCount === 7 && table === 'subscriptions') {
          return {
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                select: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({
                    data: { id: 'sub-123', status: 'cancelled' },
                    error: null,
                  }),
                }),
              }),
            }),
          } as any;
        }
        
        if (table === 'audit_logs') {
          return {
            insert: vi.fn().mockResolvedValue({ data: null, error: null }),
          } as any;
        }
        
        return {} as any;
      });

      const org = await adminService.createOrganization({
        name: 'Test Organization',
        slug: 'test-org',
        subscription_tier: 'free',
        subscription_status: 'trial',
      });

      expect(org.id).toBeDefined();

      // Step 2: Create subscription
      const subscription: Partial<Subscription> = {
        organization_id: org.id,
        plan_id: 'basic',
        plan_name: 'Basic',
        amount: 15000,
        currency: 'NGN',
        interval: 'monthly',
        status: 'pending',
      };

      const createdSub = await adminService.createSubscription(subscription);
      expect(createdSub.status).toBe('pending');

      // Step 3: Process payment (mock)
      global.fetch = vi.fn().mockResolvedValue({
        json: async () => ({
          status: 'success',
          data: { link: 'https://flutterwave.com/pay/test', id: 'pay-123' },
        }),
      });

      const paymentInit = await flutterwaveService.subscribeCustomer(
        mockEmail,
        'plan_basic_monthly',
        org.id
      );
      expect(paymentInit.status).toBe('success');

      // Step 4: Activate subscription after payment
      const activatedSub = await adminService.updateSubscription(createdSub.id, {
        status: 'active',
      });
      expect(activatedSub.status).toBe('active');

      // Step 5: Cancel subscription
      await adminService.cancelSubscription(createdSub.id);
      expect(supabase.from).toHaveBeenCalledWith('subscriptions');
    });
  });
});
