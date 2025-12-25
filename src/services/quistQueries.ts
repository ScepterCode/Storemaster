/**
 * Quist Query Functions
 * 
 * Secure, predefined query functions for the Quist natural language BI feature.
 * All queries filter by organization_id to respect multi-tenant boundaries.
 * No raw SQL from AI - only these predefined functions are executed.
 * 
 * @module quistQueries
 */

import { supabase } from '@/integrations/supabase/client';
import type {
  DateRange,
  DateRangeParams,
  TopSellingProduct,
  TopSellingProductsParams,
  RevenueResult,
  RevenueQueryParams,
  ProfitResult,
  ProfitQueryParams,
  LowStockProduct,
  LowStockQueryParams,
  SalesTrendPoint,
  SalesTrendResult,
  SalesTrendQueryParams,
  CustomerStatsResult,
  CustomerStatsQueryParams,
  CustomerSummary,
} from '@/types/quist';

// Re-export types for convenience
export type {
  DateRange,
  DateRangeParams,
  TopSellingProduct,
  TopSellingProductsParams,
  RevenueResult,
  RevenueQueryParams,
  ProfitResult,
  ProfitQueryParams,
  LowStockProduct,
  LowStockQueryParams,
  SalesTrendPoint,
  SalesTrendResult,
  SalesTrendQueryParams,
  CustomerStatsResult,
  CustomerStatsQueryParams,
  CustomerSummary,
};

// Type for Supabase query results to avoid deep inference
type QueryResult<T> = { data: T | null; error: { message: string } | null };

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Converts a DateRange enum to actual start/end dates
 */
export function getDateRangeParams(range: DateRange): DateRangeParams {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  let startDate: Date;
  let endDate: Date = new Date(today);
  endDate.setHours(23, 59, 59, 999);

  switch (range) {
    case 'today':
      startDate = today;
      break;
    case 'yesterday':
      startDate = new Date(today);
      startDate.setDate(startDate.getDate() - 1);
      endDate = new Date(startDate);
      endDate.setHours(23, 59, 59, 999);
      break;
    case 'this_week':
      startDate = new Date(today);
      startDate.setDate(startDate.getDate() - startDate.getDay());
      break;
    case 'last_week':
      startDate = new Date(today);
      startDate.setDate(startDate.getDate() - startDate.getDay() - 7);
      endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 6);
      endDate.setHours(23, 59, 59, 999);
      break;
    case 'this_month':
      startDate = new Date(today.getFullYear(), today.getMonth(), 1);
      break;
    case 'last_month':
      startDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      endDate = new Date(today.getFullYear(), today.getMonth(), 0);
      endDate.setHours(23, 59, 59, 999);
      break;
    case 'this_year':
      startDate = new Date(today.getFullYear(), 0, 1);
      break;
    default:
      startDate = today;
  }

  return {
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString()
  };
}

// ============================================================================
// Query Functions
// ============================================================================

/**
 * Gets top selling products by quantity sold within a date range
 * 
 * @param organizationId - The organization ID (required for multi-tenancy)
 * @param dateRange - The date range to query
 * @param limit - Maximum number of products to return (default: 5)
 * @returns Array of top selling products with quantities and revenue
 */
export async function getTopSellingProducts(
  organizationId: string,
  dateRange: DateRange = 'this_month',
  limit: number = 5
): Promise<TopSellingProduct[]> {
  if (!organizationId) {
    throw new Error('Organization ID is required');
  }

  const { startDate, endDate } = getDateRangeParams(dateRange);
  const startDateStr = startDate.split('T')[0];
  const endDateStr = endDate.split('T')[0];

  // Query invoices to get IDs - break chain to avoid TypeScript deep inference issue
  const baseQuery: any = supabase.from('invoices').select('id');
  const invoicesQuery = baseQuery
    .eq('organization_id', organizationId)
    .gte('date', startDateStr)
    .lte('date', endDateStr)
    .in('status', ['paid', 'issued']);
  
  const invoicesResult = await invoicesQuery as unknown as QueryResult<Array<{ id: string }>>;

  if (invoicesResult.error) {
    throw new Error(`Failed to fetch invoices: ${invoicesResult.error.message}`);
  }

  if (!invoicesResult.data || invoicesResult.data.length === 0) {
    return [];
  }

  const invoiceIds = invoicesResult.data.map(inv => inv.id);

  // Get invoice items for these invoices
  const itemsQuery = supabase
    .from('invoice_items')
    .select('product_id, product_name, quantity, total_price')
    .in('invoice_id', invoiceIds);
  
  const itemsResult = await itemsQuery as unknown as QueryResult<Array<{
    product_id: string;
    product_name: string;
    quantity: number;
    total_price: number;
  }>>;

  if (itemsResult.error) {
    throw new Error(`Failed to fetch invoice items: ${itemsResult.error.message}`);
  }

  if (!itemsResult.data || itemsResult.data.length === 0) {
    return [];
  }

  // Aggregate by product
  const productMap = new Map<string, { name: string; quantity: number; revenue: number }>();
  
  for (const item of itemsResult.data) {
    const existing = productMap.get(item.product_id) || { 
      name: item.product_name, 
      quantity: 0, 
      revenue: 0 
    };
    existing.quantity += item.quantity;
    existing.revenue += item.total_price;
    productMap.set(item.product_id, existing);
  }

  // Convert to array and sort by quantity
  const results: TopSellingProduct[] = Array.from(productMap.entries())
    .map(([productId, data]) => ({
      productId,
      productName: data.name,
      totalQuantity: data.quantity,
      totalRevenue: data.revenue
    }))
    .sort((a, b) => b.totalQuantity - a.totalQuantity)
    .slice(0, limit);

  return results;
}

