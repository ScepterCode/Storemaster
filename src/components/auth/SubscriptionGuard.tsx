/**
 * Subscription Guard Component
 * 
 * Checks subscription status and redirects to appropriate pages
 * Shows grace period warnings when subscription is about to expire
 */

import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useOrganization } from '@/contexts/OrganizationContext';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

interface SubscriptionGuardProps {
  children: React.ReactNode;
}

const SubscriptionGuard: React.FC<SubscriptionGuardProps> = ({ children }) => {
  const { organization, loading } = useOrganization();
  const location = useLocation();
  const [showGracePeriodWarning, setShowGracePeriodWarning] = useState(false);
  const [daysUntilExpiry, setDaysUntilExpiry] = useState<number | null>(null);

  useEffect(() => {
    if (!organization || loading) return;

    // Check if subscription is about to expire (grace period)
    if (organization.subscription_ends_at) {
      const expiryDate = new Date(organization.subscription_ends_at);
      const now = new Date();
      const daysRemaining = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      // Show warning if less than 7 days remaining
      if (daysRemaining > 0 && daysRemaining <= 7 && organization.subscription_status === 'active') {
        setShowGracePeriodWarning(true);
        setDaysUntilExpiry(daysRemaining);
      } else {
        setShowGracePeriodWarning(false);
        setDaysUntilExpiry(null);
      }
    }
  }, [organization, loading]);

  if (loading) {
    return null; // Loading is handled by ProtectedRoute
  }

  if (!organization) {
    return <>{children}</>; // No organization check is handled by ProtectedRoute
  }

  // Free tier users never expire - they have permanent access to basic features
  const isFreeForever = organization.subscription_tier === 'free';

  // Allow access to subscription-related pages even if expired
  const allowedPaths = [
    '/subscription',
    '/subscription/plans',
    '/subscription/callback',
    '/subscription/expired',
    '/onboarding',
  ];

  const isAllowedPath = allowedPaths.some(path => location.pathname.startsWith(path));

  // Only check expiration for paid tiers (not free tier)
  if (!isFreeForever) {
    // Check if subscription is expired
    if (organization.subscription_status === 'expired' && !isAllowedPath) {
      return <Navigate to="/subscription/expired" replace />;
    }

    // Check if subscription is suspended
    if (organization.subscription_status === 'suspended' && !isAllowedPath) {
      return <Navigate to="/subscription/expired" replace />;
    }
  }

  return (
    <>
      {showGracePeriodWarning && daysUntilExpiry !== null && (
        <div className="fixed top-0 left-0 right-0 z-50 p-4">
          <Alert variant="destructive" className="max-w-4xl mx-auto">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Your subscription will expire in {daysUntilExpiry} {daysUntilExpiry === 1 ? 'day' : 'days'}. 
              Please renew to avoid service interruption.{' '}
              <a href="/subscription" className="underline font-semibold">
                Renew now
              </a>
            </AlertDescription>
          </Alert>
        </div>
      )}
      {children}
    </>
  );
};

export default SubscriptionGuard;
