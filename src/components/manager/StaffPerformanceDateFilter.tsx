
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
  // Default fallback date
  const defaultDate = new Date().toISOString().split('T')[0];

  // Process available dates with bulletproof validation
  const validDates = React.useMemo(() => {
    if (!Array.isArray(availableDates) || availableDates.length === 0) {
      return [defaultDate];
    }
    
    const filtered = availableDates
      .filter(date => date && typeof date === 'string' && date.trim().length >= 8)
      .map(date => date.trim())
      .filter(date => {
        try {
          const dateObj = new Date(date);
          return !isNaN(dateObj.getTime());
        } catch {
          return false;
        }
      });
    
    return filtered.length > 0 ? filtered : [defaultDate];
  }, [availableDates, defaultDate]);

  // Ensure selected date is valid
  const safeSelectedDate = React.useMemo(() => {
    if (!selectedDate || typeof selectedDate !== 'string' || selectedDate.trim() === '') {
      return validDates[0];
    }
    return selectedDate;
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
                // Final safety check - ensure value is never empty
                const safeValue = date && date.trim() ? date.trim() : `date-${index}-${Date.now()}`;
                
                return (
                  <SelectItem key={`date-${index}`} value={safeValue}>
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
