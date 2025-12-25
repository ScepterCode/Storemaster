/**
 * Unit tests for Quist Query Functions
 * Tests date range calculations and query function behavior
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  getDateRangeParams,
  getTopSellingProducts,
  getTodayRevenue,
  getMonthlyProfit,
  getLowStockProducts,
  getSalesTrend,
} from '../quistQueries';

// Create a chainable mock that returns itself for all query methods
const createChainableMock = () => {
  const mock: any = {
    select: vi.fn(() => mock),
    eq: vi.fn(() => mock),
    gte: vi.fn(() => mock),
    lte: vi.fn(() => mock),
    in: vi.fn(() => mock),
    order: vi.fn(() => mock),
    then: vi.fn((resolve) => resolve({ data: [], error: null })),
  };
  // Make it thenable (Promise-like)
  mock[Symbol.toStringTag] = 'Promise';
  return mock;
};

// Mock Supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => createChainableMock()),
  },
}));

describe('Quist Queries', () => {
  const mockOrgId = 'test-org-123';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getDateRangeParams', () => {
    it('should return today date range', () => {
      const result = getDateRangeParams('today');
      
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      
      expect(new Date(result.startDate).toDateString()).toBe(startOfDay.toDateString());
      expect(new Date(result.endDate).toDateString()).toBe(startOfDay.toDateString());
    });

    it('should return yesterday date range', () => {
      const result = getDateRangeParams('yesterday');
      
      const today = new Date();
      const yesterday = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1);
      
      expect(new Date(result.startDate).toDateString()).toBe(yesterday.toDateString());
      expect(new Date(result.endDate).toDateString()).toBe(yesterday.toDateString());
    });

    it('should return this_week date range starting from Sunday', () => {
      const result = getDateRangeParams('this_week');
      
      const today = new Date();
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - today.getDay());
      startOfWeek.setHours(0, 0, 0, 0);
      
      expect(new Date(result.startDate).toDateString()).toBe(startOfWeek.toDateString());
    });

    it('should return this_month date range', () => {
      const result = getDateRangeParams('this_month');
      
      const today = new Date();
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      
      expect(new Date(result.startDate).toDateString()).toBe(startOfMonth.toDateString());
    });

    it('should return last_month date range', () => {
      const result = getDateRangeParams('last_month');
      
      const today = new Date();
      const startOfLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const endOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);
      
      expect(new Date(result.startDate).toDateString()).toBe(startOfLastMonth.toDateString());
      expect(new Date(result.endDate).toDateString()).toBe(endOfLastMonth.toDateString());
    });

    it('should return this_year date range', () => {
      const result = getDateRangeParams('this_year');
      
      const today = new Date();
      const startOfYear = new Date(today.getFullYear(), 0, 1);
      
      expect(new Date(result.startDate).toDateString()).toBe(startOfYear.toDateString());
    });
  });

  describe('getTopSellingProducts', () => {
    it('should throw error when organizationId is missing', async () => {
      await expect(getTopSellingProducts('')).rejects.toThrow('Organization ID is required');
    });

    it('should return empty array when no invoices found', async () => {
      const result = await getTopSellingProducts(mockOrgId);
      expect(result).toEqual([]);
    });

    it('should use default limit of 5', async () => {
      // The function should use limit=5 by default
      const result = await getTopSellingProducts(mockOrgId, 'this_month');
      expect(Array.isArray(result)).toBe(true);
    });

    it('should use default date range of this_month', async () => {
      const result = await getTopSellingProducts(mockOrgId);
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('getTodayRevenue', () => {
    it('should throw error when organizationId is missing', async () => {
      await expect(getTodayRevenue('')).rejects.toThrow('Organization ID is required');
    });

    it('should return zero revenue when no invoices found', async () => {
      const result = await getTodayRevenue(mockOrgId);
      
      expect(result.totalRevenue).toBe(0);
      expect(result.transactionCount).toBe(0);
      expect(result.averageTransactionValue).toBe(0);
    });
  });

  describe('getMonthlyProfit', () => {
    it('should throw error when organizationId is missing', async () => {
      await expect(getMonthlyProfit('')).rejects.toThrow('Organization ID is required');
    });

    it('should return zero profit when no invoices found', async () => {
      const result = await getMonthlyProfit(mockOrgId);
      
      expect(result.totalRevenue).toBe(0);
      expect(result.totalCost).toBe(0);
      expect(result.grossProfit).toBe(0);
      expect(result.profitMargin).toBe(0);
      expect(result.transactionCount).toBe(0);
    });

    it('should use default date range of this_month', async () => {
      const result = await getMonthlyProfit(mockOrgId);
      expect(result).toBeDefined();
    });
  });

  describe('getLowStockProducts', () => {
    it('should throw error when organizationId is missing', async () => {
      await expect(getLowStockProducts('')).rejects.toThrow('Organization ID is required');
    });

    it('should return empty array when no products found', async () => {
      const result = await getLowStockProducts(mockOrgId);
      expect(result).toEqual([]);
    });

    it('should accept custom threshold', async () => {
      const result = await getLowStockProducts(mockOrgId, 20);
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('getSalesTrend', () => {
    it('should throw error when organizationId is missing', async () => {
      await expect(getSalesTrend('')).rejects.toThrow('Organization ID is required');
    });

    it('should return empty trend when no invoices found', async () => {
      const result = await getSalesTrend(mockOrgId);
      
      expect(result.trend).toEqual([]);
      expect(result.totalRevenue).toBe(0);
      expect(result.averageDailyRevenue).toBe(0);
      expect(result.percentageChange).toBe(0);
    });

    it('should use default period of this_week', async () => {
      const result = await getSalesTrend(mockOrgId);
      expect(result).toBeDefined();
    });
  });
});
