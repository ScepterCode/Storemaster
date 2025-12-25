/**
 * useTrialNotification Hook
 * 
 * Shows toast notifications when the user's trial is about to expire.
 * Only shows once per session for each threshold.
 */

import { useEffect, useRef } from 'react';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useToast } from '@/hooks/use-toast';
import { 
  getTrialDaysRemaining, 
  isWithinFreeTierTrial 
} from '@/config/subscriptionPlans';

const NOTIFICATION_THRESHOLDS = [14, 7, 3, 1];
const SHOWN_KEY = 'trial_notifications_shown';

export const useTrialNotification = () => {
  const { organization } = useOrganization();
  const { toast } = useToast();
  const hasShownRef = useRef<Set<number>>(new Set());

  useEffect(() => {
    // Load previously shown notifications
    const shown = localStorage.getItem(SHOWN_KEY);
    if (shown) {
      try {
        const parsed = JSON.parse(shown);
        hasShownRef.current = new Set(parsed);
      } catch {
        hasShownRef.current = new Set();
      }
    }
  }, []);

  useEffect(() => {
    if (!organization || organization.subscription_tier !== 'free') return;
    if (!isWithinFreeTierTrial(organization.created_at)) return;

    const daysRemaining = getTrialDaysRemaining(organization.created_at);

    // Find the appropriate threshold
    const threshold = NOTIFICATION_THRESHOLDS.find(t => daysRemaining <= t);
    if (!threshold || hasShownRef.current.has(threshold)) return;

    // Mark as shown
    hasShownRef.current.add(threshold);
    localStorage.setItem(SHOWN_KEY, JSON.stringify([...hasShownRef.current]));

    // Show notification based on urgency
    const getNotification = () => {
      if (daysRemaining <= 1) {
        return {
          title: '⚠️ Trial Expires Tomorrow!',
          description: 'Upgrade now to keep access to Reports, Stock Predictions & Quist.',
          variant: 'destructive' as const,
        };
      }
      if (daysRemaining <= 3) {
        return {
          title: `🕐 ${daysRemaining} Days Left in Trial`,
          description: 'Your premium features access is ending soon. Upgrade to continue.',
          variant: 'destructive' as const,
        };
      }
      if (daysRemaining <= 7) {
        return {
          title: `📅 ${daysRemaining} Days Left in Trial`,
          description: 'Enjoying the premium features? Consider upgrading.',
          variant: 'default' as const,
        };
      }
      return {
        title: `🎁 ${daysRemaining} Days Left in Trial`,
        description: 'You have access to premium features during your trial.',
        variant: 'default' as const,
      };
    };

    const notification = getNotification();
    
    // Delay notification slightly so it doesn't appear immediately on page load
    const timer = setTimeout(() => {
      toast({
        title: notification.title,
        description: notification.description,
        variant: notification.variant,
        duration: 8000,
      });
    }, 2000);

    return () => clearTimeout(timer);
  }, [organization, toast]);
};
