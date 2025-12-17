/**
 * Gemini AI Service
 * 
 * Wrapper for Google Gemini API integration
 * Handles all AI-powered analysis and predictions
 */

import { GeminiRequest, GeminiResponse } from '@/types/ai';

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';

export class GeminiService {
  private apiKey: string;
  private model: string;

  constructor(apiKey?: string, model: string = 'gemini-pro') {
    this.apiKey = apiKey || GEMINI_API_KEY;
    this.model = model;
  }

  /**
   * Generate content using Gemini API
   */
  async generateContent(request: GeminiRequest): Promise<GeminiResponse> {
    if (!this.apiKey) {
      throw new Error('Gemini API key not configured');
    }

    try {
      const response = await fetch(`${GEMINI_API_URL}?key=${this.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: this.buildPrompt(request)
            }]
          }],
          generationConfig: {
            temperature: request.temperature || 0.7,
            maxOutputTokens: request.max_tokens || 2048,
          }
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Gemini API error: ${error.error?.message || 'Unknown error'}`);
      }

      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

      return {
        text,
        usage: {
          prompt_tokens: 0, // Gemini doesn't provide token counts in response
          completion_tokens: 0,
          total_tokens: 0,
        },
        finish_reason: data.candidates?.[0]?.finishReason,
      };
    } catch (error) {
      console.error('Gemini API error:', error);
      throw error;
    }
  }

  /**
   * Build prompt with context and system instructions
   */
  private buildPrompt(request: GeminiRequest): string {
    let prompt = '';

    if (request.system_instruction) {
      prompt += `${request.system_instruction}\n\n`;
    }

    if (request.context) {
      prompt += `Context:\n${request.context}\n\n`;
    }

    prompt += request.prompt;

    return prompt;
  }

  /**
   * Analyze sales data
   */
  async analyzeSales(salesData: any[], dateRange: { start: string; end: string }): Promise<string> {
    const prompt = `
You are a business analyst AI. Analyze the following sales data and provide insights.

Sales Data Summary:
- Period: ${dateRange.start} to ${dateRange.end}
- Total Transactions: ${salesData.length}
- Total Revenue: ${salesData.reduce((sum, s) => sum + s.amount, 0)}

Data: ${JSON.stringify(salesData.slice(0, 100))} ${salesData.length > 100 ? '...(truncated)' : ''}

Please provide:
1. Key trends and patterns
2. Best performing products/categories
3. Underperforming items
4. Recommendations for improvement
5. Seasonal insights if applicable

Format your response in a clear, actionable way with emojis for visual appeal.
`;

    const response = await this.generateContent({
      prompt,
      system_instruction: 'You are a helpful business intelligence assistant specializing in retail analytics.',
      temperature: 0.7,
    });

    return response.text;
  }

  /**
   * Predict inventory needs
   */
  async predictInventoryNeeds(inventoryData: any[], salesHistory: any[]): Promise<string> {
    const prompt = `
Analyze this inventory and sales data to predict restocking needs.

Current Inventory: ${JSON.stringify(inventoryData)}
Recent Sales: ${JSON.stringify(salesHistory.slice(-30))}

Provide:
1. Products that need immediate restocking
2. Recommended reorder quantities
3. Optimal reorder timing
4. Products with excess stock
5. Seasonal considerations

Be specific with numbers and dates.
`;

    const response = await this.generateContent({
      prompt,
      system_instruction: 'You are an inventory management expert.',
      temperature: 0.5,
    });

    return response.text;
  }

  /**
   * Detect transaction anomalies
   */
  async detectAnomalies(transactions: any[], baseline: any): Promise<string> {
    const prompt = `
Review these transactions for anomalies.

Baseline Metrics:
- Average transaction: ${baseline.avgAmount}
- Normal hours: ${baseline.normalHours}
- Typical discount: ${baseline.avgDiscount}%

Recent Transactions: ${JSON.stringify(transactions)}

Identify:
1. Unusual amounts (>3x average)
2. Off-hours transactions
3. Excessive discounts
4. Suspicious patterns
5. Potential fraud indicators

Rate each anomaly by severity (low/medium/high/critical).
`;

    const response = await this.generateContent({
      prompt,
      system_instruction: 'You are a fraud detection specialist.',
      temperature: 0.3,
    });

    return response.text;
  }

  /**
   * Generate seasonal forecast
   */
  async generateSeasonalForecast(historicalData: any[], targetPeriod: string): Promise<string> {
    const prompt = `
Generate a seasonal forecast for ${targetPeriod}.

Historical Data: ${JSON.stringify(historicalData)}

Provide:
1. Expected revenue range
2. Peak sales days
3. Top product categories
4. Recommended inventory levels
5. Marketing suggestions
6. Staffing recommendations

Include confidence levels and explain your reasoning.
`;

    const response = await this.generateContent({
      prompt,
      system_instruction: 'You are a retail forecasting expert.',
      temperature: 0.6,
    });

    return response.text;
  }

  /**
   * Answer business questions (chatbot)
   */
  async answerQuestion(question: string, businessContext: any): Promise<string> {
    const prompt = `
Business Context:
${JSON.stringify(businessContext, null, 2)}

User Question: ${question}

Provide a helpful, accurate answer based on the business data. If you need more information, ask clarifying questions.
Use a friendly, professional tone. Include relevant numbers and insights.
`;

    const response = await this.generateContent({
      prompt,
      system_instruction: 'You are a helpful business assistant for a retail POS system.',
      temperature: 0.7,
    });

    return response.text;
  }
}

// Export singleton instance
export const geminiService = new GeminiService();
