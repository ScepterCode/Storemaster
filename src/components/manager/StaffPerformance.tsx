
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { CashierPerformance } from '@/types/manager';
import { useManagerData } from '@/hooks/useManagerData';
import StaffPerformanceDateFilter from './StaffPerformanceDateFilter';
import StaffPerformanceTopPerformer from './StaffPerformanceTopPerformer';
import StaffPerformanceCard from './StaffPerformanceCard';

const StaffPerformance = () => {
  const today = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState(today);
  const { staffPerformance, loading } = useManagerData();

  const availableDates = React.useMemo(() => {
    if (!staffPerformance || !Array.isArray(staffPerformance)) {
      return [today];
    }
    
    const dates = staffPerformance
      .map(p => p.date)
      .filter(date => date && typeof date === 'string' && date.length >= 10)
      .filter(date => !isNaN(new Date(date).getTime()));
    
    const uniqueDates = Array.from(new Set(dates))
      .sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
    
    return uniqueDates.length > 0 ? uniqueDates : [today];
  }, [staffPerformance, today]);

  const todayPerformance = React.useMemo(() => {
    if (!staffPerformance || !Array.isArray(staffPerformance)) {
      return [];
    }
    
    return staffPerformance.filter(p => p.date === selectedDate);
  }, [staffPerformance, selectedDate]);

  const bestPerformer = React.useMemo(() => {
    return todayPerformance.reduce((best, current) => 
      current.totalSales > (best?.totalSales || 0) ? current : best, 
      null as CashierPerformance | null
    );
  }, [todayPerformance]);

  if (loading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="text-center py-8">
            <div className="text-lg">Loading staff performance data...</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <StaffPerformanceDateFilter
        selectedDate={selectedDate}
        onDateChange={setSelectedDate}
        availableDates={availableDates}
      />

      {bestPerformer && (
        <StaffPerformanceTopPerformer
          bestPerformer={bestPerformer}
          selectedDate={selectedDate}
        />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {todayPerformance.length === 0 ? (
          <Card className="lg:col-span-2">
            <CardContent className="text-center py-8">
              <div className="text-muted-foreground">
                No performance data available for {new Date(selectedDate).toLocaleDateString()}
              </div>
            </CardContent>
          </Card>
        ) : (
          todayPerformance.map((performance) => (
            <StaffPerformanceCard
              key={`${performance.cashierId}-${performance.date}`}
              performance={performance}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default StaffPerformance;
