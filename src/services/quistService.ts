/**
 * Quist Service - Main Orchestrator
 * 
 * Central service for the Quist natural language BI feature.
 * Handles:
 * - Intent classification via Gemini AI
 * - Query execution mapping
 * - Response generation and formatting
 * - Conversation context management
 * 
 * @module quistService
 */

import { openaiService } from './openaiService';
import {
  getTopSellingProducts,
  getTodayRevenue,
  getMonthlyProfit,
  getLowStockProducts,
  getSalesTrend,
} from './quistQueries';
import {
  formatQuistResponse,
  formatCurrency,
  formatNumber,
  formatPercentage,
  hasTableData,
  hasChartData,
  getPrimaryDisplayType,
  type FormattedQuistResponse,
} from './quistResponseFormatter';
import type {
  QuistIntent,
  IntentClassificationResult,
  ExtractedParams,
  QuistResponse,
  QuistResponseType,
  QuistResponseMetadata,
  QuistTableConfig,
  QuistChartConfig,
  QuistAction,
  QuistConversationContext,
  QuistMessage,
  QuistError,
  QuistErrorCode,
  DateRange,
  TopSellingProduct,
  RevenueResult,
  ProfitResult,
  LowStockProduct,
  SalesTrendResult,
} from '@/types/quist';

// ============================================================================
// Constants
// ============================================================================

/** Timeout for query processing in milliseconds */
const QUERY_TIMEOUT_MS = 30000;

// ============================================================================
// Constants
// ============================================================================

const INTENT_CLASSIFICATION_PROMPT = `You are an intent classifier for a business intelligence system called Quist.
Your job is to analyze user questions about their business and classify them into specific intents.

Available intents:
- top_selling_products: Questions about best sellers, popular products, most sold items, top products, best products
- today_revenue: Questions specifically about today's sales/revenue
- revenue: Questions about revenue/sales for any time period
- monthly_profit: Questions specifically about this month's profit
- profit: Questions about profit/margins for any time period
- low_stock_products: Questions about inventory levels, low stock, items running out, products running low, stock levels
- sales_trend: Questions about sales patterns, trends, comparisons over time
- unknown: ONLY use this if the question is completely unrelated to business/sales/inventory

IMPORTANT MATCHING RULES:
- "top products" or "best products" → top_selling_products
- "low stock" or "running low" or "out of stock" → low_stock_products
- "revenue" or "sales" or "how much did I make" → revenue or today_revenue
- "profit" or "margin" → profit or monthly_profit
- "trend" or "pattern" or "over time" → sales_trend

Extract these parameters if mentioned:
- date_range: today, yesterday, this_week, last_week, this_month, last_month, this_year
- limit: A number if they ask for "top N" or "best N" items
- threshold: A number for stock level queries

Respond ONLY with valid JSON in this exact format:
{
  "intent": "intent_name",
  "params": {
    "date_range": "value_or_null",
    "limit": number_or_null,
    "threshold": number_or_null
  },
  "confidence": 0.0_to_1.0
}

User question: `;

/**
 * Follow-up query classification prompt
 * Used when there's conversation context to better understand references
 */
const FOLLOW_UP_CLASSIFICATION_PROMPT = `You are an intent classifier for a business intelligence system called Quist.
Your job is to analyze user follow-up questions and determine what they're asking about.

IMPORTANT: The user is continuing a conversation. They may use references like:
- "what about last month?" - means same query type but different time period
- "show me more" - means same query with higher limit
- "and the profit?" - means switch to profit query for same time period
- "compare to last week" - means same query type but for last_week
- "top 10 instead" - means same query with limit=10

Available intents:
- top_selling_products: Questions about best sellers, popular products, most sold items
- today_revenue: Questions specifically about today's sales/revenue
- revenue: Questions about revenue/sales for any time period
- monthly_profit: Questions specifically about this month's profit
- profit: Questions about profit/margins for any time period
- low_stock_products: Questions about inventory levels, low stock, items running out
- sales_trend: Questions about sales patterns, trends, comparisons over time
- unknown: If the question doesn't match any of the above

Extract these parameters if mentioned:
- date_range: today, yesterday, this_week, last_week, this_month, last_month, this_year
- limit: A number if they ask for "top N" or "best N" items
- threshold: A number for stock level queries

If the user's question is a follow-up that references the previous query:
1. Use the previous intent if they're asking about the same topic with different parameters
2. Extract any new parameters they mention (like a different date_range)
3. Keep previous parameters if not explicitly changed

Respond ONLY with valid JSON in this exact format:
{
  "intent": "intent_name",
  "params": {
    "date_range": "value_or_null",
    "limit": number_or_null,
    "threshold": number_or_null
  },
  "confidence": 0.0_to_1.0,
  "is_follow_up": true_or_false
}

`;

/**
 * Response generation prompts for different intent types
 * Each prompt is tailored to produce natural, helpful responses for specific data types
 */
