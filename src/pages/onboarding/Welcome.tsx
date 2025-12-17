/**
 * Welcome Page
 * 
 * Show onboarding completion and provide quick start guide
 * Requirements: 1.1, 3.4
 */

import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOrganization } from '@/contexts/OrganizationContext';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle2, 
  Package, 
  Users, 
  FileText, 
  BarChart3, 
  ArrowRight,
  Sparkles
} from 'lucide-react';

const Welcome = () => {
  const navigate = useNavigate();
  const { organization, refreshOrganization } = useOrganization();

  // Organization data is automatically fetched by OrganizationContext

  const quickStartSteps = [
    {
      icon: <Package className="h-5 w-5" />,
      title: 'Add Your Products',
      description: 'Start by adding your inventory items to the system',
      action: () => navigate('/inventory'),
    },
    {
      icon: <Users className="h-5 w-5" />,
      title: 'Invite Team Members',
      description: 'Collaborate with your team by inviting members',
      action: () => navigate('/settings'),
    },
    {
      icon: <FileText className="h-5 w-5" />,
      title: 'Create Your First Sale',
      description: 'Process transactions at the cash desk',
      action: () => navigate('/cashdesk'),
    },
    {
      icon: <BarChart3 className="h-5 w-5" />,
      title: 'View Reports',
      description: 'Track your business performance with analytics',
      action: () => navigate('/reports'),
    },
  ];

  const handleGetStarted = () => {
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <div className="w-full max-w-4xl space-y-6">
        {/* Success Card */}
        <Card className="border-primary/50 shadow-lg">
          <CardHeader className="text-center pb-4">
            <div className="flex justify-center mb-4">
              <div className="p-4 bg-primary/10 rounded-full">
                <CheckCircle2 className="h-12 w-12 text-primary" />
              </div>
            </div>
            <CardTitle className="text-3xl mb-2">
              Welcome to Store Master! 🎉
            </CardTitle>
            <CardDescription className="text-lg">
              Your organization <strong>{organization?.name}</strong> is ready to go
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Organization Info */}
            <div className="flex items-center justify-center gap-4 p-4 bg-muted rounded-lg">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Current Plan</p>
                <Badge variant="secondary" className="mt-1">
                  {organization?.subscription_tier?.toUpperCase() || 'FREE'}
                </Badge>
              </div>
              <div className="h-8 w-px bg-border" />
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Status</p>
                <Badge 
                  variant={organization?.subscription_status === 'active' ? 'default' : 'secondary'}
                  className="mt-1"
                >
                  {organization?.subscription_status?.toUpperCase() || 'ACTIVE'}
                </Badge>
              </div>
            </div>

            {/* Quick Start Guide */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-semibold">Quick Start Guide</h3>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                {quickStartSteps.map((step, index) => (
                  <Card 
                    key={index}
                    className="cursor-pointer hover:border-primary/50 transition-colors"
                    onClick={step.action}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          {step.icon}
                        </div>
                        <div className="flex-1">
                          <CardTitle className="text-base mb-1">
                            {step.title}
                          </CardTitle>
                          <CardDescription className="text-sm">
                            {step.description}
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            </div>

            {/* Features Overview */}
            <div className="p-4 bg-muted/50 rounded-lg">
              <h4 className="font-semibold mb-3">What you can do with Store Master:</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <span>Manage inventory with real-time stock tracking</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <span>Process sales and generate invoices instantly</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <span>Track customer information and purchase history</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <span>Generate detailed reports and analytics</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <span>Work offline with automatic sync when online</span>
                </li>
              </ul>
            </div>
          </CardContent>

          <CardFooter className="flex flex-col gap-3">
            <Button 
              className="w-full" 
              size="lg"
              onClick={handleGetStarted}
            >
              Get Started
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <p className="text-xs text-center text-muted-foreground">
              You can always access help and documentation from the settings menu
            </p>
          </CardFooter>
        </Card>

        {/* Additional Resources */}
        <div className="text-center">
          <p className="text-sm text-muted-foreground mb-2">
            Need help getting started?
          </p>
          <div className="flex justify-center gap-4">
            <Button variant="link" size="sm" onClick={() => navigate('/settings')}>
              View Settings
            </Button>
            <Button variant="link" size="sm" onClick={() => navigate('/subscription')}>
              Manage Subscription
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Welcome;
