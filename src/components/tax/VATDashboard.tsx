import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatNaira } from '@/lib/formatter';
import { VATService } from '@/services/vatService';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useTaxConfiguration } from '@/hooks/useTaxConfiguration';
import { 
  Calculator, 
  FileText, 
  AlertCircle, 
  CheckCircle, 
  Calendar,
  TrendingUp,
  TrendingDown
} from 'lucide-react';

interface VATSummary {
  outputVAT: number;
  inputVAT: number;
  netVAT: number;
  totalTransactions: number;
}

const VATDashboard = () => {
  const { organization } = useOrganization();
  const { taxConfig, isLoading } = useTaxConfiguration();
  const [currentMonthSummary, setCurrentMonthSummary] = useState<VATSummary>({
    outputVAT: 0,
    inputVAT: 0,
    netVAT: 0,
    totalTransactions: 0
  });
  const [previousMonthSummary, setPreviousMonthSummary] = useState<VATSummary>({
    outputVAT: 0,
    inputVAT: 0,
    netVAT: 0,
    totalTransactions: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVATSummary = async () => {
      if (!organization?.id) return;

      try {
        setLoading(true);
        
        // Current month
        const now = new Date();
        const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
        const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
        
        // Previous month
        const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const previousMonthStart = prevMonth.toISOString().split('T')[0];
        const previousMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().split('T')[0];

        const [currentSummary, previousSummary] = await Promise.all([
          VATService.getVATSummary(organization.id, currentMonthStart, currentMonthEnd),
          VATService.getVATSummary(organization.id, previousMonthStart, previousMonthEnd)
        ]);

        setCurrentMonthSummary(currentSummary);
        setPreviousMonthSummary(previousSummary);
      } catch (error) {
        console.error('Error fetching VAT summary:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchVATSummary();
  }, [organization?.id]);

  const calculatePercentageChange = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };

  const getNextVATDueDate = () => {
    const now = new Date();
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 14);
    return nextMonth.toLocaleDateString('en-NG', { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    });
  };

  const getVATStatus = () => {
    const dueDate = new Date();
    dueDate.setMonth(dueDate.getMonth() + 1);
    dueDate.setDate(14);
    
    const daysUntilDue = Math.ceil((dueDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    
    if (daysUntilDue <= 7) {
      return { status: 'urgent', color: 'destructive', message: `Due in ${daysUntilDue} days` };
    } else if (daysUntilDue <= 14) {
      return { status: 'warning', color: 'secondary', message: `Due in ${daysUntilDue} days` };
    } else {
      return { status: 'good', color: 'default', message: `Due in ${daysUntilDue} days` };
    }
  };

  if (isLoading || loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <div className="h-4 bg-muted rounded animate-pulse" />
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-muted rounded animate-pulse mb-2" />
                <div className="h-3 bg-muted rounded animate-pulse w-2/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const vatStatus = getVATStatus();
  const outputVATChange = calculatePercentageChange(currentMonthSummary.outputVAT, previousMonthSummary.outputVAT);
  const netVATChange = calculatePercentageChange(currentMonthSummary.netVAT, previousMonthSummary.netVAT);

  return (
    <div className="space-y-6">
      {/* VAT Status Alert */}
      <Card className={`border-l-4 ${
        vatStatus.status === 'urgent' ? 'border-l-red-500 bg-red-50' :
        vatStatus.status === 'warning' ? 'border-l-yellow-500 bg-yellow-50' :
        'border-l-green-500 bg-green-50'
      }`}>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {vatStatus.status === 'urgent' ? (
                <AlertCircle className="h-5 w-5 text-red-500" />
              ) : vatStatus.status === 'warning' ? (
                <Calendar className="h-5 w-5 text-yellow-500" />
              ) : (
                <CheckCircle className="h-5 w-5 text-green-500" />
              )}
              <div>
                <p className="font-medium">Next VAT Return Due</p>
                <p className="text-sm text-muted-foreground">{getNextVATDueDate()}</p>
              </div>
            </div>
            <Badge variant={vatStatus.color as any}>
              {vatStatus.message}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* VAT Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground flex items-center">
              <TrendingUp className="h-4 w-4 mr-2" />
              Output VAT (Sales)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNaira(currentMonthSummary.outputVAT)}</div>
            <div className="flex items-center text-xs text-muted-foreground mt-1">
              {outputVATChange >= 0 ? (
                <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
              ) : (
                <TrendingDown className="h-3 w-3 mr-1 text-red-500" />
              )}
              {Math.abs(outputVATChange).toFixed(1)}% from last month
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground flex items-center">
              <TrendingDown className="h-4 w-4 mr-2" />
              Input VAT (Purchases)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNaira(currentMonthSummary.inputVAT)}</div>
            <p className="text-xs text-muted-foreground mt-1">VAT on business purchases</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground flex items-center">
              <Calculator className="h-4 w-4 mr-2" />
              Net VAT Position
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${
              currentMonthSummary.netVAT >= 0 ? 'text-red-600' : 'text-green-600'
            }`}>
              {formatNaira(Math.abs(currentMonthSummary.netVAT))}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {currentMonthSummary.netVAT >= 0 ? 'Amount to pay' : 'Refund due'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground flex items-center">
              <FileText className="h-4 w-4 mr-2" />
              Transactions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currentMonthSummary.totalTransactions}</div>
            <p className="text-xs text-muted-foreground mt-1">This month</p>
          </CardContent>
        </Card>
      </div>

      {/* VAT Configuration Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calculator className="h-5 w-5 mr-2" />
            VAT Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <p className="text-sm font-medium">VAT Rate</p>
              <p className="text-2xl font-bold">{taxConfig?.vat_rate || 7.5}%</p>
            </div>
            <div>
              <p className="text-sm font-medium">VAT Status</p>
              <Badge variant={taxConfig?.vat_enabled ? 'default' : 'secondary'}>
                {taxConfig?.vat_enabled ? 'Enabled' : 'Disabled'}
              </Badge>
            </div>
            <div>
              <p className="text-sm font-medium">Company Status</p>
              <Badge variant={taxConfig?.small_company_status ? 'secondary' : 'default'}>
                {taxConfig?.small_company_status ? 'Small Company' : 'Standard Company'}
              </Badge>
            </div>
          </div>
          
          {taxConfig?.tax_identification_number && (
            <div>
              <p className="text-sm font-medium">Tax Identification Number</p>
              <p className="text-sm text-muted-foreground">{taxConfig.tax_identification_number}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="flex gap-4">
        <Button className="flex-1">
          <FileText className="h-4 w-4 mr-2" />
          Generate VAT Return
        </Button>
        <Button variant="outline" className="flex-1">
          <Calculator className="h-4 w-4 mr-2" />
          VAT Calculator
        </Button>
      </div>
    </div>
  );
};

export default VATDashboard;