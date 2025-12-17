/**
 * Stock Prediction Edge Function
 * 
 * Calls the Python ML service to predict stock reorder requirements
 * Integrates the Logistic Regression model for inventory optimization
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PredictionRequest {
  product_id: string;
  cost_price: number;
  selling_price: number;
  profit_margin: number;
  reorder_frequency: number;
  current_stock: number;
  minimum_stock_level: number;
  category: string;
  brand: string;
  supplier: string;
}

interface PredictionResponse {
  product_id: string;
  reorder_required: boolean;
  confidence: number;
  recommendation: string;
  predicted_stockout_days?: number;
  suggested_reorder_quantity?: number;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Get the ML service URL from environment
    const ML_SERVICE_URL = Deno.env.get('ML_SERVICE_URL') || 'http://localhost:8000';
    
    // Parse request body
    const { product_data, organization_id } = await req.json();

    if (!product_data) {
      throw new Error('Product data is required');
    }

    // Validate required fields
    const requiredFields = [
      'cost_price', 'selling_price', 'current_stock', 
      'minimum_stock_level', 'category'
    ];
    
    for (const field of requiredFields) {
      if (product_data[field] === undefined) {
        throw new Error(`Missing required field: ${field}`);
      }
    }

    // Calculate derived fields if not provided
    if (!product_data.profit_margin) {
      product_data.profit_margin = 
        ((product_data.selling_price - product_data.cost_price) / product_data.cost_price) * 100;
    }

    // Set defaults for optional fields
    product_data.reorder_frequency = product_data.reorder_frequency || 30;
    product_data.brand = product_data.brand || 'Generic';
    product_data.supplier = product_data.supplier || 'Default';

    // Call Python ML service
    const mlResponse = await fetch(`${ML_SERVICE_URL}/predict`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(product_data),
    });

    if (!mlResponse.ok) {
      throw new Error(`ML service error: ${mlResponse.statusText}`);
    }

    const prediction = await mlResponse.json();

    // Calculate additional insights
    const daysUntilStockout = calculateStockoutDays(
      product_data.current_stock,
      product_data.reorder_frequency
    );

    const suggestedQuantity = calculateReorderQuantity(
      product_data.current_stock,
      product_data.minimum_stock_level,
      product_data.reorder_frequency
    );

    // Prepare response
    const response: PredictionResponse = {
      product_id: product_data.product_id,
      reorder_required: prediction.reorder_required,
      confidence: prediction.confidence || 0.95,
      recommendation: generateRecommendation(
        prediction.reorder_required,
        daysUntilStockout,
        product_data.current_stock
      ),
      predicted_stockout_days: daysUntilStockout,
      suggested_reorder_quantity: suggestedQuantity,
    };

    // Log prediction for analytics (optional)
    if (organization_id) {
      await logPrediction(organization_id, product_data.product_id, response);
    }

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Stock prediction error:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Internal server error',
        details: error.toString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});

/**
 * Calculate days until stockout based on current stock and reorder frequency
 */
function calculateStockoutDays(currentStock: number, reorderFrequency: number): number {
  if (currentStock <= 0) return 0;
  
  // Estimate daily usage based on reorder frequency
  const estimatedDailyUsage = 1 / (reorderFrequency / 30);
  const daysRemaining = currentStock / estimatedDailyUsage;
  
  return Math.floor(daysRemaining);
}

/**
 * Calculate suggested reorder quantity
 */
function calculateReorderQuantity(
  currentStock: number,
  minimumStock: number,
  reorderFrequency: number
): number {
  // Safety stock: 1.5x minimum stock level
  const safetyStock = minimumStock * 1.5;
  
  // Reorder quantity: enough to last until next reorder + safety stock
  const estimatedUsage = (reorderFrequency / 30) * 2; // 2 units per day estimate
  const reorderQuantity = Math.max(
    safetyStock - currentStock,
    estimatedUsage + safetyStock - currentStock
  );
  
  return Math.ceil(reorderQuantity);
}

/**
 * Generate human-readable recommendation
 */
function generateRecommendation(
  reorderRequired: boolean,
  daysUntilStockout: number,
  currentStock: number
): string {
  if (!reorderRequired) {
    return `Stock level is sufficient. Current stock: ${currentStock} units.`;
  }

  if (daysUntilStockout <= 0) {
    return `⚠️ URGENT: Out of stock! Reorder immediately.`;
  } else if (daysUntilStockout <= 7) {
    return `⚠️ Critical: Stock will run out in ${daysUntilStockout} days. Reorder now.`;
  } else if (daysUntilStockout <= 14) {
    return `⚡ Warning: Stock will run out in ${daysUntilStockout} days. Plan reorder soon.`;
  } else {
    return `📊 Stock below minimum level. Consider reordering within ${daysUntilStockout} days.`;
  }
}

/**
 * Log prediction for analytics and monitoring
 */
async function logPrediction(
  organizationId: string,
  productId: string,
  prediction: PredictionResponse
): Promise<void> {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    await supabase.from('ai_predictions').insert({
      organization_id: organizationId,
      product_id: productId,
      prediction_type: 'stock_reorder',
      prediction_data: prediction,
      created_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Failed to log prediction:', error);
    // Don't throw - logging failure shouldn't break the prediction
  }
}
