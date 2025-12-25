/**
 * Subscription Plans Configuration
 * 
 * Defines available subscription tiers and their features
 */

import { SubscriptionPlan } from '@/types/admin';

/**
 * Trial period duration in days for free tier premium features
 * Free users get access to Stock Predictions, Reports, and Quist for this period
 */
export const FREE_TIER_TRIAL_DAYS = 60; // 2 months

/**
 * Premium features available during free tier trial period
 */
export const FREE_TIER_TRIAL_FEATURES = [
  'stock_predictions',
  'advanced_reports', 
  'quist',
] as const;

export type TrialFeature = typeof FREE_TIER_TRIAL_FEATURES[number];

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: 'free',
    name: 'Free Forever',
    tier: 'free',
    price_monthly: 0,
    price_yearly: 0,
    currency: 'NGN',
    features: {
      max_users: 2,
      max_products: 50,
      max_invoices_per_month: 20,
      max_storage_mb: 100,
      api_rate_limit: 100,
      support_level: 'email',
      custom_branding: false,
      advanced_reports: false, // Analytics restricted
      multi_location: false,
    },
    description: 'Perfect for getting started - no credit card required, no time limit',
  },
  {
    id: 'basic',
    name: 'Basic',
    tier: 'basic',
    price_monthly: 15000, // ₦15,000/month
    price_yearly: 150000, // ₦150,000/year (save ₦30,000)
    currency: 'NGN',
    features: {
      max_users: 5,
      max_products: 500,
      max_invoices_per_month: 100,
      max_storage_mb: 1000,
      api_rate_limit: 1000,
      support_level: 'email',
      custom_branding: false,
      advanced_reports: true, // Full analytics access
      multi_location: false,
    },
    flutterwave_plan_id_monthly: 'plan_basic_monthly',
    flutterwave_plan_id_yearly: 'plan_basic_yearly',
    description: 'Unlock advanced analytics and grow your business',
  },
  {
    id: 'pro',
    name: 'Professional',
    tier: 'pro',
    price_monthly: 35000, // ₦35,000/month
    price_yearly: 350000, // ₦350,000/year (save ₦70,000)
    currency: 'NGN',
    features: {
      max_users: 15,
      max_products: 2000,
      max_invoices_per_month: 500,
      max_storage_mb: 5000,
      api_rate_limit: 5000,
      support_level: 'priority',
      custom_branding: true,
      advanced_reports: true,
      multi_location: true,
    },
    flutterwave_plan_id_monthly: 'plan_pro_monthly',
    flutterwave_plan_id_yearly: 'plan_pro_yearly',
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    tier: 'enterprise',
    price_monthly: 75000, // ₦75,000/month
    price_yearly: 750000, // ₦750,000/year (save ₦150,000)
    currency: 'NGN',
    features: {
      max_users: -1, // Unlimited
      max_products: -1, // Unlimited
      max_invoices_per_month: -1, // Unlimited
      max_storage_mb: 50000,
      api_rate_limit: 50000,
      support_level: '24/7',
      custom_branding: true,
      advanced_reports: true,
      multi_location: true,
    },
    flutterwave_plan_id_monthly: 'plan_enterprise_monthly',
    flutterwave_plan_id_yearly: 'plan_enterprise_yearly',
  },
];

/**
 * Get plan by ID
 */
export const getPlanById = (planId: string): SubscriptionPlan | undefined => {
  return SUBSCRIPTION_PLANS.find((plan) => plan.id === planId);
};

/**
 * Get plan by tier
 */
export const getPlanByTier = (tier: string): SubscriptionPlan | undefined => {
  return SUBSCRIPTION_PLANS.find((plan) => plan.tier === tier);
};

/**
 * Calculate savings for yearly plan
 */
export const calculateYearlySavings = (plan: SubscriptionPlan): number => {
  return plan.price_monthly * 12 - plan.price_yearly;
};

/**
 * Format price in Naira
 */
export const formatPrice = (amount: number): string => {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 0,
  }).format(amount);
};

/**
 * Check if organization has exceeded limits
 */
export const checkLimits = (
  plan: SubscriptionPlan,
  current: {
    users?: number;
    products?: number;
    invoices?: number;
    storage?: number;
  }
): {
  users: boolean;
  products: boolean;
  invoices: boolean;
  storage: boolean;
} => {
  return {
    users: plan.features.max_users === -1 ? false : (current.users || 0) >= plan.features.max_users,
    products: plan.features.max_products === -1 ? false : (current.products || 0) >= plan.features.max_products,
    invoices: plan.features.max_invoices_per_month === -1 ? false : (current.invoices || 0) >= plan.features.max_invoices_per_month,
    storage: plan.features.max_storage_mb === -1 ? false : (current.storage || 0) >= plan.features.max_storage_mb,
  };
};

/**
 * Check if a free tier organization is within the trial period for premium features
 * 
 * @param organizationCreatedAt - The organization's created_at timestamp
 * @returns True if within trial period, false otherwise
 */
export const isWithinFreeTierTrial = (organizationCreatedAt: string): boolean => {
  const createdDate = new Date(organizationCreatedAt);
  const now = new Date();
  const daysSinceCreation = Math.floor(
    (now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24)
  );
  return daysSinceCreation <= FREE_TIER_TRIAL_DAYS;
};

/**
 * Get the number of days remaining in the free tier trial
 * 
 * @param organizationCreatedAt - The organization's created_at timestamp
 * @returns Number of days remaining (0 if trial expired)
 */
export const getTrialDaysRemaining = (organizationCreatedAt: string): number => {
  const createdDate = new Date(organizationCreatedAt);
  const now = new Date();
  const daysSinceCreation = Math.floor(
    (now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24)
  );
  return Math.max(0, FREE_TIER_TRIAL_DAYS - daysSinceCreation);
};

/**
 * Get the trial end date for a free tier organization
 * 
 * @param organizationCreatedAt - The organization's created_at timestamp
 * @returns The date when the trial ends
 */
export const getTrialEndDate = (organizationCreatedAt: string): Date => {
  const createdDate = new Date(organizationCreatedAt);
  const trialEndDate = new Date(createdDate);
  trialEndDate.setDate(trialEndDate.getDate() + FREE_TIER_TRIAL_DAYS);
  return trialEndDate;
};

/**
 * Check if a specific feature is available during the free tier trial
 * 
 * @param feature - The feature to check
 * @returns True if the feature is a trial feature
 */
export const isTrialFeature = (feature: string): boolean => {
  return FREE_TIER_TRIAL_FEATURES.includes(feature as TrialFeature);
};

/**
 * Check if a free tier user has access to a trial feature
 * 
 * @param feature - The feature to check
 * @param organizationCreatedAt - The organization's created_at timestamp
 * @returns True if the user has access to the feature
 */
export const hasTrialFeatureAccess = (
  feature: string,
  organizationCreatedAt: string
): boolean => {
  if (!isTrialFeature(feature)) {
    return false;
  }
  return isWithinFreeTierTrial(organizationCreatedAt);
};
