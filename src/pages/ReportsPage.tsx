
import React from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const ReportsPage = () => {
  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Reports</h1>
            <p className="text-muted-foreground">View and generate financial reports</p>
          </div>
        </div>
        
        <Alert>
          <AlertTitle>Connect to Supabase</AlertTitle>
          <AlertDescription>
            To enable full reporting functionality with VAT tracking and financial reports, please 
            connect your application to Supabase. This will allow you to store data securely and 
            generate comprehensive reports.
          </AlertDescription>
        </Alert>
        
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Profit & Loss</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">View your business's profitability over time.</p>
              <div className="mt-4 h-48 border rounded flex items-center justify-center">
                <p className="text-muted-foreground">Connect to Supabase to enable reports</p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Sales Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Analyze your sales performance by product and time period.</p>
              <div className="mt-4 h-48 border rounded flex items-center justify-center">
                <p className="text-muted-foreground">Connect to Supabase to enable reports</p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>VAT Report</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Generate VAT reports for tax compliance.</p>
              <div className="mt-4 h-48 border rounded flex items-center justify-center">
                <p className="text-muted-foreground">Connect to Supabase to enable reports</p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Inventory Turnover</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Track how quickly your inventory sells.</p>
              <div className="mt-4 h-48 border rounded flex items-center justify-center">
                <p className="text-muted-foreground">Connect to Supabase to enable reports</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
};

export default ReportsPage;
