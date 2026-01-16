import React from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import VATDashboard from '@/components/tax/VATDashboard';
import { Calculator, FileText, Settings, BarChart3 } from 'lucide-react';

const TaxCompliancePage = () => {
  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Tax Compliance</h1>
            <p className="text-muted-foreground">
              Manage VAT, CIT, and other tax obligations for your business
            </p>
          </div>
        </div>

        <Tabs defaultValue="vat" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="vat" className="flex items-center gap-2">
              <Calculator className="h-4 w-4" />
              VAT Management
            </TabsTrigger>
            <TabsTrigger value="returns" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Tax Returns
            </TabsTrigger>
            <TabsTrigger value="reports" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Tax Reports
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Tax Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="vat" className="space-y-6">
            <VATDashboard />
          </TabsContent>

          <TabsContent value="returns" className="space-y-6">
            <div className="text-center py-12">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Tax Returns</h3>
              <p className="text-muted-foreground">
                Generate and manage your VAT returns and other tax filings
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Coming soon in the next update
              </p>
            </div>
          </TabsContent>

          <TabsContent value="reports" className="space-y-6">
            <div className="text-center py-12">
              <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Tax Reports</h3>
              <p className="text-muted-foreground">
                Detailed tax reports and analytics for compliance
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Coming soon in the next update
              </p>
            </div>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <div className="text-center py-12">
              <Settings className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Tax Settings</h3>
              <p className="text-muted-foreground">
                Configure tax rates, exemptions, and compliance settings
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Coming soon in the next update
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default TaxCompliancePage;