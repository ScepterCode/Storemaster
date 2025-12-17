/**
 * Seasonal Forecast Service
 * 
 * Predicts seasonal trends and patterns
 * Helps with inventory planning for holidays and peak periods
 */

import { SeasonalForecast, CategoryForecast } from '@/types/ai';
import { geminiService } from './geminiService';

export class SeasonalForecastService {
  /**
   * Generate seasonal forecast
   */
  async generateForecast(
    historicalData: any[],
    targetPeriod: string
  ): Promise<SeasonalForecast> {
    try {
      // Use Gemini AI for intelligent forecasting
      const aiAnalysis = await geminiService.generateSeasonalForecast(
        historicalData,
        targetPeriod
      );

      // Parse AI response and structure data
      const forecast = this.parseAIForecast(aiAnalysis, targetPeriod);

      return forecast;
    } catch (error) {
      console.error('Forecast generation error:', error);
      // Fallback to simple statistical forecast
      return this.simpleStatisticalForecast(historicalData, targetPeriod);
    }
  }

  /**
   * Parse AI forecast response
   */
  private parseAIForecast(aiResponse: string, period: string): SeasonalForecast {
    // Extract key metrics from AI response
    // This is a simplified version - in production, use more sophisticated parsing
    
    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const endDate = new Date(now.getFullYear(), now.getMonth() + 2, 0);

    return {
      period,
      start_date: startDate.toISOString(),
      end_date: endDate.toISOString(),
      predicted_revenue: 0, // Extract from AI response
      predicted_transactions: 0,
      growth_percentage: 0,
      confidence: 0.85,
      top_categories: [],
      peak_days: [],
      recommendations: aiResponse.split('\n').filter((line) => line.trim()),
    };
  }

  /**
   * Simple statistical forecast (fallback)
   */
  private simpleStatisticalForecast(
    historicalData: any[],
    period: string
  ): SeasonalForecast {
    const avgRevenue =
      historicalData.reduce((sum, d) => sum + (d.revenue || 0), 0) / historicalData.length;

    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const endDate = new Date(now.getFullYear(), now.getMonth() + 2, 0);

    return {
      period,
      start_date: startDate.toISOString(),
      end_date: endDate.toISOString(),
      predicted_revenue: avgRevenue * 1.1, // 10% growth assumption
      predicted_transactions: historicalData.length,
      growth_percentage: 10,
      confidence: 0.7,
      top_categories: [],
      peak_days: [],
      recommendations: [
        'Increase inventory by 15% for peak season',
        'Focus on top-selling categories',
        'Plan marketing campaigns for peak days',
      ],
    };
  }
}

export const seasonalForecastService = new SeasonalForecastService();
