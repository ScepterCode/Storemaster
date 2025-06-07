
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Download, FileText, Table, Calendar } from 'lucide-react';
import { useManagerData } from '@/hooks/useManagerData';
import { useToast } from '@/components/ui/use-toast';

const ReportsExport = () => {
  const [reportType, setReportType] = useState('transactions');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [format, setFormat] = useState('csv');
  const [includeVoided, setIncludeVoided] = useState(false);
  const [includeRefunded, setIncludeRefunded] = useState(true);
  const [selectedCashier, setSelectedCashier] = useState('all_cashiers');
  const [isGenerating, setIsGenerating] = useState(false);

  const { generateReport, staffPerformance, loading } = useManagerData();
  const { toast } = useToast();

  console.log('ReportsExport render - current state:', {
    reportType,
    format,
    selectedCashier,
    loading
  });

  const handleGenerateReport = async () => {
    if (!dateFrom || !dateTo) {
      toast({
        title: "Missing Dates",
        description: "Please select both start and end dates",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    try {
      const reportConfig = {
        type: reportType,
        dateFrom,
        dateTo,
        format,
        filters: {
          includeVoided,
          includeRefunded,
          cashierIds: selectedCashier === 'all_cashiers' ? [] : [selectedCashier]
        }
      };

      await generateReport(reportConfig);
      
      toast({
        title: "Report Generated",
        description: `${reportType} report has been generated and downloaded`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate report. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const reportTypes = [
    { value: 'transactions', label: 'All Transactions', icon: FileText },
    { value: 'staff-performance', label: 'Staff Performance', icon: Table },
    { value: 'daily-summary', label: 'Daily Summary', icon: Calendar },
    { value: 'product-sales', label: 'Product Sales Analysis', icon: Table },
  ];

  // Get unique cashiers from staff performance data
  const availableCashiers = staffPerformance ? 
    Array.from(new Set(staffPerformance.map(p => ({ id: p.cashierId, name: p.cashierName }))))
    .filter(cashier => cashier.id && cashier.name) // Ensure no empty values
    : [];

  if (loading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="text-center py-8">
            <div className="text-lg">Loading reports...</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Generate Reports</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Report Type Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {reportTypes.map(({ value, label, icon: Icon }) => (
              <Card 
                key={value}
                className={`cursor-pointer transition-colors ${
                  reportType === value ? 'ring-2 ring-primary' : 'hover:bg-muted/50'
                }`}
                onClick={() => setReportType(value)}
              >
                <CardContent className="p-4 text-center">
                  <Icon className="h-8 w-8 mx-auto mb-2" />
                  <h3 className="font-medium text-sm">{label}</h3>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date-from">From Date</Label>
              <Input
                id="date-from"
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="date-to">To Date</Label>
              <Input
                id="date-to"
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>
          </div>

          {/* Format Selection */}
          <div className="space-y-2">
            <Label>Export Format</Label>
            <Select value={format} onValueChange={setFormat}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Select format" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="csv">CSV (Excel)</SelectItem>
                <SelectItem value="pdf">PDF Report</SelectItem>
                <SelectItem value="json">JSON Data</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Filters */}
          <div className="space-y-4">
            <Label className="text-base font-medium">Filters</Label>
            
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="include-voided"
                  checked={includeVoided}
                  onCheckedChange={(checked) => setIncludeVoided(checked === true)}
                />
                <Label htmlFor="include-voided">Include voided transactions</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="include-refunded"
                  checked={includeRefunded}
                  onCheckedChange={(checked) => setIncludeRefunded(checked === true)}
                />
                <Label htmlFor="include-refunded">Include refunded transactions</Label>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Specific Cashiers (optional)</Label>
              <Select value={selectedCashier} onValueChange={setSelectedCashier}>
                <SelectTrigger>
                  <SelectValue placeholder="Select cashier" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all_cashiers">All Cashiers</SelectItem>
                  {availableCashiers.map((cashier) => (
                    <SelectItem key={cashier.id} value={cashier.id}>
                      {cashier.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Generate Button */}
          <Button 
            onClick={handleGenerateReport}
            disabled={isGenerating}
            className="w-full"
            size="lg"
          >
            {isGenerating ? (
              "Generating Report..."
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Generate Report
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Reports</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button variant="outline" className="h-auto p-4 flex-col">
              <FileText className="h-6 w-6 mb-2" />
              <span className="font-medium">Today's Summary</span>
              <span className="text-xs text-muted-foreground">All transactions today</span>
            </Button>
            
            <Button variant="outline" className="h-auto p-4 flex-col">
              <Table className="h-6 w-6 mb-2" />
              <span className="font-medium">Staff Performance</span>
              <span className="text-xs text-muted-foreground">This week's performance</span>
            </Button>
            
            <Button variant="outline" className="h-auto p-4 flex-col">
              <Calendar className="h-6 w-6 mb-2" />
              <span className="font-medium">Monthly Report</span>
              <span className="text-xs text-muted-foreground">Complete month overview</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ReportsExport;