const RESPONSE_GENERATION_PROMPTS: Record<string, string> = {
  top_selling_products: `You are Quist, a friendly business intelligence assistant for a retail shop.
The user asked about their best selling products. Generate a natural, conversational response.

Guidelines:
- Lead with the #1 product and its performance
- Mention total units sold and revenue for top items
- If there's a clear winner, highlight it
- If sales are close, mention the competition
- Keep it concise (2-3 sentences max)
- Use plain text, no markdown
- Format currency with 2 decimal places

Data: {data}
Date Range: {dateRange}

Generate a helpful, conversational response:`,

  today_revenue: `You are Quist, a friendly business intelligence assistant for a retail shop.
The user asked about today's revenue. Generate a natural, conversational response.

Guidelines:
- Lead with the total revenue figure
- Mention transaction count and average transaction value
- Compare to expectations if data suggests good/slow day
- Be encouraging if numbers are good, supportive if slow
- Keep it concise (2-3 sentences max)
- Use plain text, no markdown
- Format currency with 2 decimal places

Data: {data}

Generate a helpful, conversational response:`,

  revenue: `You are Quist, a friendly business intelligence assistant for a retail shop.
The user asked about revenue. Generate a natural, conversational response.

Guidelines:
- Lead with the total revenue figure
- Mention the time period clearly
- Include transaction count and average value
- Keep it concise (2-3 sentences max)
- Use plain text, no markdown
- Format currency with 2 decimal places

Data: {data}
Date Range: {dateRange}

Generate a helpful, conversational response:`,

  monthly_profit: `You are Quist, a friendly business intelligence assistant for a retail shop.
The user asked about profit. Generate a natural, conversational response.

Guidelines:
- Lead with the gross profit figure
- Mention the profit margin percentage
- Include revenue and cost breakdown briefly
- If margin is healthy (>20%), be positive
- If margin is low (<10%), suggest reviewing costs
- Keep it concise (2-3 sentences max)
- Use plain text, no markdown
- Format currency with 2 decimal places

Data: {data}
Date Range: {dateRange}

Generate a helpful, conversational response:`,

  profit: `You are Quist, a friendly business intelligence assistant for a retail shop.
The user asked about profit. Generate a natural, conversational response.

Guidelines:
- Lead with the gross profit figure
- Mention the profit margin percentage
- Include revenue and cost breakdown briefly
- If margin is healthy (>20%), be positive
- If margin is low (<10%), suggest reviewing costs
- Keep it concise (2-3 sentences max)
- Use plain text, no markdown
- Format currency with 2 decimal places

Data: {data}
Date Range: {dateRange}

Generate a helpful, conversational response:`,

  low_stock_products: `You are Quist, a friendly business intelligence assistant for a retail shop.
The user asked about low stock products. Generate a natural, conversational response.

Guidelines:
- If no low stock items, celebrate the good inventory management
- If there are low stock items, list the most critical ones first
- Mention current quantity vs threshold
- Suggest action if items are critically low (near 0)
- Keep it concise (2-3 sentences max)
- Use plain text, no markdown

Data: {data}

Generate a helpful, conversational response:`,

  sales_trend: `You are Quist, a friendly business intelligence assistant for a retail shop.
The user asked about sales trends. Generate a natural, conversational response.

Guidelines:
- Lead with the overall trend direction (up/down/stable)
- Mention the percentage change
- Highlight best and worst days if notable
- Include total revenue and daily average
- Be encouraging about positive trends, supportive about negative ones
- Keep it concise (2-3 sentences max)
- Use plain text, no markdown
- Format currency with 2 decimal places

Data: {data}
Period: {dateRange}

Generate a helpful, conversational response:`,

  default: `You are Quist, a friendly business intelligence assistant.
Generate a natural, conversational response based on the data provided.
Be concise but informative. Use numbers and percentages where relevant.
If the data shows concerning trends, mention them tactfully.
Format currency values appropriately.
Do not use markdown formatting - respond in plain text.

Query type: {intent}
Data: {data}

Generate a helpful response:`,
};

// ============================================================================
// Intent Classification
// ============================================================================

/**
 * Keyword-based fallback intent detection
 * Used when AI API fails or is unavailable
 */
function classifyIntentByKeywords(query: string): IntentClassificationResult {
  const queryLower = query.toLowerCase();
  
  // Product listing patterns (what products, goods in store, etc.)
  if (
    (queryLower.includes('what') || queryLower.includes('show') || queryLower.includes('list')) &&
    (queryLower.includes('product') || queryLower.includes('goods') || queryLower.includes('item') || queryLower.includes('stock')) &&
    (queryLower.includes('store') || queryLower.includes('have') || queryLower.includes('inventory'))
  ) {
    return {
      intent: 'top_selling_products',
      params: {
        dateRange: 'this_month',
        limit: 10,
      },
      confidence: 0.7,
      originalQuery: query,
    };
  }
  
  // Top selling products patterns
  if (
    queryLower.includes('top') && (queryLower.includes('product') || queryLower.includes('seller') || queryLower.includes('selling')) ||
    queryLower.includes('best') && (queryLower.includes('product') || queryLower.includes('seller') || queryLower.includes('selling')) ||
    queryLower.includes('popular') && queryLower.includes('product') ||
    queryLower.includes('most sold')
  ) {
    const limitMatch = queryLower.match(/top\s*(\d+)/);
    return {
      intent: 'top_selling_products',
      params: {
        dateRange: extractDateRange(queryLower),
        limit: limitMatch ? parseInt(limitMatch[1]) : 5,
      },
      confidence: 0.8,
      originalQuery: query,
    };
  }
  
  // Low stock patterns
  if (
    queryLower.includes('low') && queryLower.includes('stock') ||
    queryLower.includes('running low') ||
    queryLower.includes('out of stock') ||
    queryLower.includes('need to reorder') ||
    queryLower.includes('inventory') && (queryLower.includes('low') || queryLower.includes('running'))
  ) {
    return {
      intent: 'low_stock_products',
      params: {},
      confidence: 0.8,
      originalQuery: query,
    };
  }
  
  // Today's revenue patterns
  if (
    (queryLower.includes('revenue') || queryLower.includes('sales') || queryLower.includes('make') || queryLower.includes('earn')) &&
    queryLower.includes('today')
  ) {
    return {
      intent: 'today_revenue',
      params: { dateRange: 'today' },
      confidence: 0.8,
      originalQuery: query,
    };
  }
  
  // General revenue patterns
  if (
    queryLower.includes('revenue') ||
    (queryLower.includes('how much') && (queryLower.includes('make') || queryLower.includes('earn') || queryLower.includes('sales')))
  ) {
    return {
      intent: 'revenue',
      params: { dateRange: extractDateRange(queryLower) || 'this_month' },
      confidence: 0.7,
      originalQuery: query,
    };
  }
  
  // Profit patterns
  if (
    queryLower.includes('profit') ||
    queryLower.includes('margin') ||
    (queryLower.includes('make') && queryLower.includes('money'))
  ) {
    return {
      intent: 'monthly_profit',
      params: { dateRange: extractDateRange(queryLower) || 'this_month' },
      confidence: 0.8,
      originalQuery: query,
    };
  }
  
  // Sales trend patterns
  if (
    queryLower.includes('trend') ||
    queryLower.includes('trending') ||
    (queryLower.includes('sales') && (queryLower.includes('week') || queryLower.includes('month') || queryLower.includes('pattern'))) ||
    queryLower.includes('how are sales')
  ) {
    return {
      intent: 'sales_trend',
      params: { dateRange: extractDateRange(queryLower) || 'this_week' },
      confidence: 0.8,
      originalQuery: query,
    };
  }
  
  // Unknown
  return {
    intent: 'unknown',
    params: {},
    confidence: 0,
    originalQuery: query,
  };
}

