/**
 * Security Settings Page
 * 
 * Comprehensive security management interface for users
 */

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Shield, Activity, Settings } from 'lucide-react';
import SecurityDashboard from '@/components/auth/SecurityDashboard';
import SecurityAlerts from '@/components/auth/SecurityAlerts';
import { useEnhancedAuth } from '@/contexts/EnhancedAuthContext';

const SecuritySettingsPage: React.FC = () => {
  const { user } = useEnhancedAuth();

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Security Settings</h1>
          <p className="text-muted-foreground">
            Manage your account security and monitor activity
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Shield className="h-4 w-4" />
          Logged in as: {user?.email}
        </div>
      </div>

      <Tabs defaultValue="dashboard" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="dashboard" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Dashboard
          </TabsTrigger>
          <TabsTrigger value="alerts" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Security Alerts
          </TabsTrigger>
          <TabsTrigger value="advanced" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Advanced
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard">
          <SecurityDashboard />
        </TabsContent>

        <TabsContent value="alerts">
          <SecurityAlerts />
        </TabsContent>

        <TabsContent value="advanced">
          <Card>
            <CardHeader>
              <CardTitle>Advanced Security Settings</CardTitle>
              <CardDescription>
                Additional security features and configurations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">Data Export</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    Download all your account data for backup or migration purposes.
                  </p>
                  <button className="text-sm text-blue-600 hover:underline">
                    Request Data Export
                  </button>
                </div>

                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">Account Deletion</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    Permanently delete your account and all associated data.
                  </p>
                  <button className="text-sm text-red-600 hover:underline">
                    Delete Account
                  </button>
                </div>

                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">Security Audit</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    Review detailed security audit logs and compliance reports.
                  </p>
                  <button className="text-sm text-blue-600 hover:underline">
                    View Audit Logs
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SecuritySettingsPage;