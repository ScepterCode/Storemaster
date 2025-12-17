/**
 * Payment Callback Page
 * 
 * Handle Flutterwave payment redirect and verify payment status
 * Requirements: 3.2, 3.3, 3.4
 */

import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useOrganization } from '@/contexts/OrganizationContext';
import { flutterwaveService } from '@/services/flutterwaveService';
import { adminService } from '@/services/adminService';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, XCircle, Loader2, AlertCircle } from 'lucide-react';

type PaymentStatus = 'verifying' | 'success' | 'failed' | 'cancelled';

const PaymentCallbackPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { refreshOrganization } = useOrganization();
  const [status, setStatus] = useState<PaymentStatus>('verifying');
  const [message, setMessage] = useState('Verifying your payment...');
  const [transactionDetails, setTransactionDetails] = useState<any>(null);

  useEffect(() => {
    verifyPayment();
  }, []);

  const verifyPayment = async () => {
    try {
      // Get transaction details from URL params
      const transactionId = searchParams.get('transaction_id');
      const txRef = searchParams.get('tx_ref');
      const statusParam = searchParams.get('status');

      // Check if payment was cancelled
      if (statusParam === 'cancelled') {
        setStatus('cancelled');
        setMessage('Payment was cancelled. No charges were made.');
        return;
      }

      if (!transactionId) {
        setStatus('failed');
        setMessage('Invalid payment callback. Transaction ID not found.');
        return;
      }

      // Verify payment with Flutterwave
      const verificationResult = await flutterwaveService.verifyPayment(transactionId);

      if (verificationResult.status === 'success' && verificationResult.data) {
        setTransactionDetails(verificationResult.data);

        // Extract organization ID from tx_ref
        const orgIdMatch = txRef?.match(/(?:SUB|UPGRADE)-([^-]+)-/);
        
        if (!orgIdMatch) {
          setStatus('failed');
          setMessage('Could not identify organization from transaction reference.');
          return;
        }

        const organizationId = orgIdMatch[1];

        // Update subscription status in database
        try {
          // Get or create subscription
          let subscription = await adminService.getOrganizationSubscription(organizationId);

          if (subscription) {
            // Update existing subscription
            await adminService.updateSubscription(subscription.id, {
              status: 'active',
              flutterwave_subscription_id: verificationResult.data.id?.toString(),
              last_payment_date: new Date().toISOString(),
              failed_payment_count: 0,
              current_period_start: new Date().toISOString(),
              current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
            });
          } else {
            // Create new subscription
            await adminService.createSubscription({
              organization_id: organizationId,
              plan_id: 'basic', // Default, should be extracted from payment data
              plan_name: 'Basic',
              amount: verificationResult.data.amount,
              currency: verificationResult.data.currency,
              interval: 'monthly',
              status: 'active',
              flutterwave_subscription_id: verificationResult.data.id?.toString(),
              last_payment_date: new Date().toISOString(),
              failed_payment_count: 0,
              cancel_at_period_end: false,
              current_period_start: new Date().toISOString(),
              current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            });
          }

          // Update organization status
          await adminService.updateOrganization(organizationId, {
            subscription_status: 'active',
            is_active: true,
            subscription_starts_at: new Date().toISOString(),
            subscription_ends_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          });

          // Refresh organization context
          await refreshOrganization();

          setStatus('success');
          setMessage('Payment successful! Your subscription has been activated.');
        } catch (dbError) {
          console.error('Error updating subscription in database:', dbError);
          setStatus('failed');
          setMessage('Payment was successful, but there was an error updating your subscription. Please contact support.');
        }
      } else {
        setStatus('failed');
        setMessage('Payment verification failed. Please contact support if you were charged.');
      }
    } catch (error) {
      console.error('Error verifying payment:', error);
      setStatus('failed');
      setMessage('An error occurred while verifying your payment. Please contact support.');
    }
  };

  const getIcon = () => {
    switch (status) {
      case 'verifying':
        return <Loader2 className="h-16 w-16 animate-spin text-primary" />;
      case 'success':
        return <CheckCircle2 className="h-16 w-16 text-green-600" />;
      case 'failed':
        return <XCircle className="h-16 w-16 text-destructive" />;
      case 'cancelled':
        return <AlertCircle className="h-16 w-16 text-yellow-600" />;
      default:
        return null;
    }
  };

  const getTitle = () => {
    switch (status) {
      case 'verifying':
        return 'Verifying Payment';
      case 'success':
        return 'Payment Successful';
      case 'failed':
        return 'Payment Failed';
      case 'cancelled':
        return 'Payment Cancelled';
      default:
        return 'Processing';
    }
  };

  const handleContinue = () => {
    if (status === 'success') {
      navigate('/subscription');
    } else if (status === 'cancelled') {
      navigate('/subscription/plans');
    } else {
      navigate('/subscription');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex justify-center mb-4">
            {getIcon()}
          </div>
          <CardTitle className="text-center text-2xl">
            {getTitle()}
          </CardTitle>
          <CardDescription className="text-center">
            {message}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {transactionDetails && status === 'success' && (
            <div className="space-y-3 mb-6 p-4 bg-secondary/50 rounded-lg">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Transaction ID:</span>
                <span className="font-medium">{transactionDetails.id}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Amount:</span>
                <span className="font-medium">
                  {new Intl.NumberFormat('en-NG', {
                    style: 'currency',
                    currency: transactionDetails.currency || 'NGN',
                  }).format(transactionDetails.amount)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Payment Method:</span>
                <span className="font-medium capitalize">
                  {transactionDetails.payment_type || 'Card'}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Date:</span>
                <span className="font-medium">
                  {new Date().toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </span>
              </div>
            </div>
          )}

          <div className="space-y-3">
            {status !== 'verifying' && (
              <Button 
                onClick={handleContinue} 
                className="w-full"
                variant={status === 'success' ? 'default' : 'outline'}
              >
                {status === 'success' ? 'View Subscription' : status === 'cancelled' ? 'Try Again' : 'Back to Subscription'}
              </Button>
            )}

            {status === 'failed' && (
              <Button 
                onClick={() => navigate('/subscription/plans')} 
                variant="outline"
                className="w-full"
              >
                View Plans
              </Button>
            )}

            {(status === 'failed' || status === 'cancelled') && (
              <p className="text-xs text-center text-muted-foreground">
                Need help? Contact our support team
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentCallbackPage;
