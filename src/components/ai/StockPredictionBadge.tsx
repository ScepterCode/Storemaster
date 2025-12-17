/**
 * Stock Prediction Badge
 * 
 * Shows prediction status on product cards
 */

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { StockPrediction } from '@/types/ai';

interface StockPredictionBadgeProps {
  prediction: StockPrediction | null;
  size?: 'sm' | 'md' | 'lg';
}

export const StockPredictionBadge: React.FC<StockPredictionBadgeProps> = ({
  prediction,
  size = 'md',
}) => {
  if (!prediction) return null;

  const { days_until_stockout } = prediction;

  if (days_until_stockout === null || days_until_stockout > 30) {
    return (
      <Badge variant="outline" className="gap-1">
        <CheckCircle className="h-3 w-3" />
        <span>Stock OK</span>
      </Badge>
    );
  }

  if (days_until_stockout <= 7) {
    return (
      <Badge variant="destructive" className="gap-1">
        <AlertTriangle className="h-3 w-3" />
        <span>Critical: {days_until_stockout}d</span>
      </Badge>
    );
  }

  if (days_until_stockout <= 14) {
    return (
      <Badge variant="default" className="gap-1 bg-orange-500">
        <Clock className="h-3 w-3" />
        <span>Low: {days_until_stockout}d</span>
      </Badge>
    );
  }

  return (
    <Badge variant="secondary" className="gap-1">
      <Clock className="h-3 w-3" />
      <span>Reorder: {days_until_stockout}d</span>
    </Badge>
  );
};
