
import React, { useState } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { usePermissions } from '@/hooks/usePermissions';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, Users, TrendingUp, FileText } from 'lucide-react';
import TransactionMonitor from '@/components/manager/TransactionMonitor';
import StaffPerformance from '@/components/manager/StaffPerformance';
import SalesAnalytics from '@/components/manager/SalesAnalytics';
import ReportsExport from '@/components/manager/ReportsExport';

const ManagerOverviewPage = () => {
  const { canViewReports } = usePermissions();

  if (!canViewReports) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">Access Denied</h2>
            <p className="text-muted-foreground">You don't have permission to access manager overview.</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Manager Overview</h1>
          <p className="text-muted-foreground">
            Real-time visibility into all cashier transactions and performance metrics
          </p>
        </div>

        <Tabs defaultValue="transactions" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="transactions" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Transactions
            </TabsTrigger>
            <TabsTrigger value="staff" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Staff Performance
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="reports" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Reports
            </TabsTrigger>
          </TabsList>

          <TabsContent value="transactions">
            <TransactionMonitor />
          </TabsContent>

          <TabsContent value="staff">
            <StaffPerformance />
          </TabsContent>

          <TabsContent value="analytics">
            <SalesAnalytics />
          </TabsContent>

          <TabsContent value="reports">
            <ReportsExport />
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default ManagerOverviewPage;