/**
 * Extracts date range from query text
 */
function extractDateRange(query: string): DateRange | undefined {
  if (query.includes('today')) return 'today';
  if (query.includes('yesterday')) return 'yesterday';
  if (query.includes('this week')) return 'this_week';
  if (query.includes('last week')) return 'last_week';
  if (query.includes('this month')) return 'this_month';
  if (query.includes('last month')) return 'last_month';
  if (query.includes('this year')) return 'this_year';
  return undefined;
}

/**
 * Classifies user query into a specific intent using Gemini AI
 * Falls back to keyword-based detection if Gemini fails
 * Supports follow-up queries by using conversation context
 */
export async function classifyIntent(
  query: string,
  context?: QuistConversationContext
): Promise<IntentClassificationResult> {
  const startTime = Date.now();
  
  try {
    // Determine if this is likely a follow-up query
    const isLikelyFollowUp = context?.lastQuery && isFollowUpQuery(query);
    
    // Build context-aware prompt
    let prompt: string;
    
    if (isLikelyFollowUp && context?.lastQuery) {
      // Use follow-up prompt with previous context
      prompt = FOLLOW_UP_CLASSIFICATION_PROMPT;
      prompt += `Previous query context:
- Previous intent: ${context.lastQuery.intent}
- Previous date_range: ${context.lastQuery.params.dateRange || 'not specified'}
- Previous limit: ${context.lastQuery.params.limit || 'not specified'}

Current user question: ${query}`;
    } else {
      // Use standard prompt for new queries
      prompt = INTENT_CLASSIFICATION_PROMPT + query;
    }

    const response = await openaiService.generateContent({
      prompt,
      temperature: 0.1, // Low temperature for consistent classification
      max_tokens: 256,
    });

    // Debug logging
    console.log('Quist Intent Classification - Query:', query);
    console.log('Quist Intent Classification - Response:', response.text);

    // Parse JSON response
    const jsonMatch = response.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.warn('Quist: No JSON found in response, falling back to keyword detection');
      return classifyIntentByKeywords(query);
    }

    const parsed = JSON.parse(jsonMatch[0]);
    console.log('Quist Intent Classification - Parsed:', parsed);
    
    // For follow-up queries, merge with previous params if not explicitly changed
    let finalParams: ExtractedParams = {
      dateRange: validateDateRange(parsed.params?.date_range),
      limit: typeof parsed.params?.limit === 'number' ? parsed.params.limit : undefined,
      threshold: typeof parsed.params?.threshold === 'number' ? parsed.params.threshold : undefined,
    };
    
    // If this is a follow-up and some params weren't specified, inherit from previous query
    if (isLikelyFollowUp && context?.lastQuery && parsed.is_follow_up !== false) {
      const prevParams = context.lastQuery.params;
      
      // Inherit previous params if not explicitly set in current query
      if (!finalParams.dateRange && prevParams.dateRange) {
        finalParams.dateRange = prevParams.dateRange;
      }
      if (!finalParams.limit && prevParams.limit) {
        finalParams.limit = prevParams.limit;
      }
      if (!finalParams.threshold && prevParams.threshold) {
        finalParams.threshold = prevParams.threshold;
      }
      
      // If intent is unknown but we have context, try to use previous intent
      if (parsed.intent === 'unknown' && context.lastQuery.intent !== 'unknown') {
        return {
          intent: context.lastQuery.intent,
          params: finalParams,
          confidence: 0.6, // Lower confidence for inferred intent
          originalQuery: query,
        };
      }
    }
    
    return {
      intent: validateIntent(parsed.intent),
      params: finalParams,
      confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0.5,
      originalQuery: query,
    };
  } catch (error) {
    console.error('Intent classification error:', error);
    console.log('Falling back to keyword-based intent detection');
    // Fall back to keyword-based detection when Gemini fails
    return classifyIntentByKeywords(query);
  }
}

/**
 * Determines if a query is likely a follow-up to a previous query
 * Checks for common follow-up patterns
 */