/**
 * Gets today's total revenue
 * 
 * @param organizationId - The organization ID (required for multi-tenancy)
 * @returns Revenue summary for today
 */
export async function getTodayRevenue(organizationId: string): Promise<RevenueResult> {
  if (!organizationId) {
    throw new Error('Organization ID is required');
  }

  const { startDate } = getDateRangeParams('today');
  const todayDate = startDate.split('T')[0];

  // Break chain to avoid TypeScript deep inference issue
  const baseQuery: any = supabase.from('invoices').select('total_amount');
  const query = baseQuery
    .eq('organization_id', organizationId)
    .eq('date', todayDate)
    .in('status', ['paid', 'issued']);

  const result = await query as unknown as QueryResult<Array<{ total_amount: number }>>;

  if (result.error) {
    throw new Error(`Failed to fetch today's revenue: ${result.error.message}`);
  }

  const invoices = result.data || [];
  const totalRevenue = invoices.reduce((sum, inv) => sum + Number(inv.total_amount), 0);
  const transactionCount = invoices.length;

  return {
    totalRevenue,
    transactionCount,
    averageTransactionValue: transactionCount > 0 ? totalRevenue / transactionCount : 0
  };
}


/**
 * Gets monthly profit calculation
 * 
 * @param organizationId - The organization ID (required for multi-tenancy)
 * @param dateRange - The date range to calculate profit for (default: this_month)
 * @returns Profit summary including revenue, cost, and margin
 */
export async function getMonthlyProfit(
  organizationId: string,
  dateRange: DateRange = 'this_month'
): Promise<ProfitResult> {
  if (!organizationId) {
    throw new Error('Organization ID is required');
  }

  const { startDate, endDate } = getDateRangeParams(dateRange);
  const startDateStr = startDate.split('T')[0];
  const endDateStr = endDate.split('T')[0];

  // Get invoices for the period - break chain to avoid TypeScript deep inference issue
  const baseInvoicesQuery: any = supabase.from('invoices').select('id, total_amount');
  const invoicesQuery = baseInvoicesQuery
    .eq('organization_id', organizationId)
    .gte('date', startDateStr)
    .lte('date', endDateStr)
    .in('status', ['paid', 'issued']);

  const invoicesResult = await invoicesQuery as unknown as QueryResult<Array<{ id: string; total_amount: number }>>;

  if (invoicesResult.error) {
    throw new Error(`Failed to fetch invoices: ${invoicesResult.error.message}`);
  }

  const invoices = invoicesResult.data || [];
  const totalRevenue = invoices.reduce((sum, inv) => sum + Number(inv.total_amount), 0);
  const transactionCount = invoices.length;

  if (invoices.length === 0) {
    return {
      totalRevenue: 0,
      totalCost: 0,
      grossProfit: 0,
      profitMargin: 0,
      transactionCount: 0
    };
  }

  // Get invoice items to calculate cost
  const invoiceIds = invoices.map(inv => inv.id);
  const itemsQuery = supabase
    .from('invoice_items')
    .select('product_id, quantity')
    .in('invoice_id', invoiceIds);

  const itemsResult = await itemsQuery as unknown as QueryResult<Array<{ product_id: string; quantity: number }>>;

  if (itemsResult.error) {
    throw new Error(`Failed to fetch invoice items: ${itemsResult.error.message}`);
  }

  // Get product cost prices
  let totalCost = 0;
  const items = itemsResult.data || [];
  
  if (items.length > 0) {
    const productIds = [...new Set(items.map(item => item.product_id))];
    const productsQuery = supabase
      .from('products')
      .select('id, cost_price')
      .in('id', productIds);

    const productsResult = await productsQuery as unknown as QueryResult<Array<{ id: string; cost_price: number | null }>>;

    if (!productsResult.error && productsResult.data) {
      const costMap = new Map(productsResult.data.map(p => [p.id, p.cost_price || 0]));
      totalCost = items.reduce((sum, item) => {
        const costPrice = costMap.get(item.product_id) || 0;
        return sum + (costPrice * item.quantity);
      }, 0);
    }
  }

  const grossProfit = totalRevenue - totalCost;
  const profitMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;

  return {
    totalRevenue,
    totalCost,
    grossProfit,
    profitMargin,
    transactionCount
  };
}

