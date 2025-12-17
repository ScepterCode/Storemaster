/**
 * Subscription Plan Selection
 * 
 * Display plan options during onboarding and handle plan selection
 * Requirements: 3.1, 3.2
 */

import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { SUBSCRIPTION_PLANS, formatPrice, calculateYearlySavings } from '@/config/subscriptionPlans';
import { flutterwaveService } from '@/services/flutterwaveService';
import { adminService } from '@/services/adminService';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Check, Loader2, Crown, Zap, Building2, Gift, ArrowRight } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

const SelectPlan = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [billingInterval, setBillingInterval] = useState<'monthly' | 'yearly'>('monthly');
  const [processingPlan, setProcessingPlan] = useState<string | null>(null);

  // Get organization ID from navigation state
  const organizationId = location.state?.organizationId;

  const handleSelectPlan = async (planId: string) => {
    if (!user || !organizationId) {
      toast({
        title: 'Error',
        description: 'Missing required information',
        variant: 'destructive',
      });
      return;
    }

    try {
      setProcessingPlan(planId);

      // If free plan, just update organization and continue
      if (planId === 'free') {
        await adminService.updateOrganization(organizationId, {
          subscription_tier: 'free',
          subscription_status: 'active',
        });

        toast({
          title: 'Success',
          description: 'Free plan activated!',
        });

        navigate('/onboarding/welcome');
        return;
      }

      const plan = SUBSCRIPTION_PLANS.find(p => p.id === planId);
      if (!plan) throw new Error('Plan not found');

      const amount = billingInterval === 'monthly' ? plan.price_monthly : plan.price_yearly;
      const flutterwavePlanId = billingInterval === 'monthly' 
        ? plan.flutterwave_plan_id_monthly 
        : plan.flutterwave_plan_id_yearly;

      if (!flutterwavePlanId) {
        throw new Error('Payment plan not configured');
      }

      // Get payment link
      const paymentLink = await flutterwaveService.getUpgradePaymentLink(
        organizationId,
        flutterwavePlanId,
        amount,
        user.email || '',
        plan.name
      );

      if (paymentLink) {
        // Redirect to Flutterwave payment page
        window.location.href = paymentLink;
      } else {
        throw new Error('Failed to initialize payment');
      }
    } catch (error) {
      console.error('Error selecting plan:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to process payment',
        variant: 'destructive',
      });
    } finally {
      setProcessingPlan(null);
    }
  };

  const handleSkip = () => {
    // Skip to welcome page with free plan
    navigate('/onboarding/welcome');
  };

  const getPlanIcon = (tier: string) => {
    switch (tier) {
      case 'free':
        return <Gift className="h-6 w-6" />;
      case 'basic':
        return <Zap className="h-6 w-6" />;
      case 'pro':
        return <Crown className="h-6 w-6" />;
      case 'enterprise':
        return <Building2 className="h-6 w-6" />;
      default:
        return null;
    }
  };

  const formatFeatureValue = (value: number | boolean | string) => {
    if (typeof value === 'boolean') {
      return value ? 'Yes' : 'No';
    }
    if (value === -1) {
      return 'Unlimited';
    }
    return value.toString();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted py-12 px-4">
      <div className="container mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold tracking-tight mb-4">
            Choose Your Plan
          </h1>
          <p className="text-xl text-muted-foreground mb-8">
            Start with a free trial or select a paid plan to unlock more features
          </p>

          {/* Billing Toggle */}
          <div className="flex items-center justify-center gap-4">
            <Label htmlFor="billing-toggle" className={billingInterval === 'monthly' ? 'font-semibold' : ''}>
              Monthly
            </Label>
            <Switch
              id="billing-toggle"
              checked={billingInterval === 'yearly'}
              onCheckedChange={(checked) => setBillingInterval(checked ? 'yearly' : 'monthly')}
            />
            <Label htmlFor="billing-toggle" className={billingInterval === 'yearly' ? 'font-semibold' : ''}>
              Yearly
            </Label>
            {billingInterval === 'yearly' && (
              <Badge variant="secondary" className="ml-2">
                Save up to 17%
              </Badge>
            )}
          </div>
        </div>

        {/* Plans Grid */}
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4 max-w-7xl mx-auto mb-8">
          {SUBSCRIPTION_PLANS.map((plan) => {
            const price = billingInterval === 'monthly' ? plan.price_monthly : plan.price_yearly;
            const savings = calculateYearlySavings(plan);
            const isProcessing = processingPlan === plan.id;

            return (
              <Card 
                key={plan.id} 
                className={`relative flex flex-col ${plan.tier === 'pro' ? 'border-primary shadow-lg' : ''}`}
              >
                {plan.tier === 'pro' && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <Badge className="bg-primary">Recommended</Badge>
                  </div>
                )}

                <CardHeader>
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-primary">
                      {getPlanIcon(plan.tier)}
                    </div>
                    {plan.tier === 'free' && (
                      <Badge variant="secondary">Start Free</Badge>
                    )}
                  </div>
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                  <CardDescription>
                    <div className="mt-4">
                      <span className="text-4xl font-bold text-foreground">
                        {formatPrice(price)}
                      </span>
                      {price > 0 && (
                        <span className="text-muted-foreground">
                          /{billingInterval === 'monthly' ? 'month' : 'year'}
                        </span>
                      )}
                    </div>
                    {billingInterval === 'yearly' && savings > 0 && (
                      <p className="text-sm text-green-600 mt-2">
                        Save {formatPrice(savings)} per year
                      </p>
                    )}
                  </CardDescription>
                </CardHeader>

                <CardContent className="flex-1">
                  <ul className="space-y-3">
                    <li className="flex items-start gap-2">
                      <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                      <span className="text-sm">
                        {formatFeatureValue(plan.features.max_users)} users
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                      <span className="text-sm">
                        {formatFeatureValue(plan.features.max_products)} products
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                      <span className="text-sm">
                        {formatFeatureValue(plan.features.max_invoices_per_month)} invoices/month
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                      <span className="text-sm">
                        {plan.features.max_storage_mb}MB storage
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                      <span className="text-sm">
                        {plan.features.support_level} support
                      </span>
                    </li>
                    {plan.features.advanced_reports && (
                      <li className="flex items-start gap-2">
                        <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                        <span className="text-sm">Advanced reports</span>
                      </li>
                    )}
                    {plan.features.custom_branding && (
                      <li className="flex items-start gap-2">
                        <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                        <span className="text-sm">Custom branding</span>
                      </li>
                    )}
                    {plan.features.multi_location && (
                      <li className="flex items-start gap-2">
                        <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                        <span className="text-sm">Multi-location</span>
                      </li>
                    )}
                  </ul>
                </CardContent>

                <CardFooter>
                  <Button
                    className="w-full"
                    variant={plan.tier === 'pro' ? 'default' : 'outline'}
                    disabled={isProcessing}
                    onClick={() => handleSelectPlan(plan.id)}
                  >
                    {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {plan.tier === 'free' ? 'Start Free' : 'Select Plan'}
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>

        {/* Skip Option */}
        <div className="text-center">
          <Button variant="ghost" onClick={handleSkip}>
            Skip for now, I'll choose later
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>

        {/* Additional Info */}
        <div className="mt-8 text-center">
          <p className="text-sm text-muted-foreground">
            All plans include secure data storage, automatic backups, and 99.9% uptime guarantee
          </p>
        </div>
      </div>
    </div>
  );
};

export default SelectPlan;
