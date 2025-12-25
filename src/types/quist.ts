/**
 * Quist - Natural Language Business Intelligence Types
 * 
 * Type definitions for the Quist feature including:
 * - Query parameters and results
 * - Intent classification
 * - Response formatting
 * - Conversation context
 * 
 * @module types/quist
 */

// ============================================================================
// Date Range Types
// ============================================================================

/**
 * Predefined date range options for queries
 */
export type DateRange = 
  | 'today' 
  | 'yesterday' 
  | 'this_week' 
  | 'last_week' 
  | 'this_month' 
  | 'last_month' 
  | 'this_year';

/**
 * Resolved date range with actual start and end dates
 */
export interface DateRangeParams {
  startDate: string;
  endDate: string;
}

// ============================================================================
// Query Parameter Types
// ============================================================================

/**
 * Base parameters required for all Quist queries
 */
export interface BaseQueryParams {
  /** Organization ID for multi-tenant filtering (required) */
  organizationId: string;
}

/**
 * Parameters for top selling products query
 */
export interface TopSellingProductsParams extends BaseQueryParams {
  /** Date range to analyze (default: 'this_month') */
  dateRange?: DateRange;
  /** Maximum number of products to return (default: 5) */
  limit?: number;
}

/**
 * Parameters for revenue query
 */
export interface RevenueQueryParams extends BaseQueryParams {
  /** Date range to calculate revenue for (default: 'today') */
  dateRange?: DateRange;
}

/**
 * Parameters for profit calculation query
 */
export interface ProfitQueryParams extends BaseQueryParams {
  /** Date range to calculate profit for (default: 'this_month') */
  dateRange?: DateRange;
}

/**
 * Parameters for low stock products query
 */
export interface LowStockQueryParams extends BaseQueryParams {
  /** Custom threshold to use instead of product's own threshold */
  threshold?: number;
}

/**
 * Parameters for sales trend query
 */
export interface SalesTrendQueryParams extends BaseQueryParams {
  /** Period to analyze (default: 'this_week') */
  period?: DateRange;
}

/**
 * Parameters for customer statistics query
 */
export interface CustomerStatsQueryParams extends BaseQueryParams {
  /** Date range to analyze */
  dateRange?: DateRange;
}

// ============================================================================
// Query Result Types
// ============================================================================

/**
 * Top selling product data
 */
export interface TopSellingProduct {
  /** Product ID */
  productId: string;
  /** Product name */
  productName: string;
  /** Total quantity sold in the period */
  totalQuantity: number;
  /** Total revenue generated */
  totalRevenue: number;
  /** Category name (if available) */
  categoryName?: string;
}

/**
 * Revenue calculation result
 */
export interface RevenueResult {
  /** Total revenue for the period */
  totalRevenue: number;
  /** Number of transactions */
  transactionCount: number;
  /** Average value per transaction */
  averageTransactionValue: number;
}

/**
 * Profit calculation result
 */
export interface ProfitResult {
  /** Total revenue for the period */
  totalRevenue: number;
  /** Total cost of goods sold */
  totalCost: number;
  /** Gross profit (revenue - cost) */
  grossProfit: number;
  /** Profit margin as percentage */
  profitMargin: number;
  /** Number of transactions */
  transactionCount: number;
}

/**
 * Low stock product data
 */
export interface LowStockProduct {
  /** Product ID */
  id: string;
  /** Product name */
  name: string;
  /** Current quantity in stock */
  quantity: number;
  /** Low stock threshold for this product */
  lowStockThreshold: number;
  /** Category name (if available) */
  categoryName?: string;
}

/**
 * Single data point in sales trend
 */
export interface SalesTrendPoint {
  /** Date (YYYY-MM-DD format) */
  date: string;
  /** Revenue for this date */
  revenue: number;
  /** Number of transactions on this date */
  transactionCount: number;
}

/**
 * Sales trend analysis result
 */
export interface SalesTrendResult {
  /** Daily trend data points */
  trend: SalesTrendPoint[];
  /** Total revenue for the period */
  totalRevenue: number;
  /** Average daily revenue */
  averageDailyRevenue: number;
  /** Percentage change (comparing first half to second half) */
  percentageChange: number;
}

/**
 * Customer statistics result
 */
