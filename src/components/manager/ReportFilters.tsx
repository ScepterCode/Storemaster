
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
  // Ultra-safe cashiers with enhanced validation
  const safeCashiers = React.useMemo(() => {
    console.log('ReportFilters - Raw availableCashiers:', availableCashiers);
    
    if (!Array.isArray(availableCashiers)) {
      console.log('ReportFilters - availableCashiers is not an array');
      return [];
    }
    
    const validCashiers = availableCashiers
      .filter(cashier => {
        // Ultra-strict validation
        if (!cashier || typeof cashier !== 'object') {
          console.log('ReportFilters - Invalid cashier object:', cashier);
          return false;
        }
        if (!cashier.id || typeof cashier.id !== 'string') {
          console.log('ReportFilters - Invalid cashier id:', cashier.id);
          return false;
        }
        if (!cashier.name || typeof cashier.name !== 'string') {
          console.log('ReportFilters - Invalid cashier name:', cashier.name);
          return false;
        }
        
        const safeId = cashier.id.trim();
        const safeName = cashier.name.trim();
        
        if (safeId === '' || safeName === '') {
          console.log('ReportFilters - Empty cashier data:', safeId, safeName);
          return false;
        }
        if (safeId === 'unknown' || safeName === 'Unknown Cashier') {
          console.log('ReportFilters - Unknown cashier data:', safeId, safeName);
          return false;
        }
        if (safeId.includes('undefined') || safeName.includes('undefined') || 
            safeId.includes('null') || safeName.includes('null')) {
          console.log('ReportFilters - Contains undefined/null:', safeId, safeName);
          return false;
        }
        
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

  // Ultra-safe format options with guaranteed valid values
  const safeFormatOptions = React.useMemo(() => {
    const baseOptions = [
      { value: 'csv', label: 'CSV (Excel)' },
      { value: 'pdf', label: 'PDF Report' },
      { value: 'json', label: 'JSON Data' }
    ];

    // Validate each option
    return baseOptions.filter(option => {
      const isValid = option.value && 
                     typeof option.value === 'string' && 
                     option.value.trim().length > 0 && 
                     option.value !== 'undefined' && 
                     option.value !== 'null';
      console.log('ReportFilters - Format option validation:', option.value, 'isValid:', isValid);
      return isValid;
    });
  }, []);

  // Ensure safe format value
  const safeFormat = React.useMemo(() => {
    if (!format || 
        typeof format !== 'string' || 
        format.trim() === '' || 
        format === 'undefined' || 
        format === 'null') {
      console.log('ReportFilters - Invalid format, using default:', format);
      return 'csv';
    }
    console.log('ReportFilters - Valid format:', format);
    return format;
  }, [format]);

  // Ensure safe cashier value
  const safeCashierValue = React.useMemo(() => {
    if (!selectedCashier || 
        typeof selectedCashier !== 'string' || 
        selectedCashier.trim() === '' || 
        selectedCashier === 'undefined' || 
        selectedCashier === 'null') {
      console.log('ReportFilters - Invalid selectedCashier, using default:', selectedCashier);
      return 'all_cashiers';
    }
    console.log('ReportFilters - Valid selectedCashier:', selectedCashier);
    return selectedCashier;
  }, [selectedCashier]);

  console.log('ReportFilters - Final safeFormat:', safeFormat);
  console.log('ReportFilters - Final safeCashierValue:', safeCashierValue);

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
            {safeFormatOptions.length > 0 ? safeFormatOptions.map((option, index) => {
              // Ultra-strict validation before rendering
              const finalValue = option.value && 
                               typeof option.value === 'string' && 
                               option.value.trim().length > 0 
                ? option.value.trim() 
                : `fallback-format-${index}-${Date.now()}`;
              
              console.log('ReportFilters - About to render format SelectItem with value:', finalValue, 'original:', option.value);
              
              // Additional validation - skip if somehow still empty
              if (!finalValue || finalValue.trim() === '') {
                console.error('ReportFilters - CRITICAL: Empty value detected for format SelectItem:', finalValue, option);
                return null;
              }
              
              return (
                <SelectItem key={`format-option-${index}-${finalValue}`} value={finalValue}>
                  {option.label || `Format ${index + 1}`}
                </SelectItem>
              );
            }).filter(Boolean) : (
              <SelectItem key="default-format" value="csv">
                CSV (Excel)
              </SelectItem>
            )}
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
              <SelectItem key="all-cashiers-option" value="all_cashiers">All Cashiers</SelectItem>
              {safeCashiers.length > 0 ? safeCashiers.map((cashier, index) => {
                // Ultra-strict validation before rendering each cashier
                const finalSafeId = cashier.id && 
                                  typeof cashier.id === 'string' && 
                                  cashier.id.trim().length > 0 
                  ? cashier.id.trim() 
                  : `fallback-cashier-${index}-${Date.now()}`;
                
                console.log('ReportFilters - About to render cashier SelectItem with value:', finalSafeId, 'original:', cashier.id);
                
                // Additional validation - skip if somehow still empty
                if (!finalSafeId || finalSafeId.trim() === '') {
                  console.error('ReportFilters - CRITICAL: Empty value detected for cashier SelectItem:', finalSafeId, cashier);
                  return null;
                }
                
                return (
                  <SelectItem key={`cashier-option-${index}-${finalSafeId}`} value={finalSafeId}>
                    {cashier.name || `Cashier ${index + 1}`}
                  </SelectItem>
                );
              }).filter(Boolean) : null}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
};

export default ReportFilters;
