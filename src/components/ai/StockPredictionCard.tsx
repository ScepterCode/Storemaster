/**
 * Stock Prediction Card
 * 
 * Detailed view of a single product's prediction
 */

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, TrendingDown, Calendar, Package } from 'lucide-react';
import { StockPrediction } from '@/types/ai';

interface StockPredictionCardProps {
  prediction: StockPrediction;
}

export const StockPredictionCard: React.FC<StockPredictionCardProps> = ({
  prediction,
}) => {
  const urgencyLevel =
    prediction.days_until_stockout === null
      ? 'safe'
      : prediction.days_until_stockout <= 7
      ? 'critical'
      : prediction.days_until_stockout <= 14
      ? 'warning'
      : 'attention';

  const urgencyColors = {
    safe: 'text-green-600',
    attention: 'text-blue-600',
    warning: 'text-orange-600',
    critical: 'text-red-600',
  };

  const stockPercentage = prediction.current_stock > 0 
    ? Math.min(100, (prediction.current_stock / (prediction.recommended_reorder_quantity || 1)) * 100)
    : 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle>{prediction.product_name}</CardTitle>
            <CardDescription>AI Stock Prediction</CardDescription>
          </div>
          <Badge
            variant={
              urgencyLevel === 'critical'
                ? 'destructive'
                : urgencyLevel === 'warning'
                ? 'default'
                : 'secondary'
            }
          >
            {urgencyLevel === 'critical' && <AlertTriangle className="h-3 w-3 mr-1" />}
            {urgencyLevel.toUpperCase()}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Stock Level */}
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-muted-foreground">Current Stock</span>
            <span className="font-semibold">{prediction.current_stock} units</span>
          </div>
          <Progress value={stockPercentage} className="h-2" />
        </div>

        {/* Days Until Stockout */}
        {prediction.days_until_stockout !== null && (
          <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
            <TrendingDown className={`h-5 w-5 ${urgencyColors[urgencyLevel]}`} />
            <div className="flex-1">
              <p className="text-sm font-medium">Stock will run out in</p>
              <p className={`text-2xl font-bold ${urgencyColors[urgencyLevel]}`}>
                {prediction.days_until_stockout} days
              </p>
            </div>
          </div>
        )}

        {/* Reorder Recommendation */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground flex items-center gap-2">
              <Package className="h-4 w-4" />
              Suggested Reorder
            </span>
            <span className="font-semibold">
              {prediction.recommended_reorder_quantity} units
            </span>
          </div>

          {prediction.recommended_reorder_date && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Reorder By
              </span>
              <span className="font-semibold">
                {new Date(prediction.recommended_reorder_date).toLocaleDateString()}
              </span>
            </div>
          )}
        </div>

        {/* Confidence */}
        <div className="pt-4 border-t">
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground">Prediction Confidence</span>
            <span className="font-semibold">
              {Math.round(prediction.confidence * 100)}%
            </span>
          </div>
          <Progress
            value={prediction.confidence * 100}
            className="h-1 mt-2"
          />
        </div>
      </CardContent>
    </Card>
  );
};
