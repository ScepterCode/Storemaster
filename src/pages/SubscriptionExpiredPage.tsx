/**
 * Subscription Expired Page
 * 
 * Show expiration message and renewal options
 * Requirements: 4.2, 4.3, 4.4
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useAuth } from '@/contexts/AuthContext';
import { adminService } from '@/services/adminService';
import { flutterwaveService } from '@/services/flutterwaveService';
import { SUBSCRIPTION_PLANS, getPlanById, formatPrice } from '@/config/subscriptionPlans';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  AlertCircle, 
  Clock, 
  CreditCard, 
  Loader2,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

const SubscriptionExpiredPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { organization, loading: orgLoading, refreshOrganization } = useOrganization();
  const [processing, setProcessing] = useState(false);
  const [gracePeriodDays, setGracePeriodDays] = useState<number | null>(null);

  useEffect(() => {
    if (organization?.subscription_ends_at) {
      calculateGracePeriod();
    }
  }, [organization]);

  const calculateGracePeriod = () => {
    if (!organization?.subscription_ends_at) return;

    const endDate = new Date(organization.subscription_ends_at);
    const gracePeriodEnd = new Date(endDate.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days grace period
    const today = new Date();
    const diffTime = gracePeriodEnd.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    setGracePeriodDays(diffDays > 0 ? diffDays : 0);
  };

  const handleRenewSubscription = async () => {
    if (!user || !organization) {
      toast({
        title: 'Error',
        description: 'Please log in to renew your subscription',
        variant: 'destructive',
      });
      return;
    }

    try {
      setProcessing(true);

      const currentPlan = getPlanById(organization.subscription_tier);
      if (!currentPlan || currentPlan.id === 'free') {
        navigate('/subscription/plans');
        return;
      }

      // Get payment link for renewal
      const paymentLink = await flutterwaveService.getUpgradePaymentLink(
        organization.id,
        currentPlan.flutterwave_plan_id_monthly || '',
        currentPlan.price_monthly,
        user.email || '',
        currentPlan.name
      );

      if (paymentLink) {
        window.location.href = paymentLink;
      } else {
        throw new Error('Failed to initialize payment');
      }
    } catch (error) {
      console.error('Error renewing subscription:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to process renewal',
        variant: 'destructive',
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleViewPlans = () => {
    navigate('/subscription/plans');
  };

  const handleContactSupport = () => {
    // In a real app, this would open a support dialog or redirect to support page
    toast({
      title: 'Contact Support',
      description: 'Please email support@storemaster.com for assistance',
    });
  };

  if (orgLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const currentPlan = organization ? getPlanById(organization.subscription_tier) : null;
  const isInGracePeriod = gracePeriodDays !== null && gracePeriodDays > 0;

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-2xl space-y-6">
        {/* Main Card */}
        <Card className="border-destructive">
          <CardHeader>
            <div className="flex justify-center mb-4">
              <div className="rounded-full bg-destructive/10 p-4">
                <AlertCircle className="h-12 w-12 text-destructive" />
              </div>
            </div>
            <CardTitle className="text-center text-2xl">
              Subscription Expired
            </CardTitle>
            <CardDescription className="text-center">
              Your subscription has expired and access to premium features is limited
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Grace Period Alert */}
            {isInGracePeriod && (
              <Alert>
                <Clock className="h-4 w-4" />
                <AlertTitle>Grace Period Active</AlertTitle>
                <AlertDescription>
                  You have {gracePeriodDays} day{gracePeriodDays !== 1 ? 's' : ''} remaining to renew your subscription 
                  and maintain access to your data and features. After the grace period, your account will be 
                  downgraded to the free plan.
                </AlertDescription>
              </Alert>
            )}

            {/* Current Plan Info */}
            {currentPlan && currentPlan.id !== 'free' && (
              <div className="p-4 bg-secondary/50 rounded-lg">
                <h3 className="font-semibold mb-2">Previous Plan</h3>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-lg font-bold">{currentPlan.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatPrice(currentPlan.price_monthly)}/month
                    </p>
                  </div>
                  <Badge variant="destructive">Expired</Badge>
                </div>
              </div>
            )}

            {/* What Happens Next */}
            <div>
              <h3 className="font-semibold mb-3">What happens now?</h3>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <XCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium">Limited Access</p>
                    <p className="text-sm text-muted-foreground">
                      Premium features are now disabled. You can still access your data in read-only mode.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium">Data Preserved</p>
                    <p className="text-sm text-muted-foreground">
                      All your data is safe and will be restored when you renew your subscription.
                    </p>
                  </div>
                </div>
                {isInGracePeriod && (
                  <div className="flex items-start gap-3">
                    <Clock className="h-5 w-5 text-yellow-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium">Grace Period</p>
                      <p className="text-sm text-muted-foreground">
                        Renew within {gracePeriodDays} day{gracePeriodDays !== 1 ? 's' : ''} to avoid downgrade to free plan.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-3 pt-4">
              <Button 
                onClick={handleRenewSubscription} 
                className="w-full"
                size="lg"
                disabled={processing}
              >
                {processing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <CreditCard className="mr-2 h-4 w-4" />
                Renew Subscription
              </Button>
              <Button 
                onClick={handleViewPlans} 
                variant="outline"
                className="w-full"
                size="lg"
              >
                View All Plans
              </Button>
              <Button 
                onClick={handleContactSupport} 
                variant="ghost"
                className="w-full"
              >
                Contact Support
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Free Plan Features */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Free Plan Features</CardTitle>
            <CardDescription>
              What you can still access with the free plan
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              <li className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                <span>Up to 2 users</span>
              </li>
              <li className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                <span>50 products</span>
              </li>
              <li className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                <span>20 invoices per month</span>
              </li>
              <li className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                <span>100MB storage</span>
              </li>
              <li className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                <span>Email support</span>
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* Additional Help */}
        <div className="text-center text-sm text-muted-foreground">
          <p>
            Questions about your subscription?{' '}
            <button 
              onClick={handleContactSupport}
              className="text-primary hover:underline"
            >
              Contact our support team
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionExpiredPage;
