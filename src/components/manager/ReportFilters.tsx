
import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';

interface CashierData {
  id: string;
  name: string;
}

interface ReportFiltersProps {
  dateFrom: string;
  dateTo: string;
  format: string;
  includeVoided: boolean;
  includeRefunded: boolean;
  selectedCashier: string;
  availableCashiers: CashierData[];
  onDateFromChange: (date: string) => void;
  onDateToChange: (date: string) => void;
  onFormatChange: (format: string) => void;
  onIncludeVoidedChange: (checked: boolean) => void;
  onIncludeRefundedChange: (checked: boolean) => void;
  onCashierChange: (cashierId: string) => void;
}

const ReportFilters = ({
  dateFrom,
  dateTo,
  format,
  includeVoided,
  includeRefunded,
  selectedCashier,
  availableCashiers,
  onDateFromChange,
  onDateToChange,
  onFormatChange,
  onIncludeVoidedChange,
  onIncludeRefundedChange,
  onCashierChange
}: ReportFiltersProps) => {
  // Filter out any cashiers with empty or invalid IDs with more strict validation
  const validCashiers = React.useMemo(() => {
    if (!Array.isArray(availableCashiers)) return [];
    
    return availableCashiers.filter(cashier => {
      // Ensure cashier object exists and has required properties
      if (!cashier || typeof cashier !== 'object') return false;
      
      // Validate ID
      if (!cashier.id || 
          typeof cashier.id !== 'string' || 
          cashier.id.trim() === '' ||
          cashier.id.length === 0) return false;
      
      // Validate name
      if (!cashier.name || 
          typeof cashier.name !== 'string' || 
          cashier.name.trim() === '' ||
          cashier.name.length === 0) return false;
      
      // Additional checks for specific invalid values
      if (cashier.id === 'unknown' || 
          cashier.name === 'Unknown Cashier' ||
          cashier.id.includes('undefined') ||
          cashier.name.includes('undefined')) return false;
      
      return true;
    });
  }, [availableCashiers]);

  return (
    <div className="space-y-6">
      {/* Date Range */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="date-from">From Date</Label>
          <Input
            id="date-from"
            type="date"
            value={dateFrom}
            onChange={(e) => onDateFromChange(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="date-to">To Date</Label>
          <Input
            id="date-to"
            type="date"
            value={dateTo}
            onChange={(e) => onDateToChange(e.target.value)}
          />
        </div>
      </div>

      {/* Format Selection */}
      <div className="space-y-2">
        <Label>Export Format</Label>
        <Select value={format || 'csv'} onValueChange={onFormatChange}>
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
              onCheckedChange={(checked) => onIncludeVoidedChange(checked === true)}
            />
            <Label htmlFor="include-voided">Include voided transactions</Label>
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="include-refunded"
              checked={includeRefunded}
              onCheckedChange={(checked) => onIncludeRefundedChange(checked === true)}
            />
            <Label htmlFor="include-refunded">Include refunded transactions</Label>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Specific Cashiers (optional)</Label>
          <Select value={selectedCashier || 'all_cashiers'} onValueChange={onCashierChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select cashier" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all_cashiers">All Cashiers</SelectItem>
              {validCashiers.length > 0 ? (
                validCashiers.map((cashier) => (
                  <SelectItem key={`cashier-${cashier.id}`} value={cashier.id}>
                    {cashier.name}
                  </SelectItem>
                ))
              ) : (
                <SelectItem value="no_cashiers_available" disabled>
                  No cashiers available
                </SelectItem>
              )}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
};

export default ReportFilters;
