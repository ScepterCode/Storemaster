/**
 * Flutterwave Webhook Handler
 * 
 * Supabase Edge Function to handle Flutterwave webhook events
 * Validates webhook signatures and processes payment events
 * 
 * Requirements: 3.3, 3.4, 10.3, 10.4, 10.5
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const FLUTTERWAVE_SECRET_HASH = Deno.env.get('FLUTTERWAVE_SECRET_HASH') || '';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

interface FlutterwaveWebhookPayload {
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

/**
 * Validate Flutterwave webhook signature
 * Requirement 10.3: Verify webhook signature to prevent fraud
 */
function validateWebhookSignature(signature: string | null, payload: string): boolean {
  if (!signature || !FLUTTERWAVE_SECRET_HASH) {
    console.error('Missing signature or secret hash');
    return false;
  }

  try {
    // Flutterwave uses SHA256 hash of the secret
    // The signature should match the secret hash
    return signature === FLUTTERWAVE_SECRET_HASH;
  } catch (error) {
    console.error('Signature validation error:', error);
    return false;
  }
}

/**
 * Handle successful payment event
 * Requirements: 3.3, 3.4 - Activate subscription when payment is verified
 */
async function handleSuccessfulPayment(
  supabase: any,
  data: FlutterwaveWebhookPayload['data']
): Promise<void> {
  try {
    console.log('Processing successful payment:', data.tx_ref);

    // Extract organization ID from tx_ref
    // Format: SUB-{organizationId}-{timestamp} or UPGRADE-{organizationId}-{timestamp}
    const txRef = data.tx_ref;
    const orgIdMatch = txRef.match(/(?:SUB|UPGRADE)-([^-]+)-/);
    
    if (!orgIdMatch) {
      console.error('Could not extract organization ID from tx_ref:', txRef);
      throw new Error('Invalid transaction reference format');
    }

    const organizationId = orgIdMatch[1];
    const isUpgrade = txRef.startsWith('UPGRADE-');

    console.log(`Processing payment for organization: ${organizationId}, isUpgrade: ${isUpgrade}`);

    // Get the organization's current subscription
    const { data: existingSubscription, error: fetchError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('Error fetching subscription:', fetchError);
      throw fetchError;
    }

    // Calculate subscription period (30 days for monthly)
    const currentPeriodStart = new Date().toISOString();
    const currentPeriodEnd = new Date();
    currentPeriodEnd.setDate(currentPeriodEnd.getDate() + 30);
    const nextPaymentDate = new Date(currentPeriodEnd);
    nextPaymentDate.setDate(nextPaymentDate.getDate() + 1);

    // Update or create subscription
    if (existingSubscription) {
      // Update existing subscription
      const { error: updateError } = await supabase
        .from('subscriptions')
        .update({
          status: 'active',
          flutterwave_subscription_id: data.id.toString(),
          flutterwave_customer_id: data.customer.id.toString(),
          current_period_start: currentPeriodStart,
          current_period_end: currentPeriodEnd.toISOString(),
          last_payment_date: new Date().toISOString(),
          next_payment_date: nextPaymentDate.toISOString(),
          failed_payment_count: 0,
          cancel_at_period_end: false,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingSubscription.id);

      if (updateError) {
        console.error('Error updating subscription:', updateError);
        throw updateError;
      }

      console.log('Subscription updated successfully:', existingSubscription.id);
    } else {
      console.warn('No existing subscription found for organization:', organizationId);
    }

    // Update organization status
    // Requirement 3.4: Grant access to features when payment is verified
    const { error: orgError } = await supabase
      .from('organizations')
      .update({
        subscription_status: 'active',
        subscription_starts_at: currentPeriodStart,
        subscription_ends_at: currentPeriodEnd.toISOString(),
        is_active: true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', organizationId);

    if (orgError) {
      console.error('Error updating organization:', orgError);
      throw orgError;
    }

    console.log('Organization updated successfully:', organizationId);

    // Log the payment event
    // Requirement 10.5: Log all payment transactions
    const { error: logError } = await supabase
      .from('audit_logs')
      .insert({
        action: isUpgrade ? 'subscription.upgraded' : 'subscription.payment_received',
        target_type: 'subscription',
        target_id: existingSubscription?.id,
        organization_id: organizationId,
        details: {
          tx_ref: data.tx_ref,
          flw_ref: data.flw_ref,
          amount: data.amount,
          currency: data.currency,
          charged_amount: data.charged_amount,
          payment_type: data.payment_type,
          customer_email: data.customer.email,
        },
        created_at: new Date().toISOString(),
      });

    if (logError) {
      console.error('Error logging audit event:', logError);
      // Don't throw - logging failure shouldn't fail the payment processing
    }

    console.log('Payment processed successfully');
  } catch (error) {
    console.error('Error handling successful payment:', error);
    throw error;
  }
}

/**
 * Handle subscription cancelled event
 * Requirement 4.2: Handle subscription cancellation
 */
async function handleSubscriptionCancelled(
  supabase: any,
  data: FlutterwaveWebhookPayload['data']
): Promise<void> {
  try {
    console.log('Processing subscription cancellation:', data.id);

    const { error: updateError } = await supabase
      .from('subscriptions')
      .update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
        cancel_at_period_end: true,
        updated_at: new Date().toISOString(),
      })
      .eq('flutterwave_subscription_id', data.id.toString());

    if (updateError) {
      console.error('Error updating cancelled subscription:', updateError);
      throw updateError;
    }

    // Get organization ID for audit log
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('organization_id, id')
      .eq('flutterwave_subscription_id', data.id.toString())
      .single();

    if (subscription) {
      // Log the cancellation
      await supabase
        .from('audit_logs')
        .insert({
          action: 'subscription.cancelled',
          target_type: 'subscription',
          target_id: subscription.id,
          organization_id: subscription.organization_id,
          details: {
            flutterwave_subscription_id: data.id,
            cancelled_at: new Date().toISOString(),
          },
          created_at: new Date().toISOString(),
        });
    }

    console.log('Subscription cancellation processed successfully');
  } catch (error) {
    console.error('Error handling subscription cancellation:', error);
    throw error;
  }
}

/**
 * Handle subscription expired event
 * Requirement 4.2: Restrict access when subscription expires
 */
async function handleSubscriptionExpired(
  supabase: any,
  data: FlutterwaveWebhookPayload['data']
): Promise<void> {
  try {
    console.log('Processing subscription expiration:', data.id);

    // Update subscription status
    const { error: updateError } = await supabase
      .from('subscriptions')
      .update({
        status: 'expired',
        updated_at: new Date().toISOString(),
      })
      .eq('flutterwave_subscription_id', data.id.toString());

    if (updateError) {
      console.error('Error updating expired subscription:', updateError);
      throw updateError;
    }

    // Get organization ID and update organization status
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('organization_id, id')
      .eq('flutterwave_subscription_id', data.id.toString())
      .single();

    if (subscription) {
      // Update organization to expired status
      // Requirement 4.2: Restrict access to paid features while preserving data
      await supabase
        .from('organizations')
        .update({
          subscription_status: 'expired',
          is_active: false,
          updated_at: new Date().toISOString(),
        })
        .eq('id', subscription.organization_id);

      // Log the expiration
      await supabase
        .from('audit_logs')
        .insert({
          action: 'subscription.expired',
          target_type: 'subscription',
          target_id: subscription.id,
          organization_id: subscription.organization_id,
          details: {
            flutterwave_subscription_id: data.id,
            expired_at: new Date().toISOString(),
          },
          created_at: new Date().toISOString(),
        });
    }

    console.log('Subscription expiration processed successfully');
  } catch (error) {
    console.error('Error handling subscription expiration:', error);
    throw error;
  }
}

/**
 * Handle failed payment event
 * Requirement 4.4: Handle failed renewal payments
 */
async function handleFailedPayment(
  supabase: any,
  data: FlutterwaveWebhookPayload['data']
): Promise<void> {
  try {
    console.log('Processing failed payment:', data.tx_ref);

    // Extract organization ID from tx_ref
    const txRef = data.tx_ref;
    const orgIdMatch = txRef.match(/(?:SUB|UPGRADE)-([^-]+)-/);
    
    if (!orgIdMatch) {
      console.error('Could not extract organization ID from tx_ref:', txRef);
      return;
    }

    const organizationId = orgIdMatch[1];

    // Increment failed payment count
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (subscription) {
      const newFailedCount = (subscription.failed_payment_count || 0) + 1;
      
      await supabase
        .from('subscriptions')
        .update({
          failed_payment_count: newFailedCount,
          status: newFailedCount >= 3 ? 'failed' : subscription.status,
          updated_at: new Date().toISOString(),
        })
        .eq('id', subscription.id);

      // Log the failed payment
      await supabase
        .from('audit_logs')
        .insert({
          action: 'subscription.payment_failed',
          target_type: 'subscription',
          target_id: subscription.id,
          organization_id: organizationId,
          details: {
            tx_ref: data.tx_ref,
            failed_count: newFailedCount,
            amount: data.amount,
            currency: data.currency,
          },
          created_at: new Date().toISOString(),
        });
    }

    console.log('Failed payment processed successfully');
  } catch (error) {
    console.error('Error handling failed payment:', error);
    throw error;
  }
}

/**
 * Main webhook handler
 */
serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, verif-hash',
      },
    });
  }

  // Only accept POST requests
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      {
        status: 405,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  try {
    // Get webhook signature from header
    const signature = req.headers.get('verif-hash');
    
    // Read request body
    const body = await req.text();
    
    // Validate webhook signature
    // Requirement 10.3: Verify webhook signature to prevent fraud
    if (!validateWebhookSignature(signature, body)) {
      console.error('Invalid webhook signature');
      return new Response(
        JSON.stringify({ error: 'Invalid signature' }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Parse webhook payload
    const payload: FlutterwaveWebhookPayload = JSON.parse(body);
    console.log('Received webhook event:', payload.event);

    // Initialize Supabase client with service role key
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Handle different webhook events
    switch (payload.event) {
      case 'charge.completed':
        // Check if payment was successful
        if (payload.data.status === 'successful') {
          await handleSuccessfulPayment(supabase, payload.data);
        } else if (payload.data.status === 'failed') {
          await handleFailedPayment(supabase, payload.data);
        }
        break;

      case 'subscription.cancelled':
        await handleSubscriptionCancelled(supabase, payload.data);
        break;

      case 'subscription.expired':
        await handleSubscriptionExpired(supabase, payload.data);
        break;

      case 'charge.failed':
        await handleFailedPayment(supabase, payload.data);
        break;

      default:
        console.log('Unhandled webhook event:', payload.event);
    }

    // Return success response
    return new Response(
      JSON.stringify({ status: 'success', message: 'Webhook processed' }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Webhook processing error:', error);
    
    // Return error response
    return new Response(
      JSON.stringify({
        error: 'Webhook processing failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
});