export interface CustomerStatsResult {
  /** Total number of customers */
  totalCustomers: number;
  /** New customers in the period */
  newCustomers: number;
  /** Customers with purchases in the period */
  activeCustomers: number;
  /** Average purchase value per customer */
  averagePurchaseValue: number;
  /** Top customers by purchase amount */
  topCustomers: CustomerSummary[];
}

/**
 * Customer summary data
 */
export interface CustomerSummary {
  /** Customer ID */
  customerId: string;
  /** Customer name */
  customerName: string;
  /** Total purchase amount */
  totalPurchases: number;
  /** Number of transactions */
  transactionCount: number;
}

// ============================================================================
// Intent Classification Types
// ============================================================================

/**
 * Supported query intents that Quist can handle
 */
export type QuistIntent =
  | 'top_selling_products'
  | 'today_revenue'
  | 'revenue'
  | 'monthly_profit'
  | 'profit'
  | 'low_stock_products'
  | 'sales_trend'
  | 'customer_stats'
  | 'unknown';

/**
 * Extracted parameters from natural language query
 */
export interface ExtractedParams {
  /** Date range mentioned in the query */
  dateRange?: DateRange;
  /** Specific limit mentioned (e.g., "top 10") */
  limit?: number;
  /** Product name or category mentioned */
  productFilter?: string;
  /** Category filter */
  categoryFilter?: string;
  /** Custom threshold mentioned */
  threshold?: number;
}

/**
 * Result of intent classification from Gemini
 */
export interface IntentClassificationResult {
  /** Classified intent */
  intent: QuistIntent;
  /** Extracted parameters */
  params: ExtractedParams;
  /** Confidence score (0-1) */
  confidence: number;
  /** Original query for reference */
  originalQuery: string;
}

// ============================================================================
// Response Types
// ============================================================================

/**
 * Types of responses Quist can generate
 */
export type QuistResponseType = 'text' | 'table' | 'chart' | 'action' | 'error';

/**
 * Chart types supported in responses
 */
export type QuistChartType = 'bar' | 'line' | 'pie' | 'area';

/**
 * Chart configuration for visual responses
 */
export interface QuistChartConfig {
  /** Type of chart */
  type: QuistChartType;
  /** Chart title */
  title: string;
  /** Data for the chart */
  data: QuistChartDataPoint[];
  /** X-axis label */
  xAxisLabel?: string;
  /** Y-axis label */
  yAxisLabel?: string;
}

/**
 * Single data point for charts
 */
export interface QuistChartDataPoint {
  /** Label for this data point */
  label: string;
  /** Primary value */
  value: number;
  /** Secondary value (for multi-series charts) */
  secondaryValue?: number;
}

/**
 * Table configuration for tabular responses
 */
export interface QuistTableConfig {
  /** Column definitions */
  columns: QuistTableColumn[];
  /** Row data */
  rows: Record<string, unknown>[];
  /** Optional title */
  title?: string;
}

/**
 * Table column definition
 */
export interface QuistTableColumn {
  /** Column key (matches row data keys) */
  key: string;
  /** Display header */
  header: string;
  /** Column type for formatting */
  type: 'text' | 'number' | 'currency' | 'percentage' | 'date';
  /** Text alignment */
  align?: 'left' | 'center' | 'right';
}

/**
 * Action suggestion in response
 */
export interface QuistAction {
  /** Action label */
  label: string;
  /** Action type */
  type: 'navigate' | 'query' | 'export';
  /** Action payload (route, query, or export config) */
  payload: string;
}

/**
 * Complete Quist response
 */
export interface QuistResponse {
  /** Response type */
  type: QuistResponseType;
  /** Natural language text response */
  text: string;
  /** Table data (if type is 'table') */
  table?: QuistTableConfig;
  /** Chart data (if type is 'chart') */
  chart?: QuistChartConfig;
  /** Suggested actions */
  actions?: QuistAction[];
  /** Raw data for reference */
  rawData?: unknown;
  /** Query metadata */
  metadata: QuistResponseMetadata;
}

/**
 * Metadata about the query and response
 */
export interface QuistResponseMetadata {
  /** Intent that was classified */
  intent: QuistIntent;
  /** Parameters used */
  params: ExtractedParams;
  /** Processing time in milliseconds */
  processingTimeMs: number;
  /** Data freshness timestamp */
  dataTimestamp: string;
  /** Whether response was from cache */
  cached: boolean;
}

