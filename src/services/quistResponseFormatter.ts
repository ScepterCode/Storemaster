/**
 * Quist Response Formatter
 * 
 * Utility for combining AI-generated text with structured data
 * into formatted, display-ready responses.
 * 
 * Handles:
 * - Currency formatting
 * - Number formatting with locale support
 * - Percentage formatting
 * - Date formatting
 * - Table data preparation
 * - Chart data transformation
 * - Combined text + data response building
 * 
 * @module quistResponseFormatter
 */

import type {
  QuistResponse,
  QuistTableConfig,
  QuistTableColumn,
  QuistChartConfig,
  QuistChartDataPoint,
  QuistAction,
  QuistResponseType,
} from '@/types/quist';

// ============================================================================
// Formatting Configuration
// ============================================================================

/**
 * Default locale for formatting (can be overridden)
 */
const DEFAULT_LOCALE = 'en-US';

/**
 * Default currency code
 */
const DEFAULT_CURRENCY = 'NGN'; // Nigerian Naira for this app

/**
 * Formatting options for different data types
 */
export interface FormattingOptions {
  locale?: string;
  currency?: string;
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
}

// ============================================================================
// Number Formatting Utilities
// ============================================================================

/**
 * Formats a number as currency
 */
export function formatCurrency(
  value: number,
  options: FormattingOptions = {}
): string {
  const {
    locale = DEFAULT_LOCALE,
    currency = DEFAULT_CURRENCY,
    minimumFractionDigits = 2,
    maximumFractionDigits = 2,
  } = options;

  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits,
    maximumFractionDigits,
  }).format(value);
}

/**
 * Formats a number with thousand separators
 */
export function formatNumber(
  value: number,
  options: FormattingOptions = {}
): string {
  const {
    locale = DEFAULT_LOCALE,
    minimumFractionDigits = 0,
    maximumFractionDigits = 2,
  } = options;

  return new Intl.NumberFormat(locale, {
    minimumFractionDigits,
    maximumFractionDigits,
  }).format(value);
}

/**
 * Formats a number as percentage
 */
export function formatPercentage(
  value: number,
  options: FormattingOptions = {}
): string {
  const {
    locale = DEFAULT_LOCALE,
    minimumFractionDigits = 1,
    maximumFractionDigits = 1,
  } = options;

  return new Intl.NumberFormat(locale, {
    style: 'percent',
    minimumFractionDigits,
    maximumFractionDigits,
  }).format(value / 100);
}

/**
 * Formats a date string for display
 */
export function formatDate(
  dateString: string,
  options: Intl.DateTimeFormatOptions = {}
): string {
  const date = new Date(dateString);
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...options,
  };
  return date.toLocaleDateString(DEFAULT_LOCALE, defaultOptions);
}

/**
 * Formats a date string as relative time (e.g., "2 hours ago")
 */
export function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) return 'just now';
  if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  return formatDate(dateString);
}

// ============================================================================
// Table Formatting
// ============================================================================

/**
 * Formatted table cell value
 */
export interface FormattedCell {
  raw: unknown;
  formatted: string;
  type: QuistTableColumn['type'];
}

/**
 * Formatted table row
 */
export interface FormattedRow {
  cells: Record<string, FormattedCell>;
}

/**
 * Formatted table ready for display
 */
export interface FormattedTable {
  title?: string;
  columns: QuistTableColumn[];
  rows: FormattedRow[];
  summary?: string;
}

/**
 * Formats a single cell value based on column type
 */
export function formatCellValue(
  value: unknown,
  column: QuistTableColumn,
  options: FormattingOptions = {}
): FormattedCell {
  const raw = value;
  let formatted: string;

  switch (column.type) {
    case 'currency':
      formatted = typeof value === 'number' ? formatCurrency(value, options) : String(value ?? '-');
      break;
    case 'number':
      formatted = typeof value === 'number' ? formatNumber(value, options) : String(value ?? '-');
      break;
    case 'percentage':
      formatted = typeof value === 'number' ? formatPercentage(value, options) : String(value ?? '-');
      break;
    case 'date':
      formatted = typeof value === 'string' ? formatDate(value) : String(value ?? '-');
      break;
    case 'text':
    default:
      formatted = String(value ?? '-');
  }

  return { raw, formatted, type: column.type };
}

/**
 * Formats a complete table configuration for display
 */
