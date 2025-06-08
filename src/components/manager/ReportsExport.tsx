
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { useManagerData } from '@/hooks/useManagerData';
import { useToast } from '@/components/ui/use-toast';
import ReportTypeSelector from './ReportTypeSelector';
import ReportFilters from './ReportFilters';
import QuickReports from './QuickReports';

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
    loading,
    staffPerformanceCount: staffPerformance?.length || 0
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

  // Get unique cashiers from staff performance data with strict validation
  const availableCashiers = React.useMemo(() => {
    if (!staffPerformance || !Array.isArray(staffPerformance)) {
      return [];
    }
    
    const uniqueCashiers = new Map();
    
    staffPerformance.forEach(p => {
      // Strict validation for cashier data
      if (p.cashierId && 
          p.cashierName && 
          typeof p.cashierId === 'string' &&
          typeof p.cashierName === 'string' &&
          p.cashierId.trim() !== '' && 
          p.cashierName.trim() !== '' &&
          p.cashierId !== 'unknown' && 
          p.cashierName !== 'Unknown Cashier' &&
          p.cashierId.length > 0 &&
          p.cashierName.length > 0) {
        uniqueCashiers.set(p.cashierId, {
          id: p.cashierId.trim(),
          name: p.cashierName.trim()
        });
      }
    });
    
    const cashiers = Array.from(uniqueCashiers.values());
    console.log('Available cashiers:', cashiers);
    return cashiers;
  }, [staffPerformance]);

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
          <ReportTypeSelector
            selectedType={reportType}
            onTypeChange={setReportType}
          />

          {/* Filters */}
          <ReportFilters
            dateFrom={dateFrom}
            dateTo={dateTo}
            format={format}
            includeVoided={includeVoided}
            includeRefunded={includeRefunded}
            selectedCashier={selectedCashier}
            availableCashiers={availableCashiers}
            onDateFromChange={setDateFrom}
            onDateToChange={setDateTo}
            onFormatChange={setFormat}
            onIncludeVoidedChange={setIncludeVoided}
            onIncludeRefundedChange={setIncludeRefunded}
            onCashierChange={setSelectedCashier}
          />

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
      <QuickReports />
    </div>
  );
};

export default ReportsExport;
