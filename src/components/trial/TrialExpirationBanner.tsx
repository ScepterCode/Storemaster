/**
 * Trial Expiration Banner Component
 * 
 * Shows a dismissible banner when the user's trial is about to expire.
 * Appears at the top of the app when trial has 14 days or less remaining.
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOrganization } from '@/contexts/OrganizationContext';
import { Button } from '@/components/ui/button';
import { X, Clock, AlertTriangle, Rocket, Gift, Sparkles } from 'lucide-react';
import { 
  isWithinFreeTierTrial, 
  getTrialDaysRemaining,
  getTrialEndDate,
  FREE_TIER_TRIAL_FEATURES,
} from '@/config/subscriptionPlans';

const BANNER_DISMISSED_KEY = 'trial_banner_dismissed';
const BANNER_DISMISS_DURATION = 24 * 60 * 60 * 1000; // 24 hours

interface TrialExpirationBannerProps {
  /** Show banner when days remaining is less than or equal to this */
  showWhenDaysRemaining?: number;
}

const TrialExpirationBanner: React.FC<TrialExpirationBannerProps> = ({
  showWhenDaysRemaining = 14,
}) => {
  const navigate = useNavigate();
  const { organization } = useOrganization();
  const [dismissed, setDismissed] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Check if banner was recently dismissed
  useEffect(() => {
    setMounted(true);
    const dismissedAt = localStorage.getItem(BANNER_DISMISSED_KEY);
    if (dismissedAt) {
      const dismissedTime = parseInt(dismissedAt, 10);
      if (Date.now() - dismissedTime < BANNER_DISMISS_DURATION) {
        setDismissed(true);
      } else {
        localStorage.removeItem(BANNER_DISMISSED_KEY);
      }
    }
  }, []);

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem(BANNER_DISMISSED_KEY, Date.now().toString());
  };

  // Don't render on server or if dismissed
  if (!mounted || dismissed) return null;

  // Only show for free tier organizations
  if (!organization || organization.subscription_tier !== 'free') return null;

  // Check if within trial period
  const isInTrial = isWithinFreeTierTrial(organization.created_at);
  if (!isInTrial) return null;

  const daysRemaining = getTrialDaysRemaining(organization.created_at);
  const trialEndDate = getTrialEndDate(organization.created_at);

  // Only show when days remaining is within threshold
  if (daysRemaining > showWhenDaysRemaining) return null;

  // Determine urgency level
  const isCritical = daysRemaining <= 7;
  const isWarning = daysRemaining <= 14 && daysRemaining > 7;

  // Feature names for display
  const featureNames = ['Stock Predictions', 'Reports', 'Quist AI'];

  return (
    <div
      className={`
        relative w-full py-3 px-4 
        ${isCritical 
          ? 'bg-gradient-to-r from-red-500 to-rose-500 text-white' 
          : isWarning
          ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white'
          : 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white'
        }
      `}
    >
      <div className="container mx-auto flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className={`
            p-1.5 rounded-full 
            ${isCritical ? 'bg-white/20' : isWarning ? 'bg-white/20' : 'bg-white/20'}
          `}>
            {isCritical ? (
              <AlertTriangle className="h-5 w-5" />
            ) : isWarning ? (
              <Clock className="h-5 w-5" />
            ) : (
              <Gift className="h-5 w-5" />
            )}
          </div>
          
          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
            <span className="font-semibold">
              {isCritical 
                ? `⚠️ Trial ends in ${daysRemaining} day${daysRemaining === 1 ? '' : 's'}!`
                : `🎁 ${daysRemaining} days left in your free trial`
              }
            </span>
            <span className="text-sm opacity-90 hidden md:inline">
              {isCritical 
                ? `Upgrade by ${trialEndDate.toLocaleDateString()} to keep ${featureNames.join(', ')}`
                : `Enjoying ${featureNames.join(', ')}? Upgrade to keep access after ${trialEndDate.toLocaleDateString()}`
              }
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="secondary"
            onClick={() => navigate('/subscription/plans')}
            className={`
              ${isCritical 
                ? 'bg-white text-red-600 hover:bg-white/90' 
                : isWarning
                ? 'bg-white text-amber-600 hover:bg-white/90'
                : 'bg-white text-emerald-600 hover:bg-white/90'
              }
            `}
          >
            <Rocket className="h-4 w-4 mr-1" />
            {isCritical ? 'Upgrade Now' : 'View Plans'}
          </Button>
          
          <Button
            size="sm"
            variant="ghost"
            onClick={handleDismiss}
            className="text-white hover:bg-white/20 p-1 h-8 w-8"
            aria-label="Dismiss banner"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default TrialExpirationBanner;
