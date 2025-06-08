
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
  // Safe cashiers with ultimate validation
  const safeCashiers = React.useMemo(() => {
    console.log('ReportFilters - Raw availableCashiers:', availableCashiers);
    
    if (!Array.isArray(availableCashiers)) {
      return [];
    }
    
    const validCashiers = availableCashiers
      .filter(cashier => {
        // Ultra-strict validation
        if (!cashier || typeof cashier !== 'object') return false;
        if (!cashier.id || typeof cashier.id !== 'string') return false;
        if (!cashier.name || typeof cashier.name !== 'string') return false;
        
        const safeId = cashier.id.trim();
        const safeName = cashier.name.trim();
        
        if (safeId === '' || safeName === '') return false;
        if (safeId === 'unknown' || safeName === 'Unknown Cashier') return false;
        if (safeId.includes('undefined') || safeName.includes('undefined')) return false;
        
        return true;
      })
      .map(cashier => ({
        id: cashier.id.trim(),
        name: cashier.name.trim()
      }))
      .filter((cashier, index, arr) => 
        arr.findIndex(c => c.id === cashier.id) === index // Remove duplicates
      );
    
    console.log('ReportFilters - Valid cashiers after filtering:', validCashiers);
    return validCashiers;
  }, [availableCashiers]);

  // Safe format options - always guaranteed to have valid values
  const safeFormatOptions = [
    { value: 'csv', label: 'CSV (Excel)' },
    { value: 'pdf', label: 'PDF Report' },
    { value: 'json', label: 'JSON Data' }
  ];

  // Ensure safe format value
  const safeFormat = React.useMemo(() => {
    if (!format || format.trim() === '' || format === 'undefined') {
      return 'csv';
    }
    return format;
  }, [format]);

  // Ensure safe cashier value
  const safeCashierValue = React.useMemo(() => {
    if (!selectedCashier || selectedCashier.trim() === '' || selectedCashier === 'undefined') {
      return 'all_cashiers';
    }
    return selectedCashier;
  }, [selectedCashier]);

  console.log('ReportFilters - safeFormat:', safeFormat);
  console.log('ReportFilters - safeCashierValue:', safeCashierValue);

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
            {safeFormatOptions.map(option => {
              // Double-check value is safe
              const finalValue = option.value && option.value.trim() !== '' 
                ? option.value 
                : `format-${option.label.toLowerCase().replace(/[^a-z]/g, '')}`;
              
              console.log('ReportFilters - Rendering format SelectItem with value:', finalValue);
              
              return (
                <SelectItem key={`format-${option.value}`} value={finalValue}>
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
              {safeCashiers.map((cashier, index) => {
                // Triple-check each value before rendering
                const finalSafeId = cashier.id && cashier.id.trim() !== '' 
                  ? cashier.id 
                  : `cashier-${index}-${Date.now()}`;
                
                console.log('ReportFilters - Rendering cashier SelectItem with value:', finalSafeId);
                
                return (
                  <SelectItem key={`cashier-${index}`} value={finalSafeId}>
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
