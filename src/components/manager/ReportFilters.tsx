
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
  const formatOptions = [
    { value: 'csv', label: 'CSV (Excel)' },
    { value: 'pdf', label: 'PDF Report' },
    { value: 'json', label: 'JSON Data' }
  ];

  const validCashiers = React.useMemo(() => {
    console.log('ReportFilters - Raw availableCashiers:', availableCashiers);
    
    if (!Array.isArray(availableCashiers)) {
      console.log('ReportFilters - availableCashiers is not an array');
      return [];
    }
    
    const processed = availableCashiers
      .filter(cashier => {
        // Ultra-strict validation
        const isValid = cashier && 
                       cashier.id && 
                       cashier.name && 
                       typeof cashier.id === 'string' && 
                       typeof cashier.name === 'string' &&
                       cashier.id.trim() !== '' &&
                       cashier.name.trim() !== '' &&
                       cashier.id.trim().length > 0 &&
                       cashier.name.trim().length > 0 &&
                       cashier.id.trim() !== 'undefined' &&
                       cashier.name.trim() !== 'undefined' &&
                       cashier.id.trim() !== 'null' &&
                       cashier.name.trim() !== 'null';
        
        if (!isValid) {
          console.log('ReportFilters - Filtering out invalid cashier:', cashier);
        }
        return isValid;
      })
      .map(cashier => ({
        id: cashier.id.trim(),
        name: cashier.name.trim()
      }))
      .filter(cashier => cashier.id.length > 0 && cashier.name.length > 0); // Extra safety
    
    console.log('ReportFilters - Final validCashiers:', processed);
    return processed;
  }, [availableCashiers]);

  const safeFormat = React.useMemo(() => {
    const safe = format && format.trim() && format.trim().length > 0 ? format.trim() : 'csv';
    console.log('ReportFilters - safeFormat:', safe);
    return safe;
  }, [format]);

  const safeCashierValue = React.useMemo(() => {
    const safe = selectedCashier && selectedCashier.trim() && selectedCashier.trim().length > 0 ? selectedCashier.trim() : 'all_cashiers';
    console.log('ReportFilters - safeCashierValue:', safe);
    return safe;
  }, [selectedCashier]);

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
        <Select value={safeFormat} onValueChange={onFormatChange}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Select format" />
          </SelectTrigger>
          <SelectContent>
            {formatOptions.map((option) => {
              // Final safety check before rendering
              if (!option.value || option.value.trim() === '' || option.value.trim().length === 0) {
                console.error('ReportFilters - BLOCKED empty format option from rendering:', option);
                return null;
              }
              
              const safeValue = option.value.trim();
              console.log('ReportFilters - Rendering format SelectItem with value:', safeValue);
              
              return (
                <SelectItem key={safeValue} value={safeValue}>
                  {option.label}
                </SelectItem>
              );
            })}
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
          <Select value={safeCashierValue} onValueChange={onCashierChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select cashier" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all_cashiers">All Cashiers</SelectItem>
              {validCashiers.map((cashier) => {
                // Final safety check before rendering
                if (!cashier.id || cashier.id.trim() === '' || cashier.id.trim().length === 0) {
                  console.error('ReportFilters - BLOCKED empty cashier from rendering:', cashier);
                  return null;
                }
                
                const safeId = cashier.id.trim();
                console.log('ReportFilters - Rendering cashier SelectItem with value:', safeId);
                
                return (
                  <SelectItem key={safeId} value={safeId}>
                    {cashier.name}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
};

export default ReportFilters;
