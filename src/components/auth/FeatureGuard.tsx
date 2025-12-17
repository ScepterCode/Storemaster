/**
 * Feature Guard Component
 * 
 * Restricts access to premium features based on subscription tier
 * Shows upgrade prompts for free users trying to access premium features
 */

import React from 'react';
import { useOrganization } from '@/contexts/OrganizationContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Lock, TrendingUp, BarChart3, PieChart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface FeatureGuardProps {
  children: React.ReactNode;
  feature: 'advanced_reports' | 'custom_branding' | 'multi_location';
  fallback?: React.ReactNode;
}

const FeatureGuard: React.FC<FeatureGuardProps> = ({ children, feature, fallback }) => {
  const { organization } = useOrganization();
  const navigate = useNavigate();

  // Check if user has access to the feature
  const hasAccess = React.useMemo(() => {
    if (!organization) return false;
    
    // Free tier users don't have access to premium features
    if (organization.subscription_tier === 'free') {
      return false;
    }

    // Check specific feature access based on tier
    switch (feature) {
      case 'advanced_reports':
        return ['basic', 'pro', 'enterprise'].includes(organization.subscription_tier);
      case 'custom_branding':
        return ['pro', 'enterprise'].includes(organization.subscription_tier);
      case 'multi_location':
        return ['pro', 'enterprise'].includes(organization.subscription_tier);
      default:
        return false;
    }
  }, [organization, feature]);

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
          ]
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
          ]
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
          ]
        };
      default:
        return {
          icon: <Lock className="h-12 w-12 text-primary" />,
          title: 'Premium Feature',
          description: 'This feature is available on paid plans.',
          benefits: []
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
        </CardHeader>
        <CardContent className="space-y-6">
          {featureInfo.benefits.length > 0 && (
            <div className="bg-muted/50 rounded-lg p-4">
              <h4 className="font-semibold mb-3">What you'll get:</h4>
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
              <TrendingUp className="mr-2 h-4 w-4" />
              Upgrade Now
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              onClick={() => navigate('/subscription/plans')}
            >
              View All Plans
            </Button>
          </div>

          <p className="text-center text-sm text-muted-foreground">
            You're currently on the <strong>Free Forever</strong> plan.
            <br />
            Upgrade to unlock this feature and many more.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default FeatureGuard;
