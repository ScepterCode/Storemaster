
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

  // Ultra-strict date validation with enhanced safety
  const safeDates = React.useMemo(() => {
    console.log('StaffPerformanceDateFilter - Raw availableDates:', availableDates);
    
    if (!Array.isArray(availableDates) || availableDates.length === 0) {
      console.log('StaffPerformanceDateFilter - No valid dates array, using default');
      return [safeDefaultDate];
    }
    
    const validDates = availableDates
      .filter(date => {
        // Ultra-strict validation
        if (!date || typeof date !== 'string') {
          console.log('StaffPerformanceDateFilter - Invalid date type:', date, typeof date);
          return false;
        }
        const trimmed = date.trim();
        if (trimmed.length < 10) {
          console.log('StaffPerformanceDateFilter - Date too short:', trimmed);
          return false;
        }
        if (trimmed === '' || trimmed === 'undefined' || trimmed === 'null' || trimmed.includes('undefined')) {
          console.log('StaffPerformanceDateFilter - Invalid date content:', trimmed);
          return false;
        }
        
        // Test if it's a valid date
        const dateObj = new Date(trimmed);
        if (isNaN(dateObj.getTime())) {
          console.log('StaffPerformanceDateFilter - Invalid date object:', trimmed);
          return false;
        }
        
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
    if (!selectedDate || 
        typeof selectedDate !== 'string' || 
        selectedDate.trim() === '' || 
        selectedDate === 'undefined' || 
        selectedDate === 'null') {
      console.log('StaffPerformanceDateFilter - Invalid selectedDate, using fallback:', selectedDate);
      return safeDates[0] || safeDefaultDate;
    }
    console.log('StaffPerformanceDateFilter - Valid selectedDate:', selectedDate);
    return selectedDate;
  }, [selectedDate, safeDates, safeDefaultDate]);

  console.log('StaffPerformanceDateFilter - Final safeSelectedDate:', safeSelectedDate);
  console.log('StaffPerformanceDateFilter - Final safeDates:', safeDates);

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
              {safeDates.length > 0 ? safeDates.map((date, index) => {
                // Ultra-strict validation before rendering each SelectItem
                const finalSafeValue = date && 
                                     typeof date === 'string' && 
                                     date.trim().length >= 10 
                  ? date.trim() 
                  : `safe-date-fallback-${index}-${Date.now()}`;
                
                console.log('StaffPerformanceDateFilter - About to render SelectItem with value:', finalSafeValue, 'original:', date);
                
                // Additional validation - skip if somehow still empty
                if (!finalSafeValue || finalSafeValue.trim() === '') {
                  console.error('StaffPerformanceDateFilter - CRITICAL: Empty value detected for SelectItem:', finalSafeValue, date);
                  return null;
                }
                
                return (
                  <SelectItem key={`date-option-${index}-${finalSafeValue}`} value={finalSafeValue}>
                    {(() => {
                      try {
                        return new Date(date).toLocaleDateString();
                      } catch (error) {
                        console.error('StaffPerformanceDateFilter - Date formatting error:', error);
                        return `Date ${index + 1}`;
                      }
                    })()}
                  </SelectItem>
                );
              }).filter(Boolean) : (
                <SelectItem key="no-dates" value={safeDefaultDate}>
                  {new Date().toLocaleDateString()}
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
