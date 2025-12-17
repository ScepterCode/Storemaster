# Stock Reorder Prediction Model

## Model Overview
This model predicts whether a product needs to be reordered based on inventory and sales data.

### Model Type
**Logistic Regression** with preprocessing pipeline

### Performance Metrics
- **Accuracy**: 99%
- **Precision (Class 1)**: 98%
- **Recall (Class 1)**: 97%
- **F1-Score (Class 1)**: 97%

### Features Used

#### Numerical Features:
1. `cost_price` - Product cost price
2. `selling_price` - Product selling price
3. `Profit margin` - Profit margin percentage
4. `reorder_frequency` - How often product is reordered
5. `current_stock` - Current stock level
6. `minimum_stock_level` - Minimum stock threshold

#### Categorical Features:
1. `category` - Product category
2. `brand` - Product brand
3. `supplier` - Product supplier

### Target Variable
`reorder_required` - Binary (0 = No reorder needed, 1 = Reorder required)
- Calculated as: `current_stock <= minimum_stock_level`

## Integration Plan

### Step 1: Export Model
Convert the trained model to a format usable in production:

```python
import joblib

# Save the trained pipeline
joblib.dump(model_final, 'stock_reorder_model.pkl')

# Save the preprocessor separately if needed
joblib.dump(model_final.named_steps['preprocessor'], 'preprocessor.pkl')
```

### Step 2: Create Python API Service
Create a FastAPI or Flask service to serve predictions:

```python
from fastapi import FastAPI
import joblib
import pandas as pd

app = FastAPI()
model = joblib.load('stock_reorder_model.pkl')

@app.post("/predict")
async def predict_reorder(data: dict):
    df = pd.DataFrame([data])
    prediction = model.predict(df)
    probability = model.predict_proba(df)
    
    return {
        "reorder_required": bool(prediction[0]),
        "confidence": float(probability[0][1]),
        "recommendation": "Reorder now" if prediction[0] else "Stock sufficient"
    }
```

### Step 3: Deploy as Supabase Edge Function
Convert to TypeScript/Deno for Supabase:

```typescript
// supabase/functions/stock-prediction/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

serve(async (req) => {
  const { product_data } = await req.json()
  
  // Call Python service or use ONNX model
  const response = await fetch('YOUR_ML_SERVICE_URL/predict', {
    method: 'POST',
    body: JSON.stringify(product_data)
  })
  
  const prediction = await response.json()
  
  return new Response(JSON.stringify(prediction), {
    headers: { "Content-Type": "application/json" }
  })
})
```

### Step 4: Frontend Integration
Use the prediction in your React app:

```typescript
// src/services/stockPredictionService.ts
export async function predictReorder(productData: Product) {
  const response = await supabase.functions.invoke('stock-prediction', {
    body: {
      cost_price: productData.unitPrice,
      selling_price: productData.unitPrice * 1.3,
      current_stock: productData.quantity,
      minimum_stock_level: 10,
      // ... other features
    }
  })
  
  return response.data
}
```

## Model Deployment Options

### Option 1: Python Microservice (Recommended)
- Deploy FastAPI service on Railway, Render, or Fly.io
- Pros: Full Python ecosystem, easy to update model
- Cons: Additional service to maintain

### Option 2: ONNX Runtime
- Convert model to ONNX format
- Run in browser or Deno
- Pros: No external service needed
- Cons: Limited to supported models

### Option 3: TensorFlow.js
- Convert to TF.js format
- Run directly in browser
- Pros: Client-side prediction, no API calls
- Cons: Larger bundle size

## Next Steps

1. **Export the trained model** using joblib
2. **Create API service** (FastAPI recommended)
3. **Deploy service** to cloud platform
4. **Integrate with frontend** via Supabase Edge Function
5. **Test with real data** from your POS system
6. **Monitor performance** and retrain as needed

## Data Requirements

To use this model in production, you need:
- Historical sales data (at least 3 months)
- Product information (cost, price, category, brand, supplier)
- Current stock levels
- Minimum stock thresholds
- Reorder frequency data

## Retraining Schedule

Recommended retraining frequency:
- **Monthly**: For active products with frequent sales
- **Quarterly**: For stable inventory
- **On-demand**: When business patterns change significantly

## Model Monitoring

Track these metrics in production:
- Prediction accuracy vs actual reorders
- False positives (predicted reorder but not needed)
- False negatives (missed reorder opportunities)
- Average confidence scores
- Prediction latency
