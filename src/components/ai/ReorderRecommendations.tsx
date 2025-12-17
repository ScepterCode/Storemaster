/**
 * Reorder Recommendations Component
 * 
 * Shows products that need reordering with AI predictions
 */

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Package, TrendingUp, Calendar } from 'lucide-react';
import { StockPrediction } from '@/types/ai';
import { formatNaira } from '@/lib/formatter';

interface ReorderRecommendationsProps {
  predictions: StockPrediction[];
  onReorder?: (productId: string, quantity: number) => void;
}

export const ReorderRecommendations: React.FC<ReorderRecommendationsProps> = ({
  predictions,
  onReorder,
}) => {
  // Sort by urgency (days until stockout)
  const sortedPredictions = [...predictions].sort(
    (a, b) => (a.days_until_stockout || 999) - (b.days_until_stockout || 999)
  );

  if (sortedPredictions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Reorder Recommendations
          </CardTitle>
          <CardDescription>AI-powered stock predictions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>All products have sufficient stock!</p>
            <p className="text-sm mt-2">No reorders needed at this time.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Reorder Recommendations
        </CardTitle>
        <CardDescription>
          {sortedPredictions.length} product{sortedPredictions.length !== 1 ? 's' : ''} need attention
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {sortedPredictions.map((prediction) => (
            <div
              key={prediction.product_id}
              className="flex items-start justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h4 className="font-semibold">{prediction.product_name}</h4>
                  {prediction.days_until_stockout !== null && (
                    <Badge
                      variant={
                        prediction.days_until_stockout <= 7
                          ? 'destructive'
                          : prediction.days_until_stockout <= 14
                          ? 'default'
                          : 'secondary'
                      }
                    >
                      {prediction.days_until_stockout <= 7 && (
                        <AlertTriangle className="h-3 w-3 mr-1" />
                      )}
                      {prediction.days_until_stockout}d left
                    </Badge>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground mb-2">
                  <div>
                    <span className="font-medium">Current Stock:</span>{' '}
                    {prediction.current_stock} units
                  </div>
                  <div>
                    <span className="font-medium">Suggested Quantity:</span>{' '}
                    {prediction.recommended_reorder_quantity} units
                  </div>
                </div>

                {prediction.recommended_reorder_date && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    <span>
                      Reorder by:{' '}
                      {new Date(prediction.recommended_reorder_date).toLocaleDateString()}
                    </span>
                  </div>
                )}

                <div className="mt-2 text-sm">
                  <span className="font-medium">Confidence:</span>{' '}
                  <span className="text-muted-foreground">
                    {Math.round(prediction.confidence * 100)}%
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-2 ml-4">
                {onReorder && (
                  <Button
                    size="sm"
                    onClick={() =>
                      onReorder(
                        prediction.product_id,
                        prediction.recommended_reorder_quantity
                      )
                    }
                  >
                    Reorder
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
