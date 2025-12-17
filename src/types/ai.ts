/**
 * AI/ML Type Definitions
 * 
 * Types for AI-powered features including predictions, insights, and chatbot
 */

// ===== Stock Prediction =====

export interface StockPrediction {
  product_id: string;
  product_name: string;
  current_stock: number;
  predicted_stockout_date: string | null;
  days_until_stockout: number | null;
  recommended_reorder_quantity: number;
  recommended_reorder_date: string;
  confidence: number;
  forecast: StockForecastPoint[];
}

export interface StockForecastPoint {
  date: string;
  predicted_sales: number;
  predicted_stock_level: number;
  confidence_lower: number;
  confidence_upper: number;
}

export interface StockPredictionRequest {
  product_id: string;
  forecast_days?: number;
  confidence_level?: number;
}

// ===== Anomaly Detection =====

export interface TransactionAnomaly {
  id: string;
  transaction_id: string;
  detected_at: string;
  anomaly_type: AnomalyType;
  severity: 'low' | 'medium' | 'high' | 'critical';
  confidence: number;
  description: string;
  details: AnomalyDetails;
  status: 'pending' | 'reviewed' | 'resolved' | 'false_positive';
  reviewed_by?: string;
  reviewed_at?: string;
  notes?: string;
}

export type AnomalyType =
  | 'unusual_amount'
  | 'unusual_time'
  | 'unusual_discount'
  | 'frequent_voids'
  | 'price_override'
  | 'negative_inventory'
  | 'duplicate_transaction'
  | 'suspicious_pattern';

export interface AnomalyDetails {
  transaction_amount?: number;
  average_amount?: number;
  deviation_percentage?: number;
  transaction_time?: string;
  normal_hours?: string;
  cashier_id?: string;
  [key: string]: any;
}

// ===== Seasonal Predictions =====

export interface SeasonalForecast {
  period: string;
  start_date: string;
  end_date: string;
  predicted_revenue: number;
  predicted_transactions: number;
  growth_percentage: number;
  confidence: number;
  top_categories: CategoryForecast[];
  peak_days: string[];
  recommendations: string[];
}

export interface CategoryForecast {
  category_id: string;
  category_name: string;
  predicted_sales: number;
  growth_percentage: number;
  recommended_stock_increase: number;
}

// ===== Smart Insights =====

export interface SmartInsight {
  id: string;
  type: InsightType;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  category: InsightCategory;
  data: any;
  recommendations: string[];
  created_at: string;
  expires_at?: string;
}

export type InsightType =
  | 'sales_trend'
  | 'inventory_alert'
  | 'pricing_opportunity'
  | 'seasonal_pattern'
  | 'customer_behavior'
  | 'performance_metric';

export type InsightCategory =
  | 'sales'
  | 'inventory'
  | 'customers'
  | 'operations'
  | 'finance';

// ===== AI Chatbot =====

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  metadata?: ChatMessageMetadata;
}

export interface ChatMessageMetadata {
  query_type?: string;
  data_sources?: string[];
  confidence?: number;
  processing_time?: number;
}

export interface ChatSession {
  id: string;
  organization_id: string;
  user_id: string;
  started_at: string;
  last_message_at: string;
  messages: ChatMessage[];
  context: ChatContext;
}

export interface ChatContext {
  date_range?: { start: string; end: string };
  selected_products?: string[];
  selected_categories?: string[];
  conversation_history: string[];
}

export interface ChatbotQuery {
  message: string;
  session_id?: string;
  context?: Partial<ChatContext>;
}

export interface ChatbotResponse {
  message: string;
  session_id: string;
  suggestions?: string[];
  data?: any;
  charts?: ChartData[];
}

export interface ChartData {
  type: 'line' | 'bar' | 'pie' | 'area';
  title: string;
  data: any[];
  config?: any;
}

// ===== Gemini API =====

export interface GeminiRequest {
  prompt: string;
  context?: string;
  temperature?: number;
  max_tokens?: number;
  system_instruction?: string;
}

export interface GeminiResponse {
  text: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  finish_reason?: string;
}

// ===== AI Service Configuration =====

export interface AIServiceConfig {
  enabled: boolean;
  gemini_api_key?: string;
  model: string;
  max_requests_per_day: number;
  cache_ttl: number;
  features: {
    chatbot: boolean;
    stock_prediction: boolean;
    anomaly_detection: boolean;
    seasonal_forecast: boolean;
    smart_insights: boolean;
  };
}

// ===== AI Analytics =====

export interface AIUsageStats {
  organization_id: string;
  period: string;
  chatbot_queries: number;
  predictions_generated: number;
  anomalies_detected: number;
  insights_created: number;
  total_api_calls: number;
  total_tokens_used: number;
  estimated_cost: number;
}

// ===== Feature Access =====

export interface AIFeatureAccess {
  chatbot: {
    enabled: boolean;
    daily_limit: number;
    used_today: number;
  };
  predictions: {
    enabled: boolean;
    monthly_limit: number;
    used_this_month: number;
  };
  anomaly_detection: {
    enabled: boolean;
    real_time: boolean;
  };
  insights: {
    enabled: boolean;
    auto_generate: boolean;
  };
}
