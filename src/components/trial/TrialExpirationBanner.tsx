/**
 * Trial Expiration Banner Component
 * 
 * Shows a persistent banner at the top of the app when the user's
 * free trial is about to expire (within 14 days).
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Clock, AlertTriangle, Rocket, Gift } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useOrganization } from '@/contexts/OrganizationContext';
import { 
  getTrialDaysRemaining, 
  isWithinFreeTierTrial,
  getTrialEndDate
} from '@/config/subscriptionPlans';

const DISMISSAL_KEY = 'trial_banner_dismissed_at';
const DISMISSAL_DURATION = 24 * 60 * 60 * 1000;

interface TrialExpirationBannerProps {
  showWhenDaysRemaining?: number;
}

const TrialExpirationBanner: React.FC<TrialExpirationBannerProps> = ({
  showWhenDaysRemaining = 14,
}) => {
  const navigate = useNavigate();
  const { organization } = useOrganization();
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    const dismissedAt = localStorage.getItem(DISMISSAL_KEY);
    if (dismissedAt) {
      const dismissedTime = parseInt(dismissedAt, 10);
      if (Date.now() - dismissedTime < DISMISSAL_DURATION) {
        setIsDismissed(true);
      } else {
        localStorage.removeItem(DISMISSAL_KEY);
      }
    }
  }, []);

  if (isDismissed) return null;
  if (!organization || organization.subscription_tier !== 'free') return null;

  const isInTrial = isWithinFreeTierTrial(organization.created_at);
  if (!isInTrial) return null;

  const daysRemaining = getTrialDaysRemaining(organization.created_at);
  if (daysRemaining > showWhenDaysRemaining) return null;

  const trialEndDate = getTrialEndDate(organization.created_at);

  const handleDismiss = () => {
    localStorage.setItem(DISMISSAL_KEY, Date.now().toString());
    setIsDismissed(true);
  };

  const getUrgencyConfig = () => {
    if (daysRemaining <= 3) {
      return {
        bgClass: 'bg-gradient-to-r from-red-600 to-rose-600',
        icon: <AlertTriangle className="h-5 w-5" />,
        title: `Trial expires in ${daysRemaining} day${daysRemaining === 1 ? '' : 's'}!`,
        message: `Upgrade now to keep Reports, Stock Predictions & Quist.`,
        buttonText: 'Upgrade Now',
        buttonClass: 'bg-white text-red-600 hover:bg-red-50',
      };
    }
    if (daysRemaining <= 7) {
      return {
        bgClass: 'bg-gradient-to-r from-amber-500 to-orange-500',
        icon: <Clock className="h-5 w-5" />,
        title: `${daysRemaining} days left in your trial`,
        message: `Upgrade before ${trialEndDate.toLocaleDateString()}.`,
        buttonText: 'View Plans',
        buttonClass: 'bg-white text-amber-600 hover:bg-amber-50',
      };
    }
    return {
      bgClass: 'bg-gradient-to-r from-blue-500 to-indigo-500',
      icon: <Gift className="h-5 w-5" />,
      title: `${daysRemaining} days remaining in your free trial`,
      message: `Lock in your access with an upgrade.`,
      buttonText: 'Explore Plans',
      buttonClass: 'bg-white text-blue-600 hover:bg-blue-50',
    };
  };

  const config = getUrgencyConfig();

  return (
    <div className={`${config.bgClass} text-white px-4 py-3 relative`}>
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="flex-shrink-0 p-1.5 bg-white/20 rounded-full">
            {config.icon}
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-sm">{config.title}</p>
            <p className="text-xs text-white/90">{config.message}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" className={config.buttonClass} onClick={() => navigate('/subscription/plans')}>
            <Rocket className="h-4 w-4 mr-1" />
            {config.buttonText}
          </Button>
          <button onClick={handleDismiss} className="p-1.5 hover:bg-white/20 rounded-full" aria-label="Dismiss">
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default TrialExpirationBanner;