export function formatTable(
  config: QuistTableConfig,
  options: FormattingOptions = {}
): FormattedTable {
  const formattedRows: FormattedRow[] = config.rows.map((row) => {
    const cells: Record<string, FormattedCell> = {};
    
    for (const column of config.columns) {
      const value = row[column.key];
      cells[column.key] = formatCellValue(value, column, options);
    }
    
    return { cells };
  });

  return {
    title: config.title,
    columns: config.columns,
    rows: formattedRows,
  };
}

/**
 * Generates a text summary of table data
 */
export function generateTableSummary(
  config: QuistTableConfig,
  options: FormattingOptions = {}
): string {
  if (config.rows.length === 0) {
    return 'No data available.';
  }

  const rowCount = config.rows.length;
  const title = config.title || 'Data';
  
  return `${title}: ${rowCount} item${rowCount !== 1 ? 's' : ''}`;
}

// ============================================================================
// Chart Formatting
// ============================================================================

/**
 * Formatted chart data point
 */
export interface FormattedChartPoint {
  label: string;
  value: number;
  formattedValue: string;
  secondaryValue?: number;
  formattedSecondaryValue?: string;
}

/**
 * Formatted chart ready for display
 */
export interface FormattedChart {
  type: QuistChartConfig['type'];
  title: string;
  data: FormattedChartPoint[];
  xAxisLabel?: string;
  yAxisLabel?: string;
  summary?: string;
}

/**
 * Formats chart data for display
 */
export function formatChart(
  config: QuistChartConfig,
  isCurrency: boolean = false,
  options: FormattingOptions = {}
): FormattedChart {
  const formattedData: FormattedChartPoint[] = config.data.map((point) => ({
    label: point.label,
    value: point.value,
    formattedValue: isCurrency 
      ? formatCurrency(point.value, options) 
      : formatNumber(point.value, options),
    secondaryValue: point.secondaryValue,
    formattedSecondaryValue: point.secondaryValue !== undefined
      ? formatNumber(point.secondaryValue, options)
      : undefined,
  }));

  return {
    type: config.type,
    title: config.title,
    data: formattedData,
    xAxisLabel: config.xAxisLabel,
    yAxisLabel: config.yAxisLabel,
  };
}

/**
 * Generates a text summary of chart data
 */
export function generateChartSummary(
  config: QuistChartConfig,
  isCurrency: boolean = false,
  options: FormattingOptions = {}
): string {
  if (config.data.length === 0) {
    return 'No data available for chart.';
  }

  const total = config.data.reduce((sum, point) => sum + point.value, 0);
  const max = Math.max(...config.data.map((p) => p.value));
  const maxPoint = config.data.find((p) => p.value === max);

  const formattedTotal = isCurrency 
    ? formatCurrency(total, options) 
    : formatNumber(total, options);
  const formattedMax = isCurrency 
    ? formatCurrency(max, options) 
    : formatNumber(max, options);

  if (maxPoint) {
    return `Total: ${formattedTotal}. Highest: ${maxPoint.label} (${formattedMax})`;
  }
  
  return `Total: ${formattedTotal}`;
}

// ============================================================================
// Combined Response Formatting
// ============================================================================

/**
 * Fully formatted Quist response ready for UI rendering
 */
export interface FormattedQuistResponse {
  /** Response type */
  type: QuistResponseType;
  /** Main text content */
  text: string;
  /** Formatted table (if applicable) */
  table?: FormattedTable;
  /** Formatted chart (if applicable) */
  chart?: FormattedChart;
  /** Action buttons */
  actions?: QuistAction[];
  /** Processing time display */
  processingTime: string;
  /** Data freshness display */
  dataFreshness: string;
  /** Whether this is an error response */
  isError: boolean;
  /** Summary combining text and data highlights */
  combinedSummary: string;
}

/**
 * Determines if chart data represents currency values
 */
function isChartCurrency(chart: QuistChartConfig): boolean {
  const currencyKeywords = ['revenue', 'profit', 'cost', 'sales', 'price', 'amount'];
  const titleLower = chart.title.toLowerCase();
  return currencyKeywords.some((keyword) => titleLower.includes(keyword));
}

/**
 * Formats a complete QuistResponse for UI display
 * Combines AI text with structured data into a unified format
 */
