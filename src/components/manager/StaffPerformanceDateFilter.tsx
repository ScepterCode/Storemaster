
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface StaffPerformanceDateFilterProps {
  selectedDate: string;
  onDateChange: (date: string) => void;
  availableDates: string[];
}

const StaffPerformanceDateFilter = ({ 
  selectedDate, 
  onDateChange, 
  availableDates 
}: StaffPerformanceDateFilterProps) => {
  const defaultDate = new Date().toISOString().split('T')[0];

  const validDates = React.useMemo(() => {
    console.log('StaffPerformanceDateFilter - Raw availableDates:', availableDates);
    
    if (!Array.isArray(availableDates) || availableDates.length === 0) {
      console.log('StaffPerformanceDateFilter - Using default date');
      return [defaultDate];
    }
    
    const processed = availableDates
      .filter(date => {
        const isValid = date && 
                       typeof date === 'string' && 
                       date.trim().length >= 10 && 
                       !isNaN(new Date(date).getTime());
        if (!isValid) {
          console.log('StaffPerformanceDateFilter - Invalid date filtered out:', date);
        }
        return isValid;
      })
      .map(date => date.trim());
    
    const uniqueDates = Array.from(new Set(processed))
      .sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
    
    console.log('StaffPerformanceDateFilter - Final validDates:', uniqueDates);
    return uniqueDates.length > 0 ? uniqueDates : [defaultDate];
  }, [availableDates, defaultDate]);

  const safeSelectedDate = React.useMemo(() => {
    const safe = selectedDate && selectedDate.trim() ? selectedDate : validDates[0];
    console.log('StaffPerformanceDateFilter - safeSelectedDate:', safe);
    return safe;
  }, [selectedDate, validDates]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Performance Overview</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4">
          <label htmlFor="date-select" className="text-sm font-medium">
            Select Date:
          </label>
          <Select value={safeSelectedDate} onValueChange={onDateChange}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Select date" />
            </SelectTrigger>
            <SelectContent>
              {validDates.map((date, index) => {
                // Final bulletproof validation - absolutely no empty strings
                const finalValue = (date && date.trim()) || `fallback-date-${index}-${Date.now()}`;
                
                console.log(`StaffPerformanceDateFilter - SelectItem ${index}: originalDate="${date}", finalValue="${finalValue}"`);
                
                // Double check - if somehow still empty, skip this item entirely
                if (!finalValue || finalValue.trim() === '') {
                  console.error('StaffPerformanceDateFilter - CRITICAL: Empty value detected, skipping item');
                  return null;
                }
                
                return (
                  <SelectItem key={`date-${index}-${Date.now()}`} value={finalValue}>
                    {(() => {
                      try {
                        return new Date(date).toLocaleDateString();
                      } catch {
                        return `Date ${index + 1}`;
                      }
                    })()}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
};

export default StaffPerformanceDateFilter;
