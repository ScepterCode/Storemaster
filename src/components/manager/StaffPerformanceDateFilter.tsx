
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
  // Create a safe default date as fallback
  const safeDefaultDate = React.useMemo(() => {
    return new Date().toISOString().split('T')[0];
  }, []);

  // Filter and validate dates with ultimate safety
  const safeDates = React.useMemo(() => {
    console.log('StaffPerformanceDateFilter - Raw availableDates:', availableDates);
    
    if (!Array.isArray(availableDates) || availableDates.length === 0) {
      console.log('StaffPerformanceDateFilter - No valid dates, using default');
      return [safeDefaultDate];
    }
    
    const validDates = availableDates
      .filter(date => {
        // Ultra-strict validation
        if (!date || typeof date !== 'string') return false;
        const trimmed = date.trim();
        if (trimmed.length < 10) return false; // Must be at least YYYY-MM-DD length
        if (trimmed === '' || trimmed === 'undefined' || trimmed === 'null') return false;
        
        // Test if it's a valid date
        const dateObj = new Date(trimmed);
        if (isNaN(dateObj.getTime())) return false;
        
        return true;
      })
      .map(date => date.trim())
      .filter((date, index, arr) => arr.indexOf(date) === index) // Remove duplicates
      .sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
    
    // If no valid dates found, use default
    if (validDates.length === 0) {
      console.log('StaffPerformanceDateFilter - No valid dates after filtering, using default');
      return [safeDefaultDate];
    }
    
    console.log('StaffPerformanceDateFilter - Final safe dates:', validDates);
    return validDates;
  }, [availableDates, safeDefaultDate]);

  // Ensure selectedDate is safe
  const safeSelectedDate = React.useMemo(() => {
    if (!selectedDate || selectedDate.trim() === '' || selectedDate === 'undefined') {
      return safeDates[0] || safeDefaultDate;
    }
    return selectedDate;
  }, [selectedDate, safeDates, safeDefaultDate]);

  console.log('StaffPerformanceDateFilter - safeSelectedDate:', safeSelectedDate);
  console.log('StaffPerformanceDateFilter - safeDates:', safeDates);

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
              {safeDates.map((date, index) => {
                // Triple-check each value before rendering
                const finalSafeValue = date && typeof date === 'string' && date.trim().length >= 10 
                  ? date.trim() 
                  : `safe-date-${index}-${Date.now()}`;
                
                console.log('StaffPerformanceDateFilter - Rendering SelectItem with value:', finalSafeValue);
                
                return (
                  <SelectItem key={`date-option-${index}`} value={finalSafeValue}>
                    {(() => {
                      try {
                        return new Date(date).toLocaleDateString();
                      } catch (error) {
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
