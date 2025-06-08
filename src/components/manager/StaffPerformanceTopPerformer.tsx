
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp } from 'lucide-react';
import { CashierPerformance } from '@/types/manager';
import { formatCurrency } from '@/lib/formatter';

interface StaffPerformanceTopPerformerProps {
  bestPerformer: CashierPerformance;
  selectedDate: string;
}

const StaffPerformanceTopPerformer = ({ 
  bestPerformer, 
  selectedDate 
}: StaffPerformanceTopPerformerProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Top Performer - {new Date(selectedDate).toLocaleDateString()}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">{bestPerformer.cashierName}</h3>
            <p className="text-sm text-muted-foreground">
              {bestPerformer.transactionCount} transactions • {bestPerformer.hoursWorked}h worked
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold">{formatCurrency(bestPerformer.totalSales)}</div>
            <p className="text-sm text-muted-foreground">
              Avg: {formatCurrency(bestPerformer.averageTransactionValue)}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default StaffPerformanceTopPerformer;
