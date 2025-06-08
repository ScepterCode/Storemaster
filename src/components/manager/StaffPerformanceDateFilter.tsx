
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
    console.log('StaffPerformanceDateFilter - Raw availableDates:', availableDates);
    
    if (!Array.isArray(availableDates)) {
      console.log('StaffPerformanceDateFilter - availableDates is not an array');
      return [];
    }
    
    const filtered = availableDates.filter(date => {
      // Basic type and existence checks
      if (!date || typeof date !== 'string') {
        console.log('StaffPerformanceDateFilter - Invalid date (not string):', date);
        return false;
      }
      
      // Check for empty or whitespace-only strings
      const trimmedDate = date.trim();
      if (trimmedDate === '' || trimmedDate.length === 0) {
        console.log('StaffPerformanceDateFilter - Empty date after trim:', date);
        return false;
      }
      
      // Check minimum length for YYYY-MM-DD format
      if (trimmedDate.length < 10) {
        console.log('StaffPerformanceDateFilter - Date too short:', trimmedDate);
        return false;
      }
      
      // Validate date format and ensure it's a valid date
      const dateObj = new Date(trimmedDate);
      if (isNaN(dateObj.getTime())) {
        console.log('StaffPerformanceDateFilter - Invalid date object:', trimmedDate);
        return false;
      }
      
      // Additional check to ensure it's not an invalid date string
      if (trimmedDate.includes('undefined') || trimmedDate.includes('null')) {
        console.log('StaffPerformanceDateFilter - Date contains undefined/null:', trimmedDate);
        return false;
      }
      
      return true;
    }).map(date => date.trim());
    
    console.log('StaffPerformanceDateFilter - Valid dates after filtering:', filtered);
    return filtered;
  }, [availableDates]);

  // Get unique and sorted dates
  const sortedUniqueDates = React.useMemo(() => {
    const uniqueDates = Array.from(new Set(validDates));
    const sorted = uniqueDates.sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
    console.log('StaffPerformanceDateFilter - Final sorted dates:', sorted);
    return sorted;
  }, [validDates]);

  console.log('StaffPerformanceDateFilter - selectedDate:', selectedDate);
  console.log('StaffPerformanceDateFilter - sortedUniqueDates:', sortedUniqueDates);

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
                sortedUniqueDates
                  .filter(date => date && typeof date === 'string' && date.trim() !== '' && date.trim().length >= 10)
                  .map((date, index) => {
                    const safeDate = date.trim();
                    console.log('StaffPerformanceDateFilter - Rendering SelectItem for date:', safeDate, 'index:', index);
                    return (
                      <SelectItem key={`date-${index}-${safeDate}`} value={safeDate}>
                        {new Date(safeDate).toLocaleDateString()}
                      </SelectItem>
                    );
                  })
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
