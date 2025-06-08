
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
  // Filter out any invalid dates
  const validDates = availableDates.filter(date => 
    date && 
    typeof date === 'string' && 
    date.trim() !== '' && 
    date.trim().length >= 10 && // YYYY-MM-DD format
    !isNaN(new Date(date).getTime())
  );

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
          <Select value={selectedDate} onValueChange={onDateChange}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Select date" />
            </SelectTrigger>
            <SelectContent>
              {validDates.length > 0 ? (
                validDates.map(date => (
                  <SelectItem key={date} value={date}>
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
