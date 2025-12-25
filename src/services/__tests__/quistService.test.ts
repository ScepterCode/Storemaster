/**
 * Unit tests for Quist Service
 * Tests intent classification, query execution, and response generation
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  classifyIntent,
  executeQuery,
  generateResponse,
  formatResponse,
  hasQueryMapping,
  getQueryExecutor,
  getSupportedIntents,
} from '../quistService';
import type { QuistIntent, ExtractedParams, QuistConversationContext } from '@/types/quist';

// Mock geminiService
vi.mock('../geminiService', () => ({
  geminiService: {
    generateContent: vi.fn(),
  },
}));

// Mock quistQueries
vi.mock('../quistQueries', () => ({
  getTopSellingProducts: vi.fn(),
  getTodayRevenue: vi.fn(),
  getMonthlyProfit: vi.fn(),
  getLowStockProducts: vi.fn(),
  getSalesTrend: vi.fn(),
}));

describe('Quist Service', () => {
  const mockOrgId = 'test-org-123';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Intent Classification', () => {
    it('should classify top selling products intent', async () => {
      const { geminiService } = await import('../geminiService');
      vi.mocked(geminiService.generateContent).mockResolvedValueOnce({
        text: JSON.stringify({
          intent: 'top_selling_products',
          params: { date_range: 'this_month', limit: 5 },
          confidence: 0.95,
        }),
        usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
      });

      const result = await classifyIntent('What are my best selling products?');

      expect(result.intent).toBe('top_selling_products');
      expect(result.params.dateRange).toBe('this_month');
      expect(result.params.limit).toBe(5);
      expect(result.confidence).toBe(0.95);
    });

    it('should classify today revenue intent', async () => {
      const { geminiService } = await import('../geminiService');
      vi.mocked(geminiService.generateContent).mockResolvedValueOnce({
        text: JSON.stringify({
          intent: 'today_revenue',
          params: { date_range: 'today' },
          confidence: 0.9,
        }),
        usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
      });

      const result = await classifyIntent('How much did I make today?');

      expect(result.intent).toBe('today_revenue');
      expect(result.confidence).toBe(0.9);
    });

    it('should classify low stock products intent', async () => {
      const { geminiService } = await import('../geminiService');
      vi.mocked(geminiService.generateContent).mockResolvedValueOnce({
        text: JSON.stringify({
          intent: 'low_stock_products',
          params: { threshold: 10 },
          confidence: 0.88,
        }),
        usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
      });

      const result = await classifyIntent('Which products are running low?');

      expect(result.intent).toBe('low_stock_products');
      expect(result.params.threshold).toBe(10);
    });

    it('should return unknown intent for unrecognized queries', async () => {
      const { geminiService } = await import('../geminiService');
      vi.mocked(geminiService.generateContent).mockResolvedValueOnce({
        text: JSON.stringify({
          intent: 'unknown',
          params: {},
          confidence: 0.2,
        }),
        usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
      });

      const result = await classifyIntent('What is the meaning of life?');

      expect(result.intent).toBe('unknown');
    });

    it('should handle malformed AI response gracefully', async () => {
      const { geminiService } = await import('../geminiService');
      vi.mocked(geminiService.generateContent).mockResolvedValueOnce({
        text: 'This is not valid JSON',
        usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
      });

      const result = await classifyIntent('Test query');

      expect(result.intent).toBe('unknown');
      expect(result.confidence).toBe(0);
    });

    it('should handle AI service errors gracefully', async () => {
      const { geminiService } = await import('../geminiService');
      vi.mocked(geminiService.generateContent).mockRejectedValueOnce(
        new Error('API error')
      );

      const result = await classifyIntent('Test query');

      expect(result.intent).toBe('unknown');
      expect(result.confidence).toBe(0);
    });

    it('should handle follow-up queries with context', async () => {
      const { geminiService } = await import('../geminiService');
      vi.mocked(geminiService.generateContent).mockResolvedValueOnce({
        text: JSON.stringify({
          intent: 'top_selling_products',
          params: { date_range: 'last_month' },
          confidence: 0.85,
          is_follow_up: true,
        }),
        usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
      });

      const context: QuistConversationContext = {
        sessionId: 'test-session',
        messages: [],
        lastQuery: {
          intent: 'top_selling_products',
          params: { dateRange: 'this_month', limit: 5 },
          confidence: 0.9,
          originalQuery: 'What are my best sellers?',
        },
        startedAt: new Date().toISOString(),
      };

      const result = await classifyIntent('What about last month?', context);

      expect(result.intent).toBe('top_selling_products');
      expect(result.params.dateRange).toBe('last_month');
    });
  });

  describe('Query Mapping', () => {
    it('should have query mapping for all supported intents', () => {
      const supportedIntents = getSupportedIntents();
      
      expect(supportedIntents).toContain('top_selling_products');
      expect(supportedIntents).toContain('today_revenue');
      expect(supportedIntents).toContain('monthly_profit');
      expect(supportedIntents).toContain('low_stock_products');
      expect(supportedIntents).toContain('sales_trend');
    });

    it('should return true for valid intents', () => {
      expect(hasQueryMapping('top_selling_products')).toBe(true);
      expect(hasQueryMapping('today_revenue')).toBe(true);
      expect(hasQueryMapping('low_stock_products')).toBe(true);
    });

    it('should return false for unknown intent', () => {
      expect(hasQueryMapping('unknown')).toBe(false);
    });

    it('should return executor for valid intents', () => {
      expect(getQueryExecutor('top_selling_products')).toBeDefined();
      expect(getQueryExecutor('today_revenue')).toBeDefined();
    });

    it('should return undefined for unknown intent', () => {
      expect(getQueryExecutor('unknown')).toBeUndefined();
    });
  });

  describe('Query Execution', () => {
    it('should execute top selling products query', async () => {
      const { getTopSellingProducts } = await import('../quistQueries');
      const mockData = [
        { productName: 'Product A', totalQuantity: 100, totalRevenue: 1000 },
        { productName: 'Product B', totalQuantity: 80, totalRevenue: 800 },
      ];
      vi.mocked(getTopSellingProducts).mockResolvedValueOnce(mockData);

      const result = await executeQuery(
        'top_selling_products',
        { dateRange: 'this_month', limit: 5 },
        mockOrgId
      );

      expect(result.data).toEqual(mockData);
      expect(result.error).toBeUndefined();
      expect(getTopSellingProducts).toHaveBeenCalledWith(mockOrgId, 'this_month', 5);
    });

    it('should execute today revenue query', async () => {
      const { getTodayRevenue } = await import('../quistQueries');
      const mockData = {
        totalRevenue: 5000,
        transactionCount: 50,
        averageTransactionValue: 100,
      };
      vi.mocked(getTodayRevenue).mockResolvedValueOnce(mockData);

      const result = await executeQuery('today_revenue', {}, mockOrgId);

      expect(result.data).toEqual(mockData);
      expect(result.error).toBeUndefined();
      expect(getTodayRevenue).toHaveBeenCalledWith(mockOrgId);
    });

    it('should execute low stock products query', async () => {
      const { getLowStockProducts } = await import('../quistQueries');
      const mockData = [
        { name: 'Product A', quantity: 5, lowStockThreshold: 10 },
        { name: 'Product B', quantity: 3, lowStockThreshold: 10 },
      ];
      vi.mocked(getLowStockProducts).mockResolvedValueOnce(mockData);

      const result = await executeQuery(
        'low_stock_products',
        { threshold: 10 },
        mockOrgId
      );

      expect(result.data).toEqual(mockData);
      expect(result.error).toBeUndefined();
    });

    it('should return error for unknown intent', async () => {
      const result = await executeQuery('unknown', {}, mockOrgId);

      expect(result.data).toBeNull();
      expect(result.error).toBeDefined();
      expect(result.error?.code).toBe('INTENT_UNKNOWN');
    });

    it('should handle query execution errors', async () => {
      const { getTopSellingProducts } = await import('../quistQueries');
      vi.mocked(getTopSellingProducts).mockRejectedValueOnce(
        new Error('Database error')
      );

      const result = await executeQuery(
        'top_selling_products',
        { dateRange: 'this_month' },
        mockOrgId
      );

      expect(result.data).toBeNull();
      expect(result.error).toBeDefined();
      expect(result.error?.code).toBe('QUERY_FAILED');
    });

    it('should handle network errors appropriately', async () => {
      const { getTopSellingProducts } = await import('../quistQueries');
      vi.mocked(getTopSellingProducts).mockRejectedValueOnce(
        new Error('Network error: failed to fetch')
      );

      const result = await executeQuery(
        'top_selling_products',
        {},
        mockOrgId
      );

      expect(result.error?.code).toBe('NETWORK_ERROR');
      expect(result.error?.retryable).toBe(true);
    });

    it('should handle timeout errors appropriately', async () => {
      const { getTopSellingProducts } = await import('../quistQueries');
      vi.mocked(getTopSellingProducts).mockRejectedValueOnce(
        new Error('Query timeout')
      );

      const result = await executeQuery(
        'top_selling_products',
        {},
        mockOrgId
      );

      expect(result.error?.code).toBe('TIMEOUT');
      expect(result.error?.retryable).toBe(true);
    });
  });

  describe('Response Generation', () => {
    it('should generate response for top selling products', async () => {
      const { geminiService } = await import('../geminiService');
      vi.mocked(geminiService.generateContent).mockResolvedValueOnce({
        text: 'Your top seller is Product A with 100 units sold!',
        usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
      });

      const mockData = [
        { productName: 'Product A', totalQuantity: 100, totalRevenue: 1000 },
      ];

      const response = await generateResponse(
        'top_selling_products',
        mockData,
        { dateRange: 'this_month' }
      );

      expect(response).toContain('Product A');
      expect(response).toContain('100');
    });

    it('should generate fallback response when AI fails', async () => {
      const { geminiService } = await import('../geminiService');
      vi.mocked(geminiService.generateContent).mockRejectedValueOnce(
        new Error('AI error')
      );

      const mockData = [
        { productName: 'Product A', totalQuantity: 100, totalRevenue: 1000 },
      ];

      const response = await generateResponse(
        'top_selling_products',
        mockData,
        {}
      );

      expect(response).toContain('Product A');
      expect(response).toContain('100 units');
    });

    it('should handle empty data gracefully', async () => {
      const { geminiService } = await import('../geminiService');
      vi.mocked(geminiService.generateContent).mockResolvedValueOnce({
        text: 'No sales data found for this period.',
        usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
      });

      const response = await generateResponse('top_selling_products', [], {});

      expect(response).toBeTruthy();
    });
  });

  describe('Response Formatting', () => {
    it('should format response with correct metadata', () => {
      const mockData = [
        { productName: 'Product A', totalQuantity: 100, totalRevenue: 1000 },
      ];

      const response = formatResponse(
        'top_selling_products',
        mockData,
        'Your top seller is Product A!',
        { dateRange: 'this_month', limit: 5 },
        150
      );

      expect(response.type).toBeDefined();
      expect(response.text).toBe('Your top seller is Product A!');
      expect(response.metadata.intent).toBe('top_selling_products');
      expect(response.metadata.processingTimeMs).toBe(150);
      expect(response.rawData).toEqual(mockData);
    });

    it('should include table config for list-based responses', () => {
      const mockData = [
        { productName: 'Product A', totalQuantity: 100, totalRevenue: 1000 },
        { productName: 'Product B', totalQuantity: 80, totalRevenue: 800 },
      ];

      const response = formatResponse(
        'top_selling_products',
        mockData,
        'Here are your top products',
        {},
        100
      );

      expect(response.type).toBe('table');
      expect(response.table).toBeDefined();
    });

    it('should return text type for empty data', () => {
      const response = formatResponse(
        'top_selling_products',
        [],
        'No products found',
        {},
        50
      );

      expect(response.type).toBe('text');
    });
  });
});