function isFollowUpQuery(query: string): boolean {
  const queryLower = query.toLowerCase().trim();
  
  // Common follow-up patterns
  const followUpPatterns = [
    /^what about/i,
    /^how about/i,
    /^and (the|for|what)/i,
    /^show me more/i,
    /^more details/i,
    /^compare (to|with)/i,
    /^same (for|but)/i,
    /^(last|this|next) (week|month|year)/i,
    /^yesterday/i,
    /^today/i,
    /^instead/i,
    /^top \d+/i,
    /^(also|now) show/i,
    /^what('s| is) (the|my)/i,
    /^can you (also|show)/i,
  ];
  
  // Check if query matches any follow-up pattern
  for (const pattern of followUpPatterns) {
    if (pattern.test(queryLower)) {
      return true;
    }
  }
  
  // Short queries are often follow-ups
  if (queryLower.split(' ').length <= 4) {
    return true;
  }
  
  return false;
}

/**
 * Creates a fallback unknown intent result
 */
function createUnknownIntent(query: string): IntentClassificationResult {
  return {
    intent: 'unknown',
    params: {},
    confidence: 0,
    originalQuery: query,
  };
}

/**
 * Validates and normalizes intent string
 */
function validateIntent(intent: string): QuistIntent {
  const validIntents: QuistIntent[] = [
    'top_selling_products',
    'today_revenue',
    'revenue',
    'monthly_profit',
    'profit',
    'low_stock_products',
    'sales_trend',
    'customer_stats',
  ];
  
  return validIntents.includes(intent as QuistIntent) 
    ? (intent as QuistIntent) 
    : 'unknown';
}

/**
 * Validates and normalizes date range
 */
function validateDateRange(range: string | undefined): DateRange | undefined {
  const validRanges: DateRange[] = [
    'today',
    'yesterday',
    'this_week',
    'last_week',
    'this_month',
    'last_month',
    'this_year',
  ];
  
  return range && validRanges.includes(range as DateRange) 
    ? (range as DateRange) 
    : undefined;
}

// ============================================================================
// Intent to Query Function Mapping
// ============================================================================

/**
 * Type definition for query executor functions
 * Each function takes organizationId and extracted params, returns data
 */
type QueryExecutor = (
  organizationId: string,
  params: ExtractedParams
) => Promise<unknown>;

/**
 * Intent to query function mapping
 * Maps each QuistIntent to its corresponding query executor
 * This provides a clean, maintainable way to add new intents
 */
const INTENT_QUERY_MAP: Record<Exclude<QuistIntent, 'unknown'>, QueryExecutor> = {
  top_selling_products: async (orgId, params) => 
    getTopSellingProducts(
      orgId,
      params.dateRange || 'this_month',
      params.limit || 5
    ),

  today_revenue: async (orgId) => 
    getTodayRevenue(orgId),

  revenue: async (orgId, params) => {
    // For general revenue queries, use today's revenue if date_range is today
    // Otherwise use monthly profit which includes revenue data
    if (params.dateRange === 'today') {
      return getTodayRevenue(orgId);
    }
    return getMonthlyProfit(orgId, params.dateRange || 'this_month');
  },

  monthly_profit: async (orgId, params) => 
    getMonthlyProfit(orgId, params.dateRange || 'this_month'),

  profit: async (orgId, params) => 
    getMonthlyProfit(orgId, params.dateRange || 'this_month'),

  low_stock_products: async (orgId, params) => 
    getLowStockProducts(orgId, params.threshold),

  sales_trend: async (orgId, params) => 
    getSalesTrend(orgId, params.dateRange || 'this_week'),

  customer_stats: async (orgId, params) => {
    // Customer stats not yet implemented - return placeholder
    // This will be implemented when getCustomerStats is added to quistQueries
    return {
      totalCustomers: 0,
      newCustomers: 0,
      activeCustomers: 0,
      averagePurchaseValue: 0,
      topCustomers: [],
    };
  },
};

/**
 * Default suggestions shown when intent is unknown
 */
const UNKNOWN_INTENT_SUGGESTIONS = [
  "What are my best selling products?",
  "How much revenue did I make today?",
  "Which products are low on stock?",
  "Show me this week's sales trend",
];

/**
 * Checks if an intent has a mapped query function
 */
export function hasQueryMapping(intent: QuistIntent): boolean {
  return intent !== 'unknown' && intent in INTENT_QUERY_MAP;
}

/**
 * Gets the query executor for a given intent
 * Returns undefined for unknown intents
 */
export function getQueryExecutor(intent: QuistIntent): QueryExecutor | undefined {
  if (intent === 'unknown') {
    return undefined;
  }
  return INTENT_QUERY_MAP[intent];
}

/**
 * Gets all supported intents (excluding 'unknown')
 */
export function getSupportedIntents(): QuistIntent[] {
  return Object.keys(INTENT_QUERY_MAP) as QuistIntent[];
}

// ============================================================================
// Query Execution
// ============================================================================

/**
 * Executes the appropriate query based on classified intent
 * Uses the INTENT_QUERY_MAP for clean intent-to-function mapping
 */
export async function executeQuery(
  intent: QuistIntent,
  params: ExtractedParams,
  organizationId: string
): Promise<{ data: unknown; error?: QuistError }> {
  try {
    // Get the query executor for this intent
    const executor = getQueryExecutor(intent);

    // Handle unknown intents
    if (!executor) {
      return {
        data: null,
        error: {
          code: 'INTENT_UNKNOWN',
          message: "I'm not sure how to answer that question. Try asking about sales, revenue, profit, inventory, or trends.",
          suggestions: UNKNOWN_INTENT_SUGGESTIONS,
          retryable: false,
        },
      };
    }

    // Execute the mapped query function with timeout
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Query timeout')), QUERY_TIMEOUT_MS);
    });

    const data = await Promise.race([
      executor(organizationId, params),
      timeoutPromise,
    ]);
    
    return { data };

  } catch (error) {
    console.error('Query execution error:', error);
    
    // Determine error type and create appropriate response
    const errorInfo = categorizeError(error);
    
    return {
      data: null,
      error: errorInfo,
    };
  }
}

/**
 * Categorizes an error and returns appropriate QuistError
 */
function categorizeError(error: unknown): QuistError {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    
    // Network errors
    if (message.includes('network') || message.includes('fetch') || message.includes('failed to fetch')) {
      return {
        code: 'NETWORK_ERROR',
        message: "I couldn't connect to the database. Please check your internet connection and try again.",
        retryable: true,
      };
    }
    
    // Timeout errors
    if (message.includes('timeout')) {
      return {
        code: 'TIMEOUT',
        message: "The query took too long to complete. Please try a simpler question or try again later.",
        retryable: true,
      };
    }
    
    // Rate limiting
    if (message.includes('rate limit') || message.includes('429') || message.includes('too many')) {
      return {
        code: 'RATE_LIMITED',
        message: "I'm receiving too many requests right now. Please wait a moment and try again.",
        retryable: true,
      };
    }
    
    // Authorization errors
    if (message.includes('unauthorized') || message.includes('401') || message.includes('permission')) {
      return {
        code: 'UNAUTHORIZED',
        message: "You don't have permission to access this data. Please contact your administrator.",
        retryable: false,
      };
    }
    
    // Service unavailable
    if (message.includes('503') || message.includes('service unavailable') || message.includes('maintenance')) {
      return {
        code: 'SERVICE_UNAVAILABLE',
        message: "The service is temporarily unavailable. Please try again in a few minutes.",
        retryable: true,
      };
    }
  }
  
  // Default error
  return {
    code: 'QUERY_FAILED',
    message: 'Failed to fetch data. Please try again.',
    retryable: true,
  };
}

// ============================================================================
// Response Generation
// ============================================================================

/**
 * Generates a natural language response using Gemini AI
 * Uses intent-specific prompts for better, more contextual responses
 */
