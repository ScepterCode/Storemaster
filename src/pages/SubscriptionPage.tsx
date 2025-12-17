/**
 * Subscription Management Page
 * 
 * Display current subscription details, billing history, and manage subscription
 * Requirements: 3.1, 3.5, 4.1, 4.2, 4.3, 9.1, 9.2, 9.3, 9.4, 9.5
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useAuth } from '@/contexts/AuthContext';
import { adminService } from '@/services/adminService';
import { flutterwaveService } from '@/services/flutterwaveService';
import { SUBSCRIPTION_PLANS, getPlanById, formatPrice } from '@/config/subscriptionPlans';
import { Subscription } from '@/types/admin';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { 
  CreditCard, 
  Calendar, 
  TrendingUp, 
  AlertCircle,
  Loader2,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

const SubscriptionPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { organization, loading: orgLoading, refreshOrganization } = useOrganization();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    if (organization) {
      loadSubscription();
    }
  }, [organization]);

  const loadSubscription = async () => {
    if (!organization) return;

    try {
      setLoading(true);
      const sub = await adminService.getOrganizationSubscription(organization.id);
      setSubscription(sub);
    } catch (error) {
      console.error('Error loading subscription:', error);
      toast({
        title: 'Error',
        description: 'Failed to load subscription details',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = () => {
    navigate('/subscription/plans');
  };

  const handleCancelSubscription = async () => {
    if (!subscription) return;

    try {
      setCancelling(true);
      await adminService.cancelSubscription(subscription.id);
      
      toast({
        title: 'Subscription Cancelled',
        description: 'Your subscription will remain active until the end of the current billing period',
      });

      setCancelDialogOpen(false);
      await loadSubscription();
      await refreshOrganization();
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      toast({
        title: 'Error',
        description: 'Failed to cancel subscription',
        variant: 'destructive',
      });
    } finally {
      setCancelling(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline', icon: React.ReactNode }> = {
      active: { 
        variant: 'default', 
        icon: <CheckCircle2 className="h-3 w-3 mr-1" /> 
      },
      pending: { 
        variant: 'secondary', 
        icon: <Loader2 className="h-3 w-3 mr-1 animate-spin" /> 
      },
      cancelled: { 
        variant: 'outline', 
        icon: <XCircle className="h-3 w-3 mr-1" /> 
      },
      expired: { 
        variant: 'destructive', 
        icon: <AlertCircle className="h-3 w-3 mr-1" /> 
      },
      failed: { 
        variant: 'destructive', 
        icon: <XCircle className="h-3 w-3 mr-1" /> 
      },
    };

    const { variant, icon } = config[status] || config.pending;

    return (
      <Badge variant={variant} className="flex items-center w-fit">
        {icon}
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getDaysRemaining = () => {
    if (!organization?.subscription_ends_at) return null;
    
    const endDate = new Date(organization.subscription_ends_at);
    const today = new Date();
    const diffTime = endDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
  };

  if (orgLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!organization) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              No organization found. Please contact support.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentPlan = getPlanById(organization.subscription_tier);
  const daysRemaining = getDaysRemaining();

  return (
    <div className="container mx-auto py-8 px-4 max-w-5xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-2">
          Subscription Management
        </h1>
        <p className="text-muted-foreground">
          Manage your subscription and billing details
        </p>
      </div>

      {/* Current Plan Overview */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Current Plan</CardTitle>
              <CardDescription>Your active subscription details</CardDescription>
            </div>
            {subscription && getStatusBadge(subscription.status)}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Plan Details */}
            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <h3 className="text-2xl font-bold mb-2">
                  {currentPlan?.name || organization.subscription_tier}
                </h3>
                <p className="text-3xl font-bold text-primary">
                  {currentPlan ? formatPrice(currentPlan.price_monthly) : '₦0'}
                  <span className="text-base font-normal text-muted-foreground">/month</span>
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Started:</span>
                  <span className="font-medium">
                    {formatDate(organization.subscription_starts_at)}
                  </span>
                </div>
                {organization.subscription_ends_at && (
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Renews:</span>
                    <span className="font-medium">
                      {formatDate(organization.subscription_ends_at)}
                    </span>
                  </div>
                )}
                {daysRemaining !== null && daysRemaining > 0 && (
                  <div className="flex items-center gap-2 text-sm">
                    <AlertCircle className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">
                      {daysRemaining} days remaining
                    </span>
                  </div>
                )}
              </div>
            </div>

            <Separator />

            {/* Plan Features */}
            {currentPlan && (
              <div>
                <h4 className="font-semibold mb-3">Plan Features</h4>
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                    <span className="text-sm">
                      {currentPlan.features.max_users === -1 ? 'Unlimited' : currentPlan.features.max_users} users
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                    <span className="text-sm">
                      {currentPlan.features.max_products === -1 ? 'Unlimited' : currentPlan.features.max_products} products
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                    <span className="text-sm">
                      {currentPlan.features.max_invoices_per_month === -1 ? 'Unlimited' : currentPlan.features.max_invoices_per_month} invoices/month
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                    <span className="text-sm">
                      {currentPlan.features.max_storage_mb}MB storage
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                    <span className="text-sm">
                      {currentPlan.features.support_level} support
                    </span>
                  </div>
                  {currentPlan.features.advanced_reports && (
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                      <span className="text-sm">Advanced reports</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            <Separator />

            {/* Actions */}
            <div className="flex gap-3">
              <Button onClick={handleUpgrade} className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Upgrade Plan
              </Button>
              {subscription && subscription.status === 'active' && !subscription.cancel_at_period_end && (
                <Button 
                  variant="outline" 
                  onClick={() => setCancelDialogOpen(true)}
                  className="text-destructive hover:text-destructive"
                >
                  Cancel Subscription
                </Button>
              )}
              {subscription?.cancel_at_period_end && (
                <Badge variant="outline" className="flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  Cancels at period end
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Billing Information */}
      {subscription && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Billing Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Amount</p>
                <p className="font-semibold">
                  {formatPrice(subscription.amount)}
                  <span className="text-sm font-normal text-muted-foreground ml-1">
                    / {subscription.interval}
                  </span>
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Payment Method</p>
                <p className="font-semibold">Flutterwave</p>
              </div>
              {subscription.last_payment_date && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Last Payment</p>
                  <p className="font-semibold">{formatDate(subscription.last_payment_date)}</p>
                </div>
              )}
              {subscription.next_payment_date && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Next Payment</p>
                  <p className="font-semibold">{formatDate(subscription.next_payment_date)}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Usage Information */}
      <Card>
        <CardHeader>
          <CardTitle>Usage</CardTitle>
          <CardDescription>Current usage against your plan limits</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-muted-foreground">Users</span>
                <span className="font-medium">
                  0 / {currentPlan?.features.max_users === -1 ? '∞' : currentPlan?.features.max_users}
                </span>
              </div>
              <div className="h-2 bg-secondary rounded-full overflow-hidden">
                <div className="h-full bg-primary" style={{ width: '0%' }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-muted-foreground">Products</span>
                <span className="font-medium">
                  0 / {currentPlan?.features.max_products === -1 ? '∞' : currentPlan?.features.max_products}
                </span>
              </div>
              <div className="h-2 bg-secondary rounded-full overflow-hidden">
                <div className="h-full bg-primary" style={{ width: '0%' }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-muted-foreground">Invoices this month</span>
                <span className="font-medium">
                  0 / {currentPlan?.features.max_invoices_per_month === -1 ? '∞' : currentPlan?.features.max_invoices_per_month}
                </span>
              </div>
              <div className="h-2 bg-secondary rounded-full overflow-hidden">
                <div className="h-full bg-primary" style={{ width: '0%' }} />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cancel Subscription Dialog */}
      <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Subscription</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel your subscription? Your plan will remain active until the end of the current billing period.
              After that, you'll be downgraded to the free plan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={cancelling}>Keep Subscription</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancelSubscription}
              disabled={cancelling}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {cancelling && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Cancel Subscription
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default SubscriptionPage;
