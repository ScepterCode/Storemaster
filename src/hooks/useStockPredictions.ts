/**
 * Stock Predictions Hook
 * 
 * Manages stock predictions for products
 */

import { useState, useEffect } from 'react';
import { useOrganization } from '@/contexts/OrganizationContext';
import { stockPredictionService } from '@/services/stockPredictionService';
import { StockPrediction } from '@/types/ai';
import { Product } from '@/types';

export function useStockPredictions(products: Product[]) {
  const { organization } = useOrganization();
  const [predictions, setPredictions] = useState<StockPrediction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!organization || products.length === 0) {
      setPredictions([]);
      return;
    }

    const generatePredictions = async () => {
      setLoading(true);
      setError(null);

      try {
        const results = await stockPredictionService.predictBatch(
          products,
          organization.id
        );
        setPredictions(results);
      } catch (err) {
        console.error('Error generating predictions:', err);
        setError(err instanceof Error ? err.message : 'Failed to generate predictions');
      } finally {
        setLoading(false);
      }
    };

    generatePredictions();
  }, [products, organization]);

  // Get products that need reordering
  const reorderNeeded = predictions.filter(
    (p) => p.days_until_stockout !== null && p.days_until_stockout <= 30
  );

  // Get critical products (< 7 days)
  const criticalProducts = predictions.filter(
    (p) => p.days_until_stockout !== null && p.days_until_stockout <= 7
  );

  return {
    predictions,
    reorderNeeded,
    criticalProducts,
    loading,
    error,
  };
}
