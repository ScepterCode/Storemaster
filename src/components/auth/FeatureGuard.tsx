/**
 * Feature Guard Component
 * 
 * Restricts access to premium features based on subscription tier
 * Shows upgrade prompts for free users trying to access premium features
 * 
 * Free tier users get a 2-month trial for:
 * - Stock Predictions
 * - Advanced Reports
 * - Quist (AI Assistant)
 */

import React from 'react';
import { useOrganization } from '@/contexts/OrganizationContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Lock, TrendingUp, BarChart3, PieChart, Clock, Sparkles, Bot, Gift, AlertTriangle, Rocket } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { 
  hasTrialFeatureAccess, 
  getTrialDaysRemaining, 
  isTrialFeature,
  getTrialEndDate 
} from '@/config/subscriptionPlans';

/**
 * Get urgency level based on days remaining
 */
const getTrialUrgency = (daysRemaining: number): 'normal' | 'warning' | 'critical' => {
  if (daysRemaining <= 7) return 'critical';
  if (daysRemaining <= 14) return 'warning';
  return 'normal';
};

interface FeatureGuardProps {
  children: React.ReactNode;
  feature: 'advanced_reports' | 'custom_branding' | 'multi_location' | 'stock_predictions' | 'quist';
  fallback?: React.ReactNode;
}

