/**
 * Unit tests for Flutterwave Service
 * Tests payment initialization, payment verification, and webhook handling
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { flutterwaveService } from '../flutterwaveService';
import { FlutterwavePaymentData, FlutterwaveWebhookPayload } from '@/types/admin';

// Mock Supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

import { supabase } from '@/integrations/supabase/client';

// Mock fetch
global.fetch = vi.fn();

describe('Flutterwave Service', () => {
  const mockPaymentData: FlutterwavePaymentData = {
    tx_ref: 'TEST-123-456',
    amount: 15000,
    currency: 'NGN',
    redirect_url: 'http://localhost/callback',
    customer: {
      email: 'test@example.com',
      name: 'Test User',
    },
    customizations: {
      title: 'Test Payment',
      description: 'Test payment description',
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Payment Initialization', () => {
    it('should initialize payment successfully', async () => {
      const mockResponse = {
        status: 'success',
        message: 'Payment initialized',
        data: {
          link: 'https://flutterwave.com/pay/test-link',
          id: 'payment-123',
        },
      };

      vi.mocked(fetch).mockResolvedValueOnce({
        json: async () => mockResponse,
      } as Response);

      const result = await flutterwaveService.initializePayment(mockPaymentData);

      expect(result.status).toBe('success');
      expect(result.data?.link).toBe('https://flutterwave.com/pay/test-link');
      expect(result.data?.payment_id).toBe('payment-123');
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/payments'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        })
      );
    });

    it('should handle payment initialization failure', async () => {
      const mockResponse = {
        status: 'error',
        message: 'Payment initialization failed',
      };

      vi.mocked(fetch).mockResolvedValueOnce({
        json: async () => mockResponse,
      } as Response);

      const result = await flutterwaveService.initializePayment(mockPaymentData);

      expect(result.status).toBe('error');
      expect(result.message).toContain('failed');
    });

    it('should handle network errors during initialization', async () => {
      vi.mocked(fetch).mockRejectedValueOnce(new Error('Network error'));

      const result = await flutterwaveService.initializePayment(mockPaymentData);

      expect(result.status).toBe('error');
      expect(result.message).toContain('Network error');
    });
  });

  describe('Payment Verification', () => {
    it('should verify successful payment', async () => {
      const mockResponse = {
        status: 'success',
        data: {
          status: 'successful',
          amount: 15000,
          currency: 'NGN',
          tx_ref: 'TEST-123-456',
        },
      };

      vi.mocked(fetch).mockResolvedValueOnce({
        json: async () => mockResponse,
      } as Response);

      const result = await flutterwaveService.verifyPayment('txn-123');

      expect(result.status).toBe('success');
      expect(result.data).toBeDefined();
      expect(result.data.status).toBe('successful');
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/transactions/txn-123/verify'),
        expect.objectContaining({
          method: 'GET',
        })
      );
    });

    it('should handle failed payment verification', async () => {
      const mockResponse = {
        status: 'success',
        data: {
          status: 'failed',
        },
      };

      vi.mocked(fetch).mockResolvedValueOnce({
        json: async () => mockResponse,
      } as Response);

      const result = await flutterwaveService.verifyPayment('txn-123');

      expect(result.status).toBe('error');
      expect(result.message).toContain('verification failed');
    });

    it('should handle network errors during verification', async () => {
      vi.mocked(fetch).mockRejectedValueOnce(new Error('Connection timeout'));

      const result = await flutterwaveService.verifyPayment('txn-123');

      expect(result.status).toBe('error');
      expect(result.message).toContain('Connection timeout');
    });
  });

  describe('Subscription Operations', () => {
    it('should subscribe customer to plan', async () => {
      const mockResponse = {
        status: 'success',
        data: {
          link: 'https://flutterwave.com/pay/subscription-link',
          id: 'sub-payment-123',
        },
      };

      vi.mocked(fetch).mockResolvedValueOnce({
        json: async () => mockResponse,
      } as Response);

      const result = await flutterwaveService.subscribeCustomer(
        'test@example.com',
        'plan-123',
        'org-123'
      );

      expect(result.status).toBe('success');
      expect(result.data?.link).toBeDefined();
    });

    it('should handle subscription errors', async () => {
      vi.mocked(fetch).mockRejectedValueOnce(new Error('Subscription failed'));

      const result = await flutterwaveService.subscribeCustomer(
        'test@example.com',
        'plan-123',
        'org-123'
      );

      expect(result.status).toBe('error');
      expect(result.message).toContain('Subscription failed');
    });

    it('should generate upgrade payment link', async () => {
      const mockResponse = {
        status: 'success',
        data: {
          link: 'https://flutterwave.com/pay/upgrade-link',
          id: 'upgrade-payment-123',
        },
      };

      vi.mocked(fetch).mockResolvedValueOnce({
        json: async () => mockResponse,
      } as Response);

      const result = await flutterwaveService.getUpgradePaymentLink(
        'org-123',
        'pro-plan',
        35000,
        'test@example.com',
        'Professional Plan'
      );

      expect(result).toBe('https://flutterwave.com/pay/upgrade-link');
    });

    it('should return null when upgrade payment link fails', async () => {
      vi.mocked(fetch).mockRejectedValueOnce(new Error('Failed'));

      const result = await flutterwaveService.getUpgradePaymentLink(
        'org-123',
        'pro-plan',
        35000,
        'test@example.com',
        'Professional Plan'
      );

      expect(result).toBeNull();
    });
  });

  describe('Webhook Handling', () => {
    it('should handle successful payment webhook', async () => {
      const webhookPayload: FlutterwaveWebhookPayload = {
        event: 'charge.completed',
        data: {
          id: 12345,
          tx_ref: 'SUB-org-123-1234567890',
          status: 'successful',
          amount: 15000,
          currency: 'NGN',
        },
      };

      vi.mocked(supabase.from).mockImplementation((table) => {
        if (table === 'subscriptions') {
          return {
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ error: null }),
            }),
          } as any;
        }
        if (table === 'organizations') {
          return {
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ error: null }),
            }),
          } as any;
        }
        return {} as any;
      });

      await flutterwaveService.handleWebhook(webhookPayload);

      expect(supabase.from).toHaveBeenCalledWith('subscriptions');
      expect(supabase.from).toHaveBeenCalledWith('organizations');
    });

    it('should handle subscription cancelled webhook', async () => {
      const webhookPayload: FlutterwaveWebhookPayload = {
        event: 'subscription.cancelled',
        data: {
          id: 12345,
          status: 'cancelled',
        },
      };

      vi.mocked(supabase.from).mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: null }),
        }),
      } as any);

      await flutterwaveService.handleWebhook(webhookPayload);

      expect(supabase.from).toHaveBeenCalledWith('subscriptions');
    });

    it('should handle subscription expired webhook', async () => {
      const webhookPayload: FlutterwaveWebhookPayload = {
        event: 'subscription.expired',
        data: {
          id: 12345,
          status: 'expired',
        },
      };

      vi.mocked(supabase.from).mockImplementation((table) => {
        if (table === 'subscriptions') {
          if (vi.mocked(supabase.from).mock.calls.length === 1) {
            return {
              update: vi.fn().mockReturnValue({
                eq: vi.fn().mockResolvedValue({ error: null }),
              }),
            } as any;
          } else {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({
                    data: { organization_id: 'org-123' },
                    error: null,
                  }),
                }),
              }),
            } as any;
          }
        }
        if (table === 'organizations') {
          return {
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ error: null }),
            }),
          } as any;
        }
        return {} as any;
      });

      await flutterwaveService.handleWebhook(webhookPayload);

      expect(supabase.from).toHaveBeenCalledWith('subscriptions');
    });

    it('should handle unknown webhook events gracefully', async () => {
      const webhookPayload: FlutterwaveWebhookPayload = {
        event: 'unknown.event' as any,
        data: {},
      };

      // Should not throw
      await expect(flutterwaveService.handleWebhook(webhookPayload)).resolves.not.toThrow();
    });

    it('should handle webhook errors', async () => {
      const webhookPayload: FlutterwaveWebhookPayload = {
        event: 'charge.completed',
        data: {
          id: 12345,
          tx_ref: 'INVALID-REF',
          status: 'successful',
        },
      };

      // Should not throw even with invalid tx_ref
      await expect(flutterwaveService.handleWebhook(webhookPayload)).resolves.not.toThrow();
    });
  });

  describe('Successful Payment Handler', () => {
    it('should update subscription and organization on successful payment', async () => {
      const paymentData = {
        id: 12345,
        tx_ref: 'SUB-org-123-1234567890',
        amount: 15000,
        status: 'successful',
      };

      vi.mocked(supabase.from).mockImplementation((table) => {
        if (table === 'subscriptions') {
          return {
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ error: null }),
            }),
          } as any;
        }
        if (table === 'organizations') {
          return {
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ error: null }),
            }),
          } as any;
        }
        return {} as any;
      });

      await flutterwaveService.handleSuccessfulPayment(paymentData);

      expect(supabase.from).toHaveBeenCalledWith('subscriptions');
      expect(supabase.from).toHaveBeenCalledWith('organizations');
    });

    it('should handle invalid tx_ref format', async () => {
      const paymentData = {
        id: 12345,
        tx_ref: 'INVALID-FORMAT',
        amount: 15000,
        status: 'successful',
      };

      // Should not throw
      await expect(flutterwaveService.handleSuccessfulPayment(paymentData)).resolves.not.toThrow();
    });
  });

  describe('Subscription Cancellation Handler', () => {
    it('should update subscription status to cancelled', async () => {
      const cancellationData = {
        id: 12345,
        status: 'cancelled',
      };

      vi.mocked(supabase.from).mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: null }),
        }),
      } as any);

      await flutterwaveService.handleSubscriptionCancelled(cancellationData);

      expect(supabase.from).toHaveBeenCalledWith('subscriptions');
    });
  });

  describe('Subscription Expiration Handler', () => {
    it('should update subscription and organization on expiration', async () => {
      const expirationData = {
        id: 12345,
        status: 'expired',
      };

      let callCount = 0;
      vi.mocked(supabase.from).mockImplementation((table) => {
        if (table === 'subscriptions') {
          callCount++;
          if (callCount === 1) {
            return {
              update: vi.fn().mockReturnValue({
                eq: vi.fn().mockResolvedValue({ error: null }),
              }),
            } as any;
          } else {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({
                    data: { organization_id: 'org-123' },
                    error: null,
                  }),
                }),
              }),
            } as any;
          }
        }
        if (table === 'organizations') {
          return {
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ error: null }),
            }),
          } as any;
        }
        return {} as any;
      });

      await flutterwaveService.handleSubscriptionExpired(expirationData);

      expect(supabase.from).toHaveBeenCalledWith('subscriptions');
      expect(supabase.from).toHaveBeenCalledWith('organizations');
    });
  });
});
