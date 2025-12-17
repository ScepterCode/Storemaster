/**
 * Flutterwave Service
 * 
 * Service for handling Flutterwave payment integration
 * Supports one-time payments and subscription billing
 */

import { FlutterwavePaymentData, FlutterwaveWebhookPayload } from '@/types/admin';
import { supabase } from '@/integrations/supabase/client';

const FLUTTERWAVE_PUBLIC_KEY = import.meta.env.VITE_FLUTTERWAVE_PUBLIC_KEY;
const FLUTTERWAVE_BASE_URL = 'https://api.flutterwave.com/v3';

export interface PaymentInitResponse {
  status: 'success' | 'error';
  message: string;
  data?: {
    link: string;
    payment_id: string;
  };
}

export interface SubscriptionPlanData {
  name: string;
  amount: number;
  interval: 'daily' | 'weekly' | 'monthly' | 'yearly';
  duration: number;
  currency?: string;
}

export const flutterwaveService = {
  /**
   * Initialize a one-time payment
   */
  async initializePayment(paymentData: FlutterwavePaymentData): Promise<PaymentInitResponse> {
    try {
      const response = await fetch(`${FLUTTERWAVE_BASE_URL}/payments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${FLUTTERWAVE_PUBLIC_KEY}`,
        },
        body: JSON.stringify({
          ...paymentData,
          public_key: FLUTTERWAVE_PUBLIC_KEY,
        }),
      });

      const data = await response.json();

      if (data.status === 'success') {
        return {
          status: 'success',
          message: 'Payment initialized successfully',
          data: {
            link: data.data.link,
            payment_id: data.data.id,
          },
        };
      }

      return {
        status: 'error',
        message: data.message || 'Failed to initialize payment',
      };
    } catch (error) {
      console.error('Flutterwave payment initialization error:', error);
      return {
        status: 'error',
        message: error instanceof Error ? error.message : 'Payment initialization failed',
      };
    }
  },

  /**
   * Verify a payment transaction
   */
  async verifyPayment(transactionId: string): Promise<{
    status: 'success' | 'error';
    data?: any;
    message?: string;
  }> {
    try {
      const response = await fetch(
        `${FLUTTERWAVE_BASE_URL}/transactions/${transactionId}/verify`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${FLUTTERWAVE_PUBLIC_KEY}`,
          },
        }
      );

      const data = await response.json();

      if (data.status === 'success' && data.data.status === 'successful') {
        return {
          status: 'success',
          data: data.data,
        };
      }

      return {
        status: 'error',
        message: 'Payment verification failed',
      };
    } catch (error) {
      console.error('Flutterwave payment verification error:', error);
      return {
        status: 'error',
        message: error instanceof Error ? error.message : 'Verification failed',
      };
    }
  },

  /**
   * Create a subscription plan on Flutterwave
   * Note: This should be called from a secure backend
   */
  /**
   * Create a subscription plan (admin only)
   * 
   * SECURITY WARNING: This operation should ONLY be performed on the backend
   * via a Supabase Edge Function or secure API endpoint with admin authentication.
   * 
   * Creating plans on the frontend exposes your Flutterwave secret key and
   * allows unauthorized users to create arbitrary payment plans.
   * 
   * @throws Error - This operation is intentionally disabled on the frontend
   */
  async createSubscriptionPlan(planData: SubscriptionPlanData): Promise<{
    status: 'success' | 'error';
    plan_id?: string;
    message?: string;
  }> {
    throw new Error(
      'SECURITY: createSubscriptionPlan must be called from a secure backend endpoint. ' +
      'Implement this in a Supabase Edge Function with proper admin authentication and ' +
      'use your Flutterwave secret key server-side only.'
    );
  },

  /**
   * Subscribe a customer to a payment plan
   */
  async subscribeCustomer(
    email: string,
    planId: string,
    organizationId: string
  ): Promise<PaymentInitResponse> {
    try {
      // Generate unique transaction reference
      const txRef = `SUB-${organizationId}-${Date.now()}`;

      const paymentData: FlutterwavePaymentData = {
        tx_ref: txRef,
        amount: 0, // Amount is determined by the plan
        currency: 'NGN',
        redirect_url: `${window.location.origin}/subscription/callback`,
        customer: {
          email,
          name: email.split('@')[0],
        },
        customizations: {
          title: 'Subscription Payment',
          description: 'Subscribe to our service',
        },
        payment_plan: planId,
      };

      return await this.initializePayment(paymentData);
    } catch (error) {
      console.error('Flutterwave subscription error:', error);
      return {
        status: 'error',
        message: error instanceof Error ? error.message : 'Subscription failed',
      };
    }
  },

  /**
   * Cancel a subscription
   * 
   * SECURITY NOTE: While this updates the local database status,
   * actual subscription cancellation with Flutterwave should be handled
   * by a backend service to ensure proper validation and audit logging.
   * 
   * This frontend method only marks the subscription as cancelled locally.
   * The webhook handler will process the actual cancellation from Flutterwave.
   */
  async cancelSubscription(subscriptionId: string): Promise<{
    status: 'success' | 'error';
    message: string;
  }> {
    try {
      // Update local subscription status only
      // Actual Flutterwave cancellation should be triggered by backend
      const { error } = await supabase
        .from('subscriptions')
        .update({
          status: 'cancelled',
          cancelled_at: new Date().toISOString(),
        })
        .eq('id', subscriptionId);

      if (error) {
        throw error;
      }
      
      return {
        status: 'success',
        message: 'Subscription marked as cancelled. Changes will be processed by the system.',
      };
    } catch (error) {
      return {
        status: 'error',
        message: error instanceof Error ? error.message : 'Failed to cancel subscription',
      };
    }
  },

  /**
   * Handle Flutterwave webhook
   * This should be implemented as a Supabase Edge Function or backend endpoint
   */
  async handleWebhook(payload: FlutterwaveWebhookPayload): Promise<void> {
    try {
      const { event, data } = payload;

      switch (event) {
        case 'charge.completed':
          await this.handleSuccessfulPayment(data);
          break;

        case 'subscription.cancelled':
          await this.handleSubscriptionCancelled(data);
          break;

        case 'subscription.expired':
          await this.handleSubscriptionExpired(data);
          break;

        default:
          console.log('Unhandled webhook event:', event);
      }
    } catch (error) {
      console.error('Webhook handling error:', error);
      throw error;
    }
  },

  /**
   * Handle successful payment
   */
  async handleSuccessfulPayment(data: any): Promise<void> {
    try {
      // Extract organization ID from tx_ref
      const txRef = data.tx_ref;
      const orgIdMatch = txRef.match(/SUB-([^-]+)-/);
      
      if (!orgIdMatch) {
        console.error('Could not extract organization ID from tx_ref:', txRef);
        return;
      }

      const organizationId = orgIdMatch[1];

      // Update subscription status
      const { error } = await supabase
        .from('subscriptions')
        .update({
          status: 'active',
          flutterwave_subscription_id: data.id.toString(),
          last_payment_date: new Date().toISOString(),
          failed_payment_count: 0,
        })
        .eq('organization_id', organizationId);

      if (error) {
        console.error('Error updating subscription:', error);
      }

      // Update organization status
      await supabase
        .from('organizations')
        .update({
          subscription_status: 'active',
          is_active: true,
        })
        .eq('id', organizationId);

    } catch (error) {
      console.error('Error handling successful payment:', error);
      throw error;
    }
  },

  /**
   * Handle subscription cancelled
   */
  async handleSubscriptionCancelled(data: any): Promise<void> {
    try {
      const { error } = await supabase
        .from('subscriptions')
        .update({
          status: 'cancelled',
          cancelled_at: new Date().toISOString(),
        })
        .eq('flutterwave_subscription_id', data.id.toString());

      if (error) {
        console.error('Error updating cancelled subscription:', error);
      }
    } catch (error) {
      console.error('Error handling subscription cancellation:', error);
      throw error;
    }
  },

  /**
   * Handle subscription expired
   */
  async handleSubscriptionExpired(data: any): Promise<void> {
    try {
      const { error } = await supabase
        .from('subscriptions')
        .update({
          status: 'expired',
        })
        .eq('flutterwave_subscription_id', data.id.toString());

      if (error) {
        console.error('Error updating expired subscription:', error);
      }

      // Update organization status
      const { data: subscription } = await supabase
        .from('subscriptions')
        .select('organization_id')
        .eq('flutterwave_subscription_id', data.id.toString())
        .single();

      if (subscription) {
        await supabase
          .from('organizations')
          .update({
            subscription_status: 'expired',
            is_active: false,
          })
          .eq('id', subscription.organization_id);
      }
    } catch (error) {
      console.error('Error handling subscription expiration:', error);
      throw error;
    }
  },

  /**
   * Get payment link for subscription upgrade
   */
  async getUpgradePaymentLink(
    organizationId: string,
    planId: string,
    amount: number,
    email: string,
    planName: string
  ): Promise<string | null> {
    const txRef = `UPGRADE-${organizationId}-${Date.now()}`;

    const paymentData: FlutterwavePaymentData = {
      tx_ref: txRef,
      amount,
      currency: 'NGN',
      redirect_url: `${window.location.origin}/subscription/callback?upgrade=true`,
      customer: {
        email,
        name: email.split('@')[0],
      },
      customizations: {
        title: `Upgrade to ${planName}`,
        description: `Subscription upgrade to ${planName} plan`,
      },
      payment_plan: planId,
    };

    const result = await this.initializePayment(paymentData);

    if (result.status === 'success' && result.data) {
      return result.data.link;
    }

    return null;
  },

  /**
   * Validate webhook signature
   * 
   * CRITICAL SECURITY WARNING: This function is intentionally disabled on the frontend.
   * 
   * Webhook signature validation MUST ONLY be performed on the backend because:
   * 1. The webhook secret must NEVER be exposed to the client (security breach)
   * 2. Client-side validation can be easily bypassed by attackers
   * 3. Webhooks should only be processed by trusted backend services
   * 4. Exposing the secret allows anyone to forge webhook requests
   * 
   * Secure implementation is in: supabase/functions/flutterwave-webhook/index.ts
   * 
   * @throws Error - This operation is not allowed on the frontend
   */
  validateWebhookSignature(signature: string, payload: string, secret: string): boolean {
    throw new Error(
      'SECURITY: Webhook signature validation must ONLY be performed on the backend. ' +
      'Never expose your webhook secret to the frontend. ' +
      'See supabase/functions/flutterwave-webhook/index.ts for the secure implementation.'
    );
  },
};

/**
 * Flutterwave Inline Payment (using their JavaScript SDK)
 * This is for direct payment without redirect
 */
export const initializeFlutterwaveInline = (
  paymentData: FlutterwavePaymentData,
  onSuccess: (response: any) => void,
  onClose: () => void
) => {
  if (typeof window === 'undefined' || !(window as any).FlutterwaveCheckout) {
    console.error('Flutterwave SDK not loaded');
    return;
  }

  (window as any).FlutterwaveCheckout({
    public_key: FLUTTERWAVE_PUBLIC_KEY,
    tx_ref: paymentData.tx_ref,
    amount: paymentData.amount,
    currency: paymentData.currency,
    payment_options: 'card,banktransfer,ussd',
    customer: paymentData.customer,
    customizations: paymentData.customizations,
    callback: onSuccess,
    onclose: onClose,
  });
};
