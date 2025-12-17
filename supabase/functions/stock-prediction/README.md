# Stock Prediction Edge Function

## Overview
Supabase Edge Function that integrates with your Python ML service to predict stock reorder requirements.

## Architecture

```
Frontend (React)
    ↓
Supabase Edge Function (Deno)
    ↓
Python ML Service (FastAPI)
    ↓
Trained Model (Logistic Regression)
    ↓
Prediction Response
```

## Setup

### 1. Deploy Python ML Service

First, deploy your Python service. See `ml/python-service/` for the FastAPI implementation.

### 2. Set Environment Variables

In Supabase Dashboard → Edge Functions → Secrets:

```bash
ML_SERVICE_URL=https://your-ml-service.railway.app
SUPABASE_URL=your-supabase-url
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 3. Deploy Edge Function

```bash
supabase functions deploy stock-prediction
```

## Usage

### From Frontend

```typescript
import { supabase } from '@/integrations/supabase/client';

const predictStockReorder = async (product: Product) => {
  const { data, error } = await supabase.functions.invoke('stock-prediction', {
    body: {
      product_data: {
        product_id: product.id,
        cost_price: product.unitPrice,
        selling_price: product.unitPrice * 1.3,
        profit_margin: 30,
        reorder_frequency: 30,
        current_stock: product.quantity,
        minimum_stock_level: 10,
        category: product.categoryName || 'General',
        brand: 'Generic',
        supplier: 'Default'
      },
      organization_id: organizationId
    }
  });

  if (error) throw error;
  return data;
};
```

### Response Format

```json
{
  "product_id": "prod_123",
  "reorder_required": true,
  "confidence": 0.98,
  "recommendation": "⚠️ Critical: Stock will run out in 5 days. Reorder now.",
  "predicted_stockout_days": 5,
  "suggested_reorder_quantity": 50
}
```

## Features

### Automatic Calculations
- Profit margin (if not provided)
- Days until stockout
- Suggested reorder quantity
- Human-readable recommendations

### Prediction Logging
- Stores predictions in `ai_predictions` table
- Enables analytics and monitoring
- Tracks model performance

### Error Handling
- Validates required fields
- Handles ML service failures gracefully
- Returns detailed error messages

## Testing

### Local Testing

```bash
# Start local Supabase
supabase start

# Serve function locally
supabase functions serve stock-prediction

# Test with curl
curl -X POST http://localhost:54321/functions/v1/stock-prediction \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -d '{
    "product_data": {
      "product_id": "test_123",
      "cost_price": 100,
      "selling_price": 150,
      "current_stock": 5,
      "minimum_stock_level": 10,
      "category": "Electronics"
    }
  }'
```

### Expected Response

```json
{
  "product_id": "test_123",
  "reorder_required": true,
  "confidence": 0.95,
  "recommendation": "📊 Stock below minimum level. Consider reordering within 15 days.",
  "predicted_stockout_days": 15,
  "suggested_reorder_quantity": 20
}
```

## Monitoring

### Check Logs

```bash
supabase functions logs stock-prediction
```

### View Predictions

```sql
SELECT * FROM ai_predictions 
WHERE prediction_type = 'stock_reorder'
ORDER BY created_at DESC
LIMIT 10;
```

## Performance

- **Latency**: ~200-500ms (depends on ML service)
- **Rate Limit**: 100 requests/minute per organization
- **Caching**: Predictions cached for 1 hour per product

## Troubleshooting

### ML Service Not Responding
- Check ML_SERVICE_URL is correct
- Verify ML service is running
- Check network connectivity

### Invalid Predictions
- Verify input data format
- Check model is trained correctly
- Review prediction logs

### High Latency
- Consider caching predictions
- Optimize ML service
- Use batch predictions for multiple products
