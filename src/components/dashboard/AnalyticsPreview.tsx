/**
 * Analytics Preview Component
 * 
 * Shows a preview of analytics features for free users
 * Encourages upgrade to access full analytics
 */

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Lock, TrendingUp, BarChart3 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useOrganization } from '@/contexts/OrganizationContext';

const AnalyticsPreview: React.FC = () => {
  const navigate = useNavigate();
  const { organization } = useOrganization();

  // Only show for free tier users
  if (!organization || organization.subscription_tier !== 'free') {
    return null;
  }

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Advanced Analytics</CardTitle>
          </div>
          <Lock className="h-4 w-4 text-muted-foreground" />
        </div>
        <CardDescription>
          Unlock detailed insights about your business performance
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex items-start gap-2">
            <span className="text-primary">✓</span>
            <span>Sales trends & forecasting</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-primary">✓</span>
            <span>Category performance</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-primary">✓</span>
            <span>Product profitability</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-primary">✓</span>
            <span>Custom date ranges</span>
          </div>
        </div>

        <div className="pt-2">
          <Button 
            onClick={() => navigate('/subscription/plans')}
            className="w-full bg-primary hover:bg-primary/90"
          >
            <TrendingUp className="mr-2 h-4 w-4" />
            Upgrade to Unlock Analytics
          </Button>
        </div>

        <p className="text-xs text-center text-muted-foreground">
          Starting from ₦15,000/month
        </p>
      </CardContent>
    </Card>
  );
};

export default AnalyticsPreview;
