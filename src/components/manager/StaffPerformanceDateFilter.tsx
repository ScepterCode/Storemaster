
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
      console.log('StaffPerformanceDateFilter - Using default date:', defaultDate);
      return [defaultDate];
    }
    
    const processed = availableDates
      .filter(date => {
        // Ultra-strict validation
        const isValid = date && 
                       typeof date === 'string' && 
                       date.trim() !== '' && 
                       date.trim().length >= 10 && 
                       !isNaN(new Date(date.trim()).getTime()) &&
                       date.trim() !== 'undefined' &&
                       date.trim() !== 'null';
        
        if (!isValid) {
          console.log('StaffPerformanceDateFilter - Filtering out invalid date:', date);
        }
        return isValid;
      })
      .map(date => date.trim())
      .filter(date => date.length > 0); // Extra safety check
    
    const unique = Array.from(new Set(processed))
      .sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
    
    const result = unique.length > 0 ? unique : [defaultDate];
    console.log('StaffPerformanceDateFilter - Final validDates:', result);
    
    return result;
  }, [availableDates, defaultDate]);

  const safeSelectedDate = React.useMemo(() => {
    const safe = selectedDate && selectedDate.trim() && selectedDate.trim().length > 0 ? selectedDate.trim() : validDates[0];
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
                // Final safety check before rendering
                if (!date || date.trim() === '' || date.trim().length === 0) {
                  console.error('StaffPerformanceDateFilter - BLOCKED empty date from rendering:', date);
                  return null;
                }
                
                const safeDate = date.trim();
                console.log('StaffPerformanceDateFilter - Rendering SelectItem with value:', safeDate);
                
                return (
                  <SelectItem key={`date-${index}-${safeDate}`} value={safeDate}>
                    {new Date(safeDate).toLocaleDateString()}
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