// ============================================================================
// Conversation Context Types
// ============================================================================

/**
 * Single message in conversation history
 */
export interface QuistMessage {
  /** Unique message ID */
  id: string;
  /** Message role */
  role: 'user' | 'assistant';
  /** Message content */
  content: string;
  /** Timestamp */
  timestamp: string;
  /** Associated response (for assistant messages) */
  response?: QuistResponse;
}

/**
 * Conversation context for follow-up queries
 */
export interface QuistConversationContext {
  /** Session ID */
  sessionId: string;
  /** Organization ID */
  organizationId: string;
  /** User ID */
  userId: string;
  /** Previous messages in this session */
  messages: QuistMessage[];
  /** Last query's intent and params (for follow-ups) */
  lastQuery?: {
    intent: QuistIntent;
    params: ExtractedParams;
    timestamp: string;
  };
  /** Session start time */
  startedAt: string;
  /** Last activity time */
  lastActivityAt: string;
}

// ============================================================================
// Quick Query Types
// ============================================================================

/**
 * Predefined quick query shortcut
 */
export interface QuistQuickQuery {
  /** Unique identifier */
  id: string;
  /** Display label */
  label: string;
  /** Icon name (for UI) */
  icon: string;
  /** The query text to execute */
  query: string;
  /** Pre-classified intent (for faster processing) */
  intent: QuistIntent;
  /** Pre-set parameters */
  params: ExtractedParams;
  /** Category for grouping */
  category: 'sales' | 'inventory' | 'profit' | 'trends';
}

/**
 * Recent query for quick re-run
 */
export interface QuistRecentQuery {
  /** Query text */
  query: string;
  /** When it was executed */
  executedAt: string;
  /** Intent that was classified */
  intent: QuistIntent;
  /** Number of times this query was run */
  runCount: number;
}

// ============================================================================
// Error Types
// ============================================================================

/**
 * Quist-specific error codes
 */
export type QuistErrorCode =
  | 'INTENT_UNKNOWN'
  | 'QUERY_FAILED'
  | 'NO_DATA'
  | 'RATE_LIMITED'
  | 'UNAUTHORIZED'
  | 'INVALID_PARAMS'
  | 'AI_ERROR'
  | 'NETWORK_ERROR'
  | 'TIMEOUT'
  | 'SERVICE_UNAVAILABLE';

/**
 * Quist error response
 */
export interface QuistError {
  /** Error code */
  code: QuistErrorCode;
  /** Human-readable message */
  message: string;
  /** Suggested follow-up queries */
  suggestions?: string[];
  /** Original query that caused the error */
  originalQuery?: string;
  /** Whether the error is retryable */
  retryable?: boolean;
}

// ============================================================================
// Loading State Types
// ============================================================================

/**
 * Loading stages for query processing
 */
export type QuistLoadingStage = 
  | 'idle'
  | 'classifying'
  | 'fetching'
  | 'generating'
  | 'formatting';

/**
 * Loading state with stage information
 */
export interface QuistLoadingState {
  /** Whether currently loading */
  isLoading: boolean;
  /** Current loading stage */
  stage: QuistLoadingStage;
  /** Human-readable message for current stage */
  message: string;
}

// ============================================================================
// Service Types
// ============================================================================

/**
 * Query function signature type
 */
export type QuistQueryFunction<TParams extends BaseQueryParams, TResult> = (
  params: TParams
) => Promise<TResult>;

/**
 * Map of intents to their query functions
 */
export interface QuistQueryMap {
  top_selling_products: QuistQueryFunction<TopSellingProductsParams, TopSellingProduct[]>;
  today_revenue: QuistQueryFunction<RevenueQueryParams, RevenueResult>;
  revenue: QuistQueryFunction<RevenueQueryParams, RevenueResult>;
  monthly_profit: QuistQueryFunction<ProfitQueryParams, ProfitResult>;
  profit: QuistQueryFunction<ProfitQueryParams, ProfitResult>;
  low_stock_products: QuistQueryFunction<LowStockQueryParams, LowStockProduct[]>;
  sales_trend: QuistQueryFunction<SalesTrendQueryParams, SalesTrendResult>;
  customer_stats: QuistQueryFunction<CustomerStatsQueryParams, CustomerStatsResult>;
}