export async function generateResponse(
  intent: QuistIntent,
  data: unknown,
  params: ExtractedParams
): Promise<string> {
  try {
    // Get intent-specific prompt or fall back to default
    const promptTemplate = RESPONSE_GENERATION_PROMPTS[intent] || RESPONSE_GENERATION_PROMPTS.default;
    
    // Build the prompt with data and context
    const prompt = promptTemplate
      .replace('{intent}', intent)
      .replace('{data}', formatDataForPrompt(intent, data))
      .replace('{dateRange}', params.dateRange || 'not specified');

    const response = await openaiService.generateContent({
      prompt,
      temperature: 0.7,
      max_tokens: 512,
    });

    // Clean up the response - remove any accidental markdown
    const cleanedResponse = cleanResponseText(response.text);
    
    // Validate response isn't empty or too short
    if (!cleanedResponse || cleanedResponse.length < 10) {
      console.warn('AI response too short, using fallback');
      return generateFallbackResponse(intent, data);
    }

    return cleanedResponse;
  } catch (error) {
    console.error('Response generation error:', error);
    // Fallback to basic response
    return generateFallbackResponse(intent, data);
  }
}

/**
 * Formats data for inclusion in the AI prompt
 * Summarizes large datasets to avoid token limits
 */
function formatDataForPrompt(intent: QuistIntent, data: unknown): string {
  if (!data) return 'No data available';

  try {
    switch (intent) {
      case 'top_selling_products': {
        const products = data as TopSellingProduct[];
        if (!products.length) return 'No products sold in this period';
        return JSON.stringify(products.map(p => ({
          name: p.productName,
          unitsSold: p.totalQuantity,
          revenue: p.totalRevenue,
          category: p.categoryName || 'Uncategorized',
        })), null, 2);
      }

      case 'today_revenue':
      case 'revenue': {
        const revenue = data as RevenueResult;
        return JSON.stringify({
          totalRevenue: revenue.totalRevenue,
          transactionCount: revenue.transactionCount,
          averageTransactionValue: revenue.averageTransactionValue,
        }, null, 2);
      }

      case 'monthly_profit':
      case 'profit': {
        const profit = data as ProfitResult;
        return JSON.stringify({
          totalRevenue: profit.totalRevenue,
          totalCost: profit.totalCost,
          grossProfit: profit.grossProfit,
          profitMarginPercent: profit.profitMargin,
          transactionCount: profit.transactionCount,
        }, null, 2);
      }

      case 'low_stock_products': {
        const products = data as LowStockProduct[];
        if (!products.length) return 'All products are well stocked';
        return JSON.stringify(products.map(p => ({
          name: p.name,
          currentStock: p.quantity,
          threshold: p.lowStockThreshold,
          category: p.categoryName || 'Uncategorized',
        })), null, 2);
      }

      case 'sales_trend': {
        const trend = data as SalesTrendResult;
        return JSON.stringify({
          totalRevenue: trend.totalRevenue,
          averageDailyRevenue: trend.averageDailyRevenue,
          percentageChange: trend.percentageChange,
          trendDirection: trend.percentageChange >= 0 ? 'up' : 'down',
          dataPoints: trend.trend.length,
          bestDay: trend.trend.length > 0 
            ? trend.trend.reduce((best, day) => day.revenue > best.revenue ? day : best)
            : null,
          worstDay: trend.trend.length > 0
            ? trend.trend.reduce((worst, day) => day.revenue < worst.revenue ? day : worst)
            : null,
        }, null, 2);
      }

      default:
        return JSON.stringify(data, null, 2);
    }
  } catch {
    return JSON.stringify(data, null, 2);
  }
}

/**
 * Cleans up AI response text
 * Removes markdown formatting and extra whitespace
 */
