/**
 * Upgrade Prompt Component
 * 
 * Displays when a user reaches their plan limit and prompts them to upgrade.
 * Shows current plan, limits, and provides an upgrade button.
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, ArrowRight, Check } from 'lucide-react';
import { OrganizationLimits } from '@/lib/limitChecker';
import { formatPrice } from '@/config/subscriptionPlans';

interface UpgradePromptProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  limitType: 'users' | 'products' | 'invoices' | 'storage';
  limits?: OrganizationLimits;
}

const limitTypeLabels = {
  users: 'Team Members',
  products: 'Products',
  invoices: 'Monthly Invoices',
  storage: 'Storage',
};

const limitTypeDescriptions = {
  users: 'Add more team members to collaborate on your inventory',
  products: 'Manage more products in your inventory',
  invoices: 'Create more invoices each month',
  storage: 'Store more data and attachments',
};

export const UpgradePrompt: React.FC<UpgradePromptProps> = ({
  open,
  onOpenChange,
  limitType,
  limits,
}) => {
  const navigate = useNavigate();

  const handleUpgrade = () => {
    onOpenChange(false);
    navigate('/subscription/plans');
  };

  const handleViewPlans = () => {
    onOpenChange(false);
    navigate('/subscription/plans');
  };

  if (!limits) {
    return null;
  }

  const currentLimit = limits[limitType];
  const planName = limits.plan.name;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 bg-orange-100 dark:bg-orange-900/20 rounded-full">
              <AlertCircle className="h-5 w-5 text-orange-600 dark:text-orange-400" />
            </div>
            <DialogTitle>Limit Reached</DialogTitle>
          </div>
          <DialogDescription>
            You've reached your {limitTypeLabels[limitType].toLowerCase()} limit on the{' '}
            <Badge variant="secondary" className="mx-1">
              {planName}
            </Badge>
            plan.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Current Usage */}
          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Current Usage</span>
              <Badge variant={currentLimit.isAtLimit ? 'destructive' : 'secondary'}>
                {currentLimit.current} / {currentLimit.limit === -1 ? '∞' : currentLimit.limit}
              </Badge>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all ${
                  currentLimit.isAtLimit
                    ? 'bg-destructive'
                    : currentLimit.isNearLimit
                    ? 'bg-orange-500'
                    : 'bg-primary'
                }`}
                style={{
                  width: `${Math.min(currentLimit.percentage, 100)}%`,
                }}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              {limitTypeDescriptions[limitType]}
            </p>
          </div>

          {/* Upgrade Benefits */}
          <div className="space-y-2">
            <h4 className="text-sm font-semibold">Upgrade to get:</h4>
            <ul className="space-y-2">
              <li className="flex items-start gap-2 text-sm">
                <Check className="h-4 w-4 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                <span>Higher limits for all resources</span>
              </li>
              <li className="flex items-start gap-2 text-sm">
                <Check className="h-4 w-4 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                <span>Advanced reporting and analytics</span>
              </li>
              <li className="flex items-start gap-2 text-sm">
                <Check className="h-4 w-4 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                <span>Priority support</span>
              </li>
              <li className="flex items-start gap-2 text-sm">
                <Check className="h-4 w-4 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                <span>Custom branding options</span>
              </li>
            </ul>
          </div>

          {/* Next Plan Preview */}
          {limits.plan.tier !== 'enterprise' && (
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold">
                  {limits.plan.tier === 'free' && 'Basic Plan'}
                  {limits.plan.tier === 'basic' && 'Professional Plan'}
                  {limits.plan.tier === 'pro' && 'Enterprise Plan'}
                </span>
                <span className="text-sm font-bold">
                  {limits.plan.tier === 'free' && formatPrice(15000)}
                  {limits.plan.tier === 'basic' && formatPrice(35000)}
                  {limits.plan.tier === 'pro' && formatPrice(75000)}
                  <span className="text-xs text-muted-foreground">/month</span>
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                {limitType === 'users' && (
                  <>
                    {limits.plan.tier === 'free' && 'Up to 5 team members'}
                    {limits.plan.tier === 'basic' && 'Up to 15 team members'}
                    {limits.plan.tier === 'pro' && 'Unlimited team members'}
                  </>
                )}
                {limitType === 'products' && (
                  <>
                    {limits.plan.tier === 'free' && 'Up to 500 products'}
                    {limits.plan.tier === 'basic' && 'Up to 2,000 products'}
                    {limits.plan.tier === 'pro' && 'Unlimited products'}
                  </>
                )}
                {limitType === 'invoices' && (
                  <>
                    {limits.plan.tier === 'free' && 'Up to 100 invoices/month'}
                    {limits.plan.tier === 'basic' && 'Up to 500 invoices/month'}
                    {limits.plan.tier === 'pro' && 'Unlimited invoices'}
                  </>
                )}
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="w-full sm:w-auto">
            Maybe Later
          </Button>
          <Button onClick={handleUpgrade} className="w-full sm:w-auto">
            View Plans
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
