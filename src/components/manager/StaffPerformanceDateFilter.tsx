
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
    if (!Array.isArray(availableDates) || availableDates.length === 0) {
      return [defaultDate];
    }
    
    const filtered = availableDates
      .filter(date => date && typeof date === 'string' && date.trim().length >= 10)
      .map(date => date.trim())
      .filter(date => !isNaN(new Date(date).getTime()));
    
    const unique = Array.from(new Set(filtered))
      .sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
    
    return unique.length > 0 ? unique : [defaultDate];
  }, [availableDates, defaultDate]);

  const safeSelectedDate = selectedDate && selectedDate.trim() ? selectedDate : validDates[0];

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
              {validDates.map((date, index) => (
                <SelectItem key={`date-${index}`} value={date}>
                  {new Date(date).toLocaleDateString()}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
};

export default StaffPerformanceDateFilter;
