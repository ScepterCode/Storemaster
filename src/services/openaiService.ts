/**
 * OpenAI Service (Now using Gemini)
 * 
 * Wrapper for AI API integration
 * Handles all AI-powered analysis and predictions
 * Currently configured to use Google Gemini API
 */

import { GeminiRequest, GeminiResponse } from '@/types/ai';

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models';

export class OpenAIService {
  private apiKey: string;
  private model: string;
  private useGemini: boolean;

  constructor(apiKey?: string, model: string = 'gemini-pro') {
    // Prefer Gemini if available, fallback to OpenAI
    this.useGemini = !!GEMINI_API_KEY;
    this.apiKey = apiKey || (this.useGemini ? GEMINI_API_KEY : OPENAI_API_KEY);
    this.model = model;
  }

  /**
   * Generate content using Gemini or OpenAI API
   */
  async generateContent(request: GeminiRequest): Promise<GeminiResponse> {
    if (!this.apiKey) {
      console.error('AI API key not configured. Please set VITE_GEMINI_API_KEY or VITE_OPENAI_API_KEY in .env.local');
      throw new Error('AI API key not configured');
    }

    if (this.useGemini) {
      return this.generateWithGemini(request);
    } else {
      return this.generateWithOpenAI(request);
    }
  }

  /**
   * Generate content using Google Gemini API
   */
  private async generateWithGemini(request: GeminiRequest): Promise<GeminiResponse> {
    try {
      console.log('Gemini API: Making request...');
      
      // Build the prompt with context and system instruction
      let fullPrompt = '';
      if (request.system_instruction) {
        fullPrompt += `${request.system_instruction}\n\n`;
      }
      if (request.context) {
        fullPrompt += `Context:\n${request.context}\n\n`;
      }
      fullPrompt += request.prompt;

      const url = `${GEMINI_API_URL}/${this.model}:generateContent?key=${this.apiKey}`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: fullPrompt
            }]
          }],
          generationConfig: {
            temperature: request.temperature || 0.7,
            maxOutputTokens: request.max_tokens || 2048,
          },
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('Gemini API error response:', error);
        throw new Error(`Gemini API error: ${error.error?.message || 'Unknown error'}`);
      }

      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      
      console.log('Gemini API: Response received, length:', text.length);

      return {
        text,
        usage: {
          prompt_tokens: data.usageMetadata?.promptTokenCount || 0,
          completion_tokens: data.usageMetadata?.candidatesTokenCount || 0,
          total_tokens: data.usageMetadata?.totalTokenCount || 0,
        },
        finish_reason: data.candidates?.[0]?.finishReason,
      };
    } catch (error) {
      console.error('Gemini API error:', error);
      throw error;
    }
  }

  /**
   * Generate content using OpenAI API (fallback)
   */
  private async generateWithOpenAI(request: GeminiRequest): Promise<GeminiResponse> {
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

      const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';
      const response = await fetch(OPENAI_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
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
