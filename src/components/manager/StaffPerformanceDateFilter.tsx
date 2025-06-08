
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
  // Filter out any invalid dates with comprehensive validation
  const validDates = React.useMemo(() => {
    if (!Array.isArray(availableDates)) return [];
    
    return availableDates.filter(date => {
      // Basic type and existence checks
      if (!date || typeof date !== 'string') return false;
      
      // Check for empty or whitespace-only strings
      const trimmedDate = date.trim();
      if (trimmedDate === '' || trimmedDate.length === 0) return false;
      
      // Check minimum length for YYYY-MM-DD format
      if (trimmedDate.length < 10) return false;
      
      // Validate date format and ensure it's a valid date
      const dateObj = new Date(trimmedDate);
      if (isNaN(dateObj.getTime())) return false;
      
      // Additional check to ensure it's not an invalid date string
      if (trimmedDate.includes('undefined') || trimmedDate.includes('null')) return false;
      
      return true;
    }).map(date => date.trim());
  }, [availableDates]);

  // Get unique and sorted dates
  const sortedUniqueDates = React.useMemo(() => {
    const uniqueDates = Array.from(new Set(validDates));
    return uniqueDates.sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
  }, [validDates]);

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
          <Select value={selectedDate || ''} onValueChange={onDateChange}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Select date" />
            </SelectTrigger>
            <SelectContent>
              {sortedUniqueDates.length > 0 ? (
                sortedUniqueDates.map((date, index) => (
                  <SelectItem key={`date-${index}-${date}`} value={date}>
                    {new Date(date).toLocaleDateString()}
                  </SelectItem>
                ))
              ) : (
                <SelectItem value="no_data_available" disabled>
                  No performance data available
                </SelectItem>
              )}
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
};

export default StaffPerformanceDateFilter;
