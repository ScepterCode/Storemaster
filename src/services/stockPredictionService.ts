/**
 * Stock Prediction Service
 * 
 * Uses local ML model implementation - no external service needed!
 * Provides stock reorder predictions and recommendations
 */

import { supabase } from '@/integrations/supabase/client';
import { Product } from '@/types';
import { StockPrediction } from '@/types/ai';
import { stockPredictionModel, ProductFeatures } from '@/lib/stockPredictionModel';

export class StockPredictionService {
  /**
   * Predict if a product needs reordering using local ML model
   */
  async predictReorder(
    product: Product,
    organizationId: string,
    minimumStockLevel: number = 10
  ): Promise<StockPrediction> {
    try {
      // Prepare product features for ML model
      const features: ProductFeatures = {
        cost_price: product.unitPrice,
        selling_price: product.unitPrice * 1.3, // Assume 30% markup
        current_stock: product.quantity,
        minimum_stock_level: minimumStockLevel,
        reorder_frequency: 30, // Default 30 days
        category: product.categoryName || 'General',
        brand: 'Generic',
        supplier: 'Default',
      };

      // Run prediction locally (no API call needed!)
      const prediction = stockPredictionModel.predict(features);

      // Calculate additional insights
      const daysUntilStockout = stockPredictionModel.calculateStockoutDays(features);
      const suggestedQuantity = stockPredictionModel.calculateReorderQuantity(features);

      // Log prediction for analytics
      await this.logPrediction(organizationId, product.id, {
        reorder_required: prediction.reorder_required,
        confidence: prediction.confidence,
        reasoning: prediction.reasoning,
      });

      // Transform to StockPrediction format
      return {
        product_id: product.id,
        product_name: product.name,
        current_stock: product.quantity,
        predicted_stockout_date: this.calculateStockoutDate(daysUntilStockout),
        days_until_stockout: daysUntilStockout,
        recommended_reorder_quantity: suggestedQuantity,
        recommended_reorder_date: this.calculateReorderDate(daysUntilStockout),
        confidence: prediction.confidence,
        forecast: [], // Can be populated with detailed forecast if needed
      };
    } catch (error) {
      console.error('Stock prediction error:', error);
      throw error;
    }
  }

  /**
   * Predict reorder requirements for multiple products
   */
  async predictBatch(
    products: Product[],
    organizationId: string
  ): Promise<StockPrediction[]> {
    const predictions = await Promise.all(
      products.map((product) => this.predictReorder(product, organizationId))
    );

    return predictions;
  }

  /**
   * Get products that need reordering
   */
  async getReorderRecommendations(
    products: Product[],
    organizationId: string
  ): Promise<StockPrediction[]> {
    const predictions = await this.predictBatch(products, organizationId);

    // Filter to only products that need reordering
    return predictions
      .filter((p) => p.days_until_stockout !== null && p.days_until_stockout <= 30)
      .sort((a, b) => (a.days_until_stockout || 999) - (b.days_until_stockout || 999));
  }

  /**
   * Calculate stockout date from days
   */
  private calculateStockoutDate(days: number | null): string | null {
    if (days === null || days <= 0) return null;

    const date = new Date();
    date.setDate(date.getDate() + days);
    return date.toISOString();
  }

  /**
   * Calculate recommended reorder date (7 days before stockout)
   */
  private calculateReorderDate(daysUntilStockout: number | null): string {
    const reorderBuffer = 7; // Days before stockout to reorder
    const days = Math.max(0, (daysUntilStockout || 0) - reorderBuffer);

    const date = new Date();
    date.setDate(date.getDate() + days);
    return date.toISOString();
  }

  /**
   * Log prediction to database for analytics
   */
  private async logPrediction(
    organizationId: string,
    productId: string,
    prediction: {
      reorder_required: boolean;
      confidence: number;
      reasoning: string;
    }
  ): Promise<void> {
    try {
      await supabase.from('ai_predictions').insert({
        organization_id: organizationId,
        product_id: productId,
        prediction_type: 'stock_reorder',
        prediction_data: prediction,
        confidence_score: prediction.confidence,
        created_at: new Date().toISOString(),
      });
    } catch (error) {
      // Log error but don't throw - prediction logging is not critical
      console.error('Error logging prediction:', error);
    }
  }

  /**
   * Get prediction history for a product
   */
  async getPredictionHistory(
    productId: string,
    organizationId: string,
    limit: number = 10
  ): Promise<any[]> {
    const { data, error } = await supabase
      .from('ai_predictions')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('product_id', productId)
      .eq('prediction_type', 'stock_reorder')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching prediction history:', error);
      return [];
    }

    return data || [];
  }
}

// Export singleton instance
export const stockPredictionService = new StockPredictionService();