const FeatureGuard: React.FC<FeatureGuardProps> = ({ children, feature, fallback }) => {
  const { organization } = useOrganization();
  const navigate = useNavigate();

  // Check if user has access to the feature
  const { hasAccess, isTrialAccess, trialDaysRemaining } = React.useMemo(() => {
    if (!organization) return { hasAccess: false, isTrialAccess: false, trialDaysRemaining: 0 };
    
    // Paid tier users have access to their tier's features
    if (organization.subscription_tier !== 'free') {
      // Check specific feature access based on tier
      let access = false;
      switch (feature) {
        case 'advanced_reports':
        case 'stock_predictions':
        case 'quist':
          access = ['basic', 'pro', 'enterprise'].includes(organization.subscription_tier);
          break;
        case 'custom_branding':
          access = ['pro', 'enterprise'].includes(organization.subscription_tier);
          break;
        case 'multi_location':
          access = ['pro', 'enterprise'].includes(organization.subscription_tier);
          break;
        default:
          access = false;
      }
      return { hasAccess: access, isTrialAccess: false, trialDaysRemaining: 0 };
    }

    // Free tier users - check if feature is a trial feature and within trial period
    if (isTrialFeature(feature)) {
      const hasTrialAccess = hasTrialFeatureAccess(feature, organization.created_at);
      const daysRemaining = getTrialDaysRemaining(organization.created_at);
      return { 
        hasAccess: hasTrialAccess, 
        isTrialAccess: hasTrialAccess, 
        trialDaysRemaining: daysRemaining 
      };
    }

    // Non-trial features are not available to free tier
    return { hasAccess: false, isTrialAccess: false, trialDaysRemaining: 0 };
  }, [organization, feature]);

  // Show trial banner if user has trial access
  if (hasAccess && isTrialAccess) {
    const urgency = getTrialUrgency(trialDaysRemaining);
    const trialEndDate = organization ? getTrialEndDate(organization.created_at) : new Date();
    
    // Different banner styles based on urgency
    const bannerStyles = {
      normal: 'bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-200',
      warning: 'bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200',
      critical: 'bg-gradient-to-r from-red-50 to-rose-50 border-red-200',
    };
    
    const iconStyles = {
      normal: 'bg-emerald-100 text-emerald-600',
      warning: 'bg-amber-100 text-amber-600',
      critical: 'bg-red-100 text-red-600',
    };
    
    const textStyles = {
      normal: { title: 'text-emerald-900', subtitle: 'text-emerald-700' },
      warning: { title: 'text-amber-900', subtitle: 'text-amber-700' },
      critical: { title: 'text-red-900', subtitle: 'text-red-700' },
    };

    const getMessage = () => {
      if (urgency === 'critical') {
        return {
          title: `⚠️ Trial ending soon - Only ${trialDaysRemaining} day${trialDaysRemaining === 1 ? '' : 's'} left!`,
          subtitle: `Your free trial ends on ${trialEndDate.toLocaleDateString()}. Upgrade now to keep access.`,
        };
      }
      if (urgency === 'warning') {
        return {
          title: `🎁 Free Trial - ${trialDaysRemaining} days remaining`,
          subtitle: `Enjoying this feature? Upgrade before ${trialEndDate.toLocaleDateString()} to keep access.`,
        };
      }
      return {
        title: `🎉 Free Trial Active - ${trialDaysRemaining} days remaining`,
        subtitle: `You're enjoying premium features! Trial ends ${trialEndDate.toLocaleDateString()}.`,
      };
    };

    const message = getMessage();

    return (
      <div className="space-y-4">
        {/* Trial Banner */}
        <div className={`border rounded-lg p-4 ${bannerStyles[urgency]}`}>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-full ${iconStyles[urgency]}`}>
                {urgency === 'critical' ? (
                  <AlertTriangle className="h-5 w-5" />
                ) : urgency === 'warning' ? (
                  <Clock className="h-5 w-5" />
                ) : (
                  <Gift className="h-5 w-5" />
                )}
              </div>
              <div>
                <p className={`font-medium ${textStyles[urgency].title}`}>
                  {message.title}
                </p>
                <p className={`text-sm ${textStyles[urgency].subtitle}`}>
                  {message.subtitle}
                </p>
              </div>
            </div>
            <Button 
              size="sm" 
              onClick={() => navigate('/subscription/plans')}
              className={urgency === 'critical' 
                ? 'bg-red-600 hover:bg-red-700' 
                : urgency === 'warning'
                ? 'bg-amber-600 hover:bg-amber-700'
                : 'bg-emerald-600 hover:bg-emerald-700'
              }
            >
              <Rocket className="h-4 w-4 mr-1" />
              {urgency === 'critical' ? 'Upgrade Now' : 'View Plans'}
            </Button>
          </div>
        </div>
        {children}
      </div>
    );
  }

  if (hasAccess) {
    return <>{children}</>;
  }

  // Show custom fallback if provided
  if (fallback) {
    return <>{fallback}</>;
  }

  // Default upgrade prompt
  const getFeatureInfo = () => {
    switch (feature) {
      case 'advanced_reports':
        return {
          icon: <BarChart3 className="h-12 w-12 text-primary" />,
          title: 'Advanced Analytics & Reports',
          description: 'Unlock detailed business insights with visual reports, trend analysis, and performance metrics.',
          benefits: [
            'Transaction trend analysis',
            'Category performance charts',
            'Top products by value',
            'Sales performance tracking',
            'Inventory distribution reports',
            'Custom date range filtering'
          ],
          trialExpired: isTrialFeature(feature) && organization?.subscription_tier === 'free'
        };
      case 'stock_predictions':
        return {
          icon: <Sparkles className="h-12 w-12 text-primary" />,
          title: 'AI Stock Predictions',
          description: 'Get intelligent stock predictions and reorder recommendations powered by machine learning.',
          benefits: [
            'Demand forecasting',
            'Reorder point suggestions',
            'Stock-out prevention alerts',
            'Seasonal trend analysis',
            'Inventory optimization tips',
            'Cost-saving recommendations'
          ],
          trialExpired: isTrialFeature(feature) && organization?.subscription_tier === 'free'
        };
      case 'quist':
        return {
          icon: <Bot className="h-12 w-12 text-primary" />,
          title: 'Quist AI Assistant',
          description: 'Your intelligent business assistant that answers questions about your inventory and sales.',
          benefits: [
            'Natural language queries',
            'Instant inventory insights',
            'Sales data analysis',
            'Product recommendations',
            'Quick data lookups',
            'Business intelligence on demand'
          ],
          trialExpired: isTrialFeature(feature) && organization?.subscription_tier === 'free'
        };
      case 'custom_branding':
        return {
          icon: <PieChart className="h-12 w-12 text-primary" />,
          title: 'Custom Branding',
          description: 'Personalize your invoices and documents with your company logo and colors.',
          benefits: [
            'Custom logo on invoices',
            'Brand color customization',
            'Professional appearance',
            'Enhanced credibility'
          ],
          trialExpired: false
        };
      case 'multi_location':
        return {
          icon: <TrendingUp className="h-12 w-12 text-primary" />,
          title: 'Multi-Location Support',
          description: 'Manage multiple business locations from a single account.',
          benefits: [
            'Multiple store management',
            'Location-specific inventory',
            'Consolidated reporting',
            'Centralized control'
          ],
          trialExpired: false
        };
      default:
        return {
          icon: <Lock className="h-12 w-12 text-primary" />,
          title: 'Premium Feature',
          description: 'This feature is available on paid plans.',
          benefits: [],
          trialExpired: false
        };
    }
  };

  const featureInfo = getFeatureInfo();

  return (
    <div className="flex items-center justify-center min-h-[400px] p-4">
      <Card className="max-w-2xl w-full">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            {featureInfo.icon}
          </div>
          <CardTitle className="text-2xl">{featureInfo.title}</CardTitle>
          <CardDescription className="text-base mt-2">
            {featureInfo.description}
          </CardDescription>
          {featureInfo.trialExpired && (
            <div className="mt-4 p-4 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-lg">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Clock className="h-5 w-5 text-amber-600" />
                <p className="text-amber-900 font-semibold">
                  Your 2-Month Free Trial Has Ended
                </p>
              </div>
              <p className="text-sm text-amber-700">
                You enjoyed {featureInfo.title} during your trial period. 
                Upgrade to a paid plan to continue using this powerful feature.
              </p>
            </div>
          )}
        </CardHeader>
        <CardContent className="space-y-6">
          {featureInfo.benefits.length > 0 && (
            <div className="bg-muted/50 rounded-lg p-4">
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                What you'll get:
              </h4>
              <ul className="space-y-2">
                {featureInfo.benefits.map((benefit, index) => (
                  <li key={index} className="flex items-start">
                    <span className="text-primary mr-2">✓</span>
                    <span className="text-sm">{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button 
              size="lg" 
              onClick={() => navigate('/subscription/plans')}
              className="bg-primary hover:bg-primary/90"
            >
              <Rocket className="mr-2 h-4 w-4" />
              Upgrade Now
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              onClick={() => navigate('/subscription/plans')}
            >
              Compare Plans
            </Button>
          </div>

          <div className="text-center space-y-2">
            <p className="text-sm text-muted-foreground">
              You're currently on the <strong>Free Forever</strong> plan.
            </p>
            {featureInfo.trialExpired ? (
              <p className="text-sm text-amber-600 font-medium">
                💡 Upgrade to Basic (₦15,000/month) to unlock this feature
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">
                Upgrade to unlock this feature and many more.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FeatureGuard;