export function formatQuistResponse(
  response: QuistResponse,
  options: FormattingOptions = {}
): FormattedQuistResponse {
  const isError = response.type === 'error';
  
  // Format table if present
  let formattedTable: FormattedTable | undefined;
  if (response.table) {
    formattedTable = formatTable(response.table, options);
    formattedTable.summary = generateTableSummary(response.table, options);
  }

  // Format chart if present
  let formattedChart: FormattedChart | undefined;
  if (response.chart) {
    const isCurrency = isChartCurrency(response.chart);
    formattedChart = formatChart(response.chart, isCurrency, options);
    formattedChart.summary = generateChartSummary(response.chart, isCurrency, options);
  }

  // Format processing time
  const processingTime = response.metadata.processingTimeMs < 1000
    ? `${response.metadata.processingTimeMs}ms`
    : `${(response.metadata.processingTimeMs / 1000).toFixed(1)}s`;

  // Format data freshness
  const dataFreshness = formatRelativeTime(response.metadata.dataTimestamp);

  // Build combined summary
  const combinedSummary = buildCombinedSummary(response, formattedTable, formattedChart);

  return {
    type: response.type,
    text: response.text,
    table: formattedTable,
    chart: formattedChart,
    actions: response.actions,
    processingTime,
    dataFreshness,
    isError,
    combinedSummary,
  };
}

/**
 * Builds a combined summary from text and structured data
 */
function buildCombinedSummary(
  response: QuistResponse,
  table?: FormattedTable,
  chart?: FormattedChart
): string {
  const parts: string[] = [];

  // Add main text (truncated if too long)
  const maxTextLength = 200;
  if (response.text.length > maxTextLength) {
    parts.push(response.text.substring(0, maxTextLength) + '...');
  } else {
    parts.push(response.text);
  }

  // Add table summary if present
  if (table?.summary) {
    parts.push(table.summary);
  }

  // Add chart summary if present
  if (chart?.summary) {
    parts.push(chart.summary);
  }

  return parts.join(' | ');
}

// ============================================================================
// Response Type Helpers
// ============================================================================

/**
 * Checks if response has displayable table data
 */
export function hasTableData(response: QuistResponse): boolean {
  return !!response.table && response.table.rows.length > 0;
}

/**
 * Checks if response has displayable chart data
 */
export function hasChartData(response: QuistResponse): boolean {
  return !!response.chart && response.chart.data.length > 0;
}

/**
 * Checks if response has action buttons
 */
export function hasActions(response: QuistResponse): boolean {
  return !!response.actions && response.actions.length > 0;
}

/**
 * Gets the primary display type for a response
 * Used to determine which component to render prominently
 */
export function getPrimaryDisplayType(
  response: QuistResponse
): 'text' | 'table' | 'chart' | 'error' {
  if (response.type === 'error') return 'error';
  if (hasTableData(response)) return 'table';
  if (hasChartData(response)) return 'chart';
  return 'text';
}

// ============================================================================
// Text Enhancement Utilities
// ============================================================================

/**
 * Highlights numbers in text with formatting
 */
export function highlightNumbers(
  text: string,
  options: FormattingOptions = {}
): string {
  // Match currency patterns (e.g., $1,234.56, ₦1234.56)
  const currencyPattern = /[₦$€£¥]\s*[\d,]+\.?\d*/g;
  
  // Match percentage patterns
  const percentPattern = /\d+\.?\d*\s*%/g;
  
  // Match plain numbers (with optional decimals and commas)
  const numberPattern = /\b\d{1,3}(,\d{3})*(\.\d+)?\b/g;

  let result = text;

  // Wrap currency values
  result = result.replace(currencyPattern, (match) => `**${match}**`);
  
  // Wrap percentages
  result = result.replace(percentPattern, (match) => `**${match}**`);

  return result;
}

/**
 * Extracts key metrics from response text
 */
export function extractKeyMetrics(text: string): string[] {
  const metrics: string[] = [];
  
  // Extract currency values
  const currencyMatches = text.match(/[₦$€£¥]\s*[\d,]+\.?\d*/g);
  if (currencyMatches) {
    metrics.push(...currencyMatches);
  }

  // Extract percentages
  const percentMatches = text.match(/\d+\.?\d*\s*%/g);
  if (percentMatches) {
    metrics.push(...percentMatches);
  }

  return [...new Set(metrics)]; // Remove duplicates
}

// ============================================================================
// Export Formatter Object
// ============================================================================

export const quistResponseFormatter = {
  // Number formatting
  formatCurrency,
  formatNumber,
  formatPercentage,
  formatDate,
  formatRelativeTime,
  
  // Table formatting
  formatCellValue,
  formatTable,
  generateTableSummary,
  
  // Chart formatting
  formatChart,
  generateChartSummary,
  
  // Combined response formatting
  formatQuistResponse,
  
  // Helpers
  hasTableData,
  hasChartData,
  hasActions,
  getPrimaryDisplayType,
  
  // Text utilities
  highlightNumbers,
  extractKeyMetrics,
};

export default quistResponseFormatter;
