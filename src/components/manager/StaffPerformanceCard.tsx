
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { DollarSign, ShoppingCart, AlertTriangle } from 'lucide-react';
import { CashierPerformance } from '@/types/manager';
import { formatCurrency } from '@/lib/formatter';

interface StaffPerformanceCardProps {
  performance: CashierPerformance;
}

const StaffPerformanceCard = ({ performance }: StaffPerformanceCardProps) => {
  return (
    <Card key={`${performance.cashierId}-${performance.date}`}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{performance.cashierName}</CardTitle>
          {performance.cashDiscrepancy !== 0 && (
            <Badge variant="destructive" className="flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              Discrepancy
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Sales Metrics */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium">Total Sales</span>
            </div>
            <div className="text-xl font-bold">{formatCurrency(performance.totalSales)}</div>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <ShoppingCart className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium">Transactions</span>
            </div>
            <div className="text-xl font-bold">{performance.transactionCount}</div>
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="space-y-3">
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span>Average Transaction</span>
              <span>{formatCurrency(performance.averageTransactionValue)}</span>
            </div>
            <Progress 
              value={(performance.averageTransactionValue / 1000) * 100} 
              className="h-2" 
            />
          </div>

          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="p-2 bg-muted rounded">
              <div className="text-lg font-semibold">{performance.refundsIssued}</div>
              <div className="text-xs text-muted-foreground">Refunds</div>
            </div>
            <div className="p-2 bg-muted rounded">
              <div className="text-lg font-semibold">{performance.voidsIssued}</div>
              <div className="text-xs text-muted-foreground">Voids</div>
            </div>
            <div className="p-2 bg-muted rounded">
              <div className="text-lg font-semibold">{performance.hoursWorked}h</div>
              <div className="text-xs text-muted-foreground">Hours</div>
            </div>
          </div>
        </div>

        {/* Cash Discrepancy */}
        {performance.cashDiscrepancy !== 0 && (
          <div className="p-3 bg-destructive/10 border border-destructive/20 rounded">
            <div className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-4 w-4" />
              <span className="font-medium">
                Cash Discrepancy: {formatCurrency(Math.abs(performance.cashDiscrepancy))}
                {performance.cashDiscrepancy > 0 ? ' Over' : ' Short'}
              </span>
            </div>
          </div>
        )}

        {/* Top Products */}
        {performance.topSellingProducts && performance.topSellingProducts.length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-2">Top Products Sold</h4>
            <div className="space-y-1">
              {performance.topSellingProducts.slice(0, 3).map((product, index) => (
                <div key={product.productId} className="flex justify-between text-sm">
                  <span>{product.productName}</span>
                  <span className="text-muted-foreground">
                    {product.quantitySold} × {formatCurrency(product.revenue / product.quantitySold)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default StaffPerformanceCard;
