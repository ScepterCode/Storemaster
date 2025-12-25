/**
 * OpenAI Service
 * 
 * Wrapper for OpenAI API integration
 * Handles all AI-powered analysis and predictions
 */

import { GeminiRequest, GeminiResponse } from '@/types/ai';

const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

export class OpenAIService {
  private apiKey: string;
  private model: string;

  constructor(apiKey?: string, model: string = 'gpt-3.5-turbo') {
    this.apiKey = apiKey || OPENAI_API_KEY;
    this.model = model;
  }

  /**
   * Generate content using OpenAI API
   */
  async generateContent(request: GeminiRequest): Promise<GeminiResponse> {
    if (!this.apiKey) {
      console.error('OpenAI API key not configured. Please set VITE_OPENAI_API_KEY in .env.local');
      throw new Error('OpenAI API key not configured');
    }

    try {
      console.log('OpenAI API: Making request...');
      
      const messages = [];
      
      // Add system message if provided
      if (request.system_instruction) {
        messages.push({
          role: 'system',
          content: request.system_instruction
        });
      }
      
      // Build user message with context and prompt
      let userContent = '';
      if (request.context) {
        userContent += `Context:\n${request.context}\n\n`;
      }
      userContent += request.prompt;
      
      messages.push({
        role: 'user',
        content: userContent
      });

      const response = await fetch(OPENAI_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          messages,
          temperature: request.temperature || 0.7,
          max_tokens: request.max_tokens || 2048,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('OpenAI API error response:', error);
        throw new Error(`OpenAI API error: ${error.error?.message || 'Unknown error'}`);
      }

      const data = await response.json();
      const text = data.choices?.[0]?.message?.content || '';
      
      console.log('OpenAI API: Response received, length:', text.length);

      return {
        text,
        usage: {
          prompt_tokens: data.usage?.prompt_tokens || 0,
          completion_tokens: data.usage?.completion_tokens || 0,
          total_tokens: data.usage?.total_tokens || 0,
        },
        finish_reason: data.choices?.[0]?.finish_reason,
      };
    } catch (error) {
      console.error('OpenAI API error:', error);
      throw error;
    }
  }

  /**
   * Analyze sales data
   */
  async analyzeSales(salesData: any[], dateRange: { start: string; end: string }): Promise<string> {
    const prompt = `Analyze the following sales data for the period ${dateRange.start} to ${dateRange.end}:

${JSON.stringify(salesData, null, 2)}

Provide insights on:
1. Top performing products
2. Sales trends
3. Revenue patterns
4. Recommendations for improvement

Keep the analysis concise and actionable.`;

    const response = await this.generateContent({
      prompt,
      temperature: 0.7,
      max_tokens: 1000,
    });

    return response.text;
  }

  /**
   * Generate stock predictions
   */
  async predictStock(productData: any, historicalData: any[]): Promise<string> {
    const prompt = `Based on the following product and historical sales data, predict future stock needs:

Product: ${JSON.stringify(productData, null, 2)}
Historical Data: ${JSON.stringify(historicalData, null, 2)}

Provide:
1. Predicted demand for next 30 days
2. Recommended reorder point
3. Optimal stock level
4. Risk factors to consider

Be specific with numbers and reasoning.`;

    const response = await this.generateContent({
      prompt,
      temperature: 0.5,
      max_tokens: 800,
    });

    return response.text;
  }

  /**
   * Detect anomalies in data
   */
  async detectAnomalies(data: any[], metric: string): Promise<string> {
    const prompt = `Analyze the following ${metric} data for anomalies:

${JSON.stringify(data, null, 2)}

Identify:
1. Unusual patterns or outliers
2. Potential causes
3. Impact assessment
4. Recommended actions

Focus on actionable insights.`;

    const response = await this.generateContent({
      prompt,
      temperature: 0.3,
      max_tokens: 800,
    });

    return response.text;
  }
}

// Export singleton instance
export const openaiService = new OpenAIService();

export default openaiService;