function cleanResponseText(text: string): string {
  return text
    // Remove markdown bold/italic
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/__([^_]+)__/g, '$1')
    .replace(/_([^_]+)_/g, '$1')
    // Remove markdown headers
    .replace(/^#+\s*/gm, '')
    // Remove markdown lists
    .replace(/^[-*]\s+/gm, '')
    .replace(/^\d+\.\s+/gm, '')
    // Remove code blocks
    .replace(/```[^`]*```/g, '')
    .replace(/`([^`]+)`/g, '$1')
    // Clean up whitespace
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/**
 * Generates a basic response without AI when Gemini fails
 */
function generateFallbackResponse(intent: QuistIntent, data: unknown): string {
  switch (intent) {
    case 'top_selling_products': {
      const products = data as TopSellingProduct[];
      if (!products.length) return "No sales data found for this period.";
      return `Your top ${products.length} products are: ${products.map((p, i) => 
        `${i + 1}. ${p.productName} (${p.totalQuantity} units)`
      ).join(', ')}.`;
    }

    case 'today_revenue':
    case 'revenue': {
      const revenue = data as RevenueResult;
      return `Total revenue: $${revenue.totalRevenue.toFixed(2)} from ${revenue.transactionCount} transactions.`;
    }

    case 'monthly_profit':
    case 'profit': {
      const profit = data as ProfitResult;
      return `Revenue: $${profit.totalRevenue.toFixed(2)}, Profit: $${profit.grossProfit.toFixed(2)} (${profit.profitMargin.toFixed(1)}% margin).`;
    }

    case 'low_stock_products': {
      const products = data as LowStockProduct[];
      if (!products.length) return "All products are well stocked!";
      return `${products.length} products are low on stock: ${products.slice(0, 3).map(p => 
        `${p.name} (${p.quantity} left)`
      ).join(', ')}${products.length > 3 ? '...' : ''}.`;
    }

    case 'sales_trend': {
      const trend = data as SalesTrendResult;
      const direction = trend.percentageChange >= 0 ? 'up' : 'down';
      return `Sales are ${direction} ${Math.abs(trend.percentageChange).toFixed(1)}%. Total: $${trend.totalRevenue.toFixed(2)}, Daily avg: $${trend.averageDailyRevenue.toFixed(2)}.`;
    }

    default:
      return "Here's what I found based on your query.";
  }
}

// ============================================================================
// Response Formatting
// ============================================================================

/**
 * Formats query results into a rich QuistResponse
 */
export function formatResponse(
  intent: QuistIntent,
  data: unknown,
  text: string,
  params: ExtractedParams,
  processingTimeMs: number
): QuistResponse {
  const metadata: QuistResponseMetadata = {
    intent,
    params,
    processingTimeMs,
    dataTimestamp: new Date().toISOString(),
    cached: false,
  };

  // Determine response type and build appropriate structure
  const { type, table, chart, actions } = buildResponseComponents(intent, data);

  return {
    type,
    text,
    table,
    chart,
    actions,
    rawData: data,
    metadata,
  };
}

/**
 * Builds response components based on intent and data
 */
function buildResponseComponents(intent: QuistIntent, data: unknown): {
  type: QuistResponseType;
  table?: QuistTableConfig;
  chart?: QuistChartConfig;
  actions?: QuistAction[];
} {
  switch (intent) {
    case 'top_selling_products': {
      const products = data as TopSellingProduct[];
      return {
        type: products.length > 0 ? 'table' : 'text',
        table: products.length > 0 ? {
          title: 'Top Selling Products',
          columns: [
            { key: 'productName', header: 'Product', type: 'text', align: 'left' },
            { key: 'totalQuantity', header: 'Units Sold', type: 'number', align: 'right' },
            { key: 'totalRevenue', header: 'Revenue', type: 'currency', align: 'right' },
          ],
          rows: products.map(p => ({
            productName: p.productName,
            totalQuantity: p.totalQuantity,
            totalRevenue: p.totalRevenue,
          })),
        } : undefined,
        chart: products.length > 0 ? {
          type: 'bar',
          title: 'Top Products by Units Sold',
          data: products.map(p => ({
            label: p.productName,
            value: p.totalQuantity,
          })),
          xAxisLabel: 'Product',
          yAxisLabel: 'Units Sold',
        } : undefined,
        actions: [
          { label: 'View All Products', type: 'navigate', payload: '/inventory' },
        ],
      };
    }

    case 'today_revenue':
    case 'revenue': {
      const revenue = data as RevenueResult;
      return {
        type: 'text',
        actions: [
          { label: 'View Transactions', type: 'navigate', payload: '/transactions' },
          { label: 'View Reports', type: 'navigate', payload: '/reports' },
        ],
      };
    }

    case 'monthly_profit':
    case 'profit': {
      const profit = data as ProfitResult;
      return {
        type: 'text',
        chart: {
          type: 'pie',
          title: 'Revenue vs Cost',
          data: [
            { label: 'Profit', value: profit.grossProfit },
            { label: 'Cost', value: profit.totalCost },
          ],
        },
        actions: [
          { label: 'View Reports', type: 'navigate', payload: '/reports' },
        ],
      };
    }

    case 'low_stock_products': {
      const products = data as LowStockProduct[];
      return {
        type: products.length > 0 ? 'table' : 'text',
        table: products.length > 0 ? {
          title: 'Low Stock Products',
          columns: [
            { key: 'name', header: 'Product', type: 'text', align: 'left' },
            { key: 'quantity', header: 'In Stock', type: 'number', align: 'right' },
            { key: 'lowStockThreshold', header: 'Threshold', type: 'number', align: 'right' },
          ],
          rows: products.map(p => ({
            name: p.name,
            quantity: p.quantity,
            lowStockThreshold: p.lowStockThreshold,
          })),
        } : undefined,
        actions: [
          { label: 'Manage Inventory', type: 'navigate', payload: '/inventory' },
          { label: 'View Stock Predictions', type: 'navigate', payload: '/stock-predictions' },
        ],
      };
    }

    case 'sales_trend': {
      const trend = data as SalesTrendResult;
      return {
        type: trend.trend.length > 0 ? 'chart' : 'text',
        chart: trend.trend.length > 0 ? {
          type: 'line',
          title: 'Sales Trend',
          data: trend.trend.map(t => ({
            label: t.date,
            value: t.revenue,
            secondaryValue: t.transactionCount,
          })),
          xAxisLabel: 'Date',
          yAxisLabel: 'Revenue',
        } : undefined,
        actions: [
          { label: 'View Reports', type: 'navigate', payload: '/reports' },
        ],
      };
    }

    default:
      return { type: 'text' };
  }
}

// ============================================================================
// AI Fallback for Unknown Intents
// ============================================================================

/**
 * Uses AI to answer questions that don't match predefined intents
 * Fetches relevant data and lets Gemini generate a helpful response
 */
async function answerWithAI(
  query: string,
  organizationId: string,
  context?: QuistConversationContext
): Promise<string | null> {
  try {
    // Fetch some basic data that might be relevant
    const [topProducts, todayRevenue, lowStock] = await Promise.allSettled([
      getTopSellingProducts(organizationId, 'this_month', 5),
      getTodayRevenue(organizationId),
      getLowStockProducts(organizationId),
    ]);

    // Build context from available data
    let dataContext = 'Available business data:\n';
    
    if (topProducts.status === 'fulfilled' && topProducts.value.length > 0) {
      dataContext += `\nTop Products: ${topProducts.value.map(p => 
        `${p.productName} (${p.totalQuantity} sold, ${p.totalRevenue.toFixed(2)} revenue)`
      ).join(', ')}`;
    }
    
    if (todayRevenue.status === 'fulfilled') {
      dataContext += `\nToday's Revenue: ${todayRevenue.value.totalRevenue.toFixed(2)} from ${todayRevenue.value.transactionCount} transactions`;
    }
    
    if (lowStock.status === 'fulfilled' && lowStock.value.length > 0) {
      dataContext += `\nLow Stock Items: ${lowStock.value.map(p => 
        `${p.name} (${p.quantity} left)`
      ).join(', ')}`;
    }

    // Create prompt for AI
    const prompt = `You are Quist, a friendly business intelligence assistant for a retail inventory management system.
A user asked: "${query}"

${dataContext}

Based on the available data above, provide a helpful, conversational answer to their question.
If the data doesn't contain what they're asking for, politely explain what data you do have access to.
Keep your response concise (2-3 sentences) and friendly.
Use plain text, no markdown formatting.

Response:`;

    const response = await openaiService.generateContent({
      prompt,
      temperature: 0.7,
      max_tokens: 300,
    });

    const cleanedResponse = cleanResponseText(response.text);
    
    // Validate response
    if (!cleanedResponse || cleanedResponse.length < 20) {
      return null;
    }

    return cleanedResponse;
  } catch (error) {
    console.error('AI fallback error:', error);
    return null;
  }
}

// ============================================================================
// Main Orchestrator
// ============================================================================

/**
 * Main entry point for processing Quist queries
 * Orchestrates intent classification, query execution, and response generation
 */
export async function processQuery(
  query: string,
  organizationId: string,
  context?: QuistConversationContext
): Promise<QuistResponse> {
  const startTime = Date.now();

  // Step 1: Classify intent
  const classification = await classifyIntent(query, context);

  // Step 1.5: Handle unknown intents - try to answer with AI before showing suggestions
  if (classification.intent === 'unknown' || classification.confidence < 0.3) {
    console.log(`Unknown intent detected for query: "${query}" (confidence: ${classification.confidence})`);
    console.log('Attempting AI fallback...');
    
    // Try to answer the question using AI with available data context
    try {
      const aiResponse = await answerWithAI(query, organizationId, context);
      console.log('AI fallback response:', aiResponse ? 'Success' : 'No response');
      
      if (aiResponse) {
        console.log('Returning AI-generated response');
        return {
          type: 'text',
          text: aiResponse,
          actions: [
            { label: 'What are my best selling products?', type: 'query', payload: 'What are my best selling products?' },
            { label: 'How much revenue did I make today?', type: 'query', payload: 'How much revenue did I make today?' },
          ],
          metadata: {
            intent: 'unknown',
            params: classification.params,
            processingTimeMs: Date.now() - startTime,
            dataTimestamp: new Date().toISOString(),
            cached: false,
          },
        };
      }
      console.log('AI response was null or too short, falling back to suggestions');
    } catch (error) {
      console.error('AI fallback failed with error:', error);
      if (error instanceof Error) {
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
      }
    }
    
    // If AI fails, show suggestions
    console.log('Showing suggestion fallback');
    return handleUnknownIntentWithContext(query, context, Date.now() - startTime);
  }

  // Step 2: Execute query
  const { data, error } = await executeQuery(
    classification.intent,
    classification.params,
    organizationId
  );

  // Handle errors
  if (error) {
    return {
      type: 'error',
      text: error.message,
      actions: error.suggestions?.map(s => ({
        label: s,
        type: 'query' as const,
        payload: s,
      })),
      metadata: {
        intent: classification.intent,
        params: classification.params,
        processingTimeMs: Date.now() - startTime,
        dataTimestamp: new Date().toISOString(),
        cached: false,
      },
    };
  }

  // Step 3: Generate natural language response
  const text = await generateResponse(
    classification.intent,
    data,
    classification.params
  );

  // Step 4: Format and return response
  return formatResponse(
    classification.intent,
    data,
    text,
    classification.params,
    Date.now() - startTime
  );
}

// ============================================================================
// Conversation Context Management
// ============================================================================

/**
 * Creates a new conversation context
 */
export function createConversationContext(
  organizationId: string,
  userId: string
): QuistConversationContext {
  return {
    sessionId: crypto.randomUUID(),
    organizationId,
    userId,
    messages: [],
    startedAt: new Date().toISOString(),
    lastActivityAt: new Date().toISOString(),
  };
}

/**
 * Updates conversation context with a new message exchange
 */
export function updateConversationContext(
  context: QuistConversationContext,
  userQuery: string,
  response: QuistResponse
): QuistConversationContext {
  const now = new Date().toISOString();
  
  const userMessage: QuistMessage = {
    id: crypto.randomUUID(),
    role: 'user',
    content: userQuery,
    timestamp: now,
  };

  const assistantMessage: QuistMessage = {
    id: crypto.randomUUID(),
    role: 'assistant',
    content: response.text,
    timestamp: now,
    response,
  };

  return {
    ...context,
    messages: [...context.messages, userMessage, assistantMessage],
    lastQuery: {
      intent: response.metadata.intent,
      params: response.metadata.params,
      timestamp: now,
    },
    lastActivityAt: now,
  };
}

// ============================================================================
// Error Handling
// ============================================================================

/**
 * Creates a QuistError response
 */
export function createErrorResponse(
  code: QuistErrorCode,
  message: string,
  suggestions?: string[],
  retryable: boolean = true
): QuistResponse {
  return {
    type: 'error',
    text: message,
    actions: suggestions?.map(s => ({
      label: s,
      type: 'query' as const,
      payload: s,
    })),
    metadata: {
      intent: 'unknown',
      params: {},
      processingTimeMs: 0,
      dataTimestamp: new Date().toISOString(),
      cached: false,
    },
  };
}

/**
 * Handles unknown intent with helpful suggestions
 */
export function handleUnknownIntent(query: string): QuistResponse {
  return createErrorResponse(
    'INTENT_UNKNOWN',
    "I'm not sure how to answer that. Here are some things I can help with:",
    [
      "What are my best selling products?",
      "How much revenue did I make today?",
      "Did I make profit this month?",
      "Which products are low on stock?",
      "Show me this week's sales trend",
    ]
  );
}

/**
 * Handles unknown intent with context-aware suggestions
 * Provides more helpful fallback responses based on the query content
 */
export function handleUnknownIntentWithContext(
  query: string,
  context?: QuistConversationContext,
  processingTimeMs: number = 0
): QuistResponse {
  // Analyze query to provide relevant suggestions
  const suggestions = getContextualSuggestions(query, context);
  const message = generateFallbackMessage(query);

  return {
    type: 'text',
    text: message,
    actions: suggestions.map(s => ({
      label: s,
      type: 'query' as const,
      payload: s,
    })),
    metadata: {
      intent: 'unknown',
      params: {},
      processingTimeMs,
      dataTimestamp: new Date().toISOString(),
      cached: false,
    },
  };
}

/**
 * Generates a friendly fallback message based on the query
 */
function generateFallbackMessage(query: string): string {
  const queryLower = query.toLowerCase();
  
  // Check for common patterns and provide targeted guidance
  if (queryLower.includes('help') || queryLower.includes('what can you')) {
    return "I'm Quist, your business intelligence assistant! I can help you with sales data, revenue, profit analysis, inventory levels, and sales trends. Try asking me one of the questions below!";
  }
  
  if (queryLower.includes('customer') || queryLower.includes('client')) {
    return "Customer analytics are coming soon! For now, I can help you with sales, revenue, profit, and inventory questions. Try one of these:";
  }
  
  if (queryLower.includes('employee') || queryLower.includes('staff') || queryLower.includes('team')) {
    return "Staff performance data isn't available through Quist yet. Check the Manager Overview page for team insights. In the meantime, I can help with:";
  }
  
  if (queryLower.includes('forecast') || queryLower.includes('predict') || queryLower.includes('future')) {
    return "For predictions and forecasts, check out the Stock Predictions page. I can help you with current data like sales trends and inventory levels:";
  }

  // Default friendly message
  return "I'm not quite sure what you're looking for, but I'd love to help! Here are some questions I can answer:";
}

/**
 * Gets contextual suggestions based on query content and conversation history
 */
function getContextualSuggestions(
  query: string,
  context?: QuistConversationContext
): string[] {
  const queryLower = query.toLowerCase();
  const baseSuggestions = [
    "What are my best selling products?",
    "How much revenue did I make today?",
    "Did I make profit this month?",
    "Which products are low on stock?",
    "Show me this week's sales trend",
  ];

  // If query mentions specific topics, prioritize related suggestions
  if (queryLower.includes('sell') || queryLower.includes('product') || queryLower.includes('item')) {
    return [
      "What are my best selling products?",
      "What are my top 10 products this month?",
      "Which products are low on stock?",
      "How much revenue did I make today?",
      "Show me this week's sales trend",
    ];
  }

  if (queryLower.includes('money') || queryLower.includes('earn') || queryLower.includes('revenue') || queryLower.includes('income')) {
    return [
      "How much revenue did I make today?",
      "What's my revenue this week?",
      "Did I make profit this month?",
      "Show me this week's sales trend",
      "What are my best selling products?",
    ];
  }

  if (queryLower.includes('profit') || queryLower.includes('margin') || queryLower.includes('cost')) {
    return [
      "Did I make profit this month?",
      "What's my profit margin this week?",
      "How much revenue did I make today?",
      "What are my best selling products?",
      "Show me this week's sales trend",
    ];
  }

  if (queryLower.includes('stock') || queryLower.includes('inventory') || queryLower.includes('running out') || queryLower.includes('reorder')) {
    return [
      "Which products are low on stock?",
      "What products need reordering?",
      "What are my best selling products?",
      "Show me this week's sales trend",
      "How much revenue did I make today?",
    ];
  }

  if (queryLower.includes('trend') || queryLower.includes('pattern') || queryLower.includes('compare') || queryLower.includes('growth')) {
    return [
      "Show me this week's sales trend",
      "How are sales trending this month?",
      "What are my best selling products?",
      "Did I make profit this month?",
      "How much revenue did I make today?",
    ];
  }

  // If there's conversation context, suggest follow-ups based on last query
  if (context?.lastQuery) {
    const lastIntent = context.lastQuery.intent;
    switch (lastIntent) {
      case 'top_selling_products':
        return [
          "What about last month?",
          "Show me the top 10 products",
          "How much revenue did these generate?",
          "Which products are low on stock?",
          "Show me this week's sales trend",
        ];
      case 'today_revenue':
      case 'revenue':
        return [
          "What about this week?",
          "Did I make profit?",
          "What are my best selling products?",
          "Show me the sales trend",
          "Which products are low on stock?",
        ];
      case 'monthly_profit':
      case 'profit':
        return [
          "What about last month?",
          "How much revenue did I make?",
          "What are my best selling products?",
          "Show me this week's sales trend",
          "Which products are low on stock?",
        ];
      case 'low_stock_products':
        return [
          "What are my best selling products?",
          "Show me this week's sales trend",
          "How much revenue did I make today?",
          "Did I make profit this month?",
          "What products need reordering?",
        ];
      case 'sales_trend':
        return [
          "What about this month?",
          "What are my best selling products?",
          "Did I make profit?",
          "Which products are low on stock?",
          "How much revenue did I make today?",
        ];
    }
  }

  return baseSuggestions;
}

// ============================================================================
// Export Service Object
// ============================================================================

// ============================================================================
// Combined Response Formatting
// ============================================================================

/**
 * Processes a query and returns a fully formatted response ready for UI display
 * This is the main entry point that combines AI text with structured data
 */
export async function processAndFormatQuery(
  query: string,
  organizationId: string,
  context?: QuistConversationContext
): Promise<FormattedQuistResponse> {
  // Process the query to get raw response
  const response = await processQuery(query, organizationId, context);
  
  // Format the response for display
  return formatQuistResponse(response);
}

/**
 * Formats an existing QuistResponse for display
 * Useful when you already have a response and need to format it
 */
export function formatResponseForDisplay(response: QuistResponse): FormattedQuistResponse {
  return formatQuistResponse(response);
}

// ============================================================================
// Export Service Object
// ============================================================================

export const quistService = {
  // Main query processing
  processQuery,
  processAndFormatQuery,
  
  // Intent classification
  classifyIntent,
  
  // Query execution
  executeQuery,
  
  // Response generation
  generateResponse,
  formatResponse,
  formatResponseForDisplay,
  
  // Conversation context
  createConversationContext,
  updateConversationContext,
  
  // Error handling
  createErrorResponse,
  handleUnknownIntent,
  handleUnknownIntentWithContext,
  
  // Intent mapping utilities
  hasQueryMapping,
  getQueryExecutor,
  getSupportedIntents,
  
  // Re-export formatter utilities for convenience
  formatCurrency,
  formatNumber,
  formatPercentage,
  hasTableData,
  hasChartData,
  getPrimaryDisplayType,
};

// Re-export types for convenience
export type { FormattedQuistResponse };

export default quistService;