/**
 * Gets products that are below their low stock threshold
 * 
 * @param organizationId - The organization ID (required for multi-tenancy)
 * @param threshold - Optional custom threshold (uses product's low_stock_threshold if not provided)
 * @returns Array of low stock products
 */
export async function getLowStockProducts(
  organizationId: string,
  threshold?: number
): Promise<LowStockProduct[]> {
  if (!organizationId) {
    throw new Error('Organization ID is required');
  }

  // Build query - break chain to avoid TypeScript deep inference issue
  const baseQuery: any = supabase.from('products').select(`
      id,
      name,
      quantity,
      low_stock_threshold,
      categories!category_id(name)
    `);
  const query = baseQuery.eq('organization_id', organizationId);

  const result = await query as unknown as QueryResult<Array<{
    id: string;
    name: string;
    quantity: number;
    low_stock_threshold: number | null;
    categories: { name: string } | null;
  }>>;

  if (result.error) {
    throw new Error(`Failed to fetch low stock products: ${result.error.message}`);
  }

  if (!result.data) {
    return [];
  }

  // Filter products below their threshold
  const lowStockProducts = result.data
    .filter(p => {
      if (threshold !== undefined) {
        return p.quantity <= threshold;
      }
      // Use product's own threshold, default to 10 if not set
      const productThreshold = p.low_stock_threshold ?? 10;
      return p.quantity <= productThreshold;
    })
    .map(p => ({
      id: p.id,
      name: p.name,
      quantity: p.quantity,
      lowStockThreshold: p.low_stock_threshold ?? 10,
      categoryName: p.categories?.name
    }))
    .sort((a, b) => a.quantity - b.quantity);

  return lowStockProducts;
}

/**
 * Gets sales trend data over a period
 * 
 * @param organizationId - The organization ID (required for multi-tenancy)
 * @param period - The period to analyze (default: this_week)
 * @returns Sales trend with daily breakdown and summary statistics
 */
export async function getSalesTrend(
  organizationId: string,
  period: DateRange = 'this_week'
): Promise<SalesTrendResult> {
  if (!organizationId) {
    throw new Error('Organization ID is required');
  }

  const { startDate, endDate } = getDateRangeParams(period);
  const startDateStr = startDate.split('T')[0];
  const endDateStr = endDate.split('T')[0];

  // Break chain to avoid TypeScript deep inference issue
  const baseQuery: any = supabase.from('invoices').select('date, total_amount');
  const query = baseQuery
    .eq('organization_id', organizationId)
    .gte('date', startDateStr)
    .lte('date', endDateStr)
    .in('status', ['paid', 'issued'])
    .order('date', { ascending: true });

  const result = await query as unknown as QueryResult<Array<{ date: string; total_amount: number }>>;

  if (result.error) {
    throw new Error(`Failed to fetch sales trend: ${result.error.message}`);
  }

  // Group by date
  const dailyMap = new Map<string, { revenue: number; count: number }>();
  const invoices = result.data || [];
  
  for (const inv of invoices) {
    const existing = dailyMap.get(inv.date) || { revenue: 0, count: 0 };
    existing.revenue += Number(inv.total_amount);
    existing.count += 1;
    dailyMap.set(inv.date, existing);
  }

  const trend: SalesTrendPoint[] = Array.from(dailyMap.entries())
    .map(([date, data]) => ({
      date,
      revenue: data.revenue,
      transactionCount: data.count
    }))
    .sort((a, b) => a.date.localeCompare(b.date));

  const totalRevenue = trend.reduce((sum, point) => sum + point.revenue, 0);
  const dayCount = trend.length || 1;
  const averageDailyRevenue = totalRevenue / dayCount;

  // Calculate percentage change (compare first half to second half)
  let percentageChange = 0;
  if (trend.length >= 2) {
    const midpoint = Math.floor(trend.length / 2);
    const firstHalf = trend.slice(0, midpoint).reduce((sum, p) => sum + p.revenue, 0);
    const secondHalf = trend.slice(midpoint).reduce((sum, p) => sum + p.revenue, 0);
    if (firstHalf > 0) {
      percentageChange = ((secondHalf - firstHalf) / firstHalf) * 100;
    }
  }

  return {
    trend,
    totalRevenue,
    averageDailyRevenue,
    percentageChange
  };
}
