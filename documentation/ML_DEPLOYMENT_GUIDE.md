# ML Model Deployment Guide

## 🎯 Complete Integration Setup

You now have everything needed to deploy your stock prediction model!

---

## 📁 What Was Created

### 1. Python ML Service (`ml/python-service/`)
- **main.py** - FastAPI service serving your model
- **requirements.txt** - Python dependencies
- **Dockerfile** - Container configuration
- **railway.json** - Railway deployment config
- **README.md** - Detailed deployment instructions

### 2. Supabase Edge Function (`supabase/functions/stock-prediction/`)
- **index.ts** - Edge function that calls ML service
- **README.md** - Usage and testing guide

### 3. Database Migration (`supabase/migrations/`)
- **011_ai_predictions_table.sql** - Stores predictions for analytics

### 4. Frontend Integration (`src/services/`)
- **stockPredictionService.ts** - React service to use predictions

---

## 🚀 Deployment Steps

### Step 1: Export Your Model

In your Jupyter notebook (`ml/gdsg.ipynb`), add this cell:

```python
import joblib

# Export the trained model
joblib.dump(model_final, 'stock_reorder_model.pkl')
print("✅ Model exported successfully!")
```

Run the cell, then copy `stock_reorder_model.pkl` to `ml/python-service/`

### Step 2: Test Locally

```bash
cd ml/python-service

# Install dependencies
pip install -r requirements.txt

# Run the service
python main.py
```

Visit http://localhost:8000/docs to see the API documentation

### Step 3: Deploy to Railway (Easiest Option)

1. **Create Railway Account**
   - Go to [railway.app](https://railway.app)
   - Sign up with GitHub

2. **Install Railway CLI**
   ```bash
   npm install -g @railway/cli
   ```

3. **Deploy**
   ```bash
   cd ml/python-service
   railway login
   railway init
   railway up
   ```

4. **Get Your Service URL**
   - Go to Railway dashboard
   - Click on your service
   - Copy the public URL (e.g., `https://your-service.railway.app`)

### Step 4: Configure Supabase

1. **Add Environment Variables**
   - Go to Supabase Dashboard
   - Navigate to Edge Functions → Secrets
   - Add:
     ```
     ML_SERVICE_URL=https://your-service.railway.app
     ```

2. **Deploy Edge Function**
   ```bash
   supabase functions deploy stock-prediction
   ```

### Step 5: Run Database Migration

```bash
supabase db push
```

Or run the SQL directly in Supabase SQL Editor:
```sql
-- Copy content from supabase/migrations/011_ai_predictions_table.sql
```

### Step 6: Test End-to-End

```typescript
// In your React app
import { stockPredictionService } from '@/services/stockPredictionService';

const testPrediction = async () => {
  const product = {
    id: 'test_123',
    name: 'Test Product',
    quantity: 5,
    unitPrice: 100,
    categoryName: 'Electronics'
  };

  const prediction = await stockPredictionService.predictReorder(
    product,
    organizationId
  );

  console.log('Prediction:', prediction);
};
```

---

## 🧪 Testing Your Deployment

### Test ML Service Directly

```bash
curl -X POST https://your-service.railway.app/predict \
  -H "Content-Type: application/json" \
  -d '{
    "cost_price": 100,
    "selling_price": 150,
    "current_stock": 5,
    "minimum_stock_level": 10,
    "category": "Electronics"
  }'
```

Expected response:
```json
{
  "reorder_required": true,
  "confidence": 0.98,
  "probability_reorder": 0.98,
  "probability_no_reorder": 0.02
}
```

### Test Edge Function

```bash
curl -X POST https://YOUR_PROJECT.supabase.co/functions/v1/stock-prediction \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
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

---

## 💰 Cost Estimation

### Railway.app
- **Free Tier**: $5 credit/month (enough for testing)
- **Hobby Plan**: $5/month (500 hours)
- **Pro Plan**: $20/month (unlimited)

### Estimated Usage
- 1000 predictions/month: ~$0.50
- 10,000 predictions/month: ~$5
- Very cost-effective!

---

## 🎨 Next: Build the UI

Once deployed, I'll create:

1. **Stock Prediction Dashboard**
   - View all products needing reorder
   - See confidence scores
   - One-click reorder

2. **Product Detail Predictions**
   - Show prediction on product page
   - Historical prediction chart
   - Reorder recommendations

3. **Automated Alerts**
   - Email when stock critical
   - Dashboard notifications
   - Weekly reorder reports

---

## 🔧 Troubleshooting

### Model Not Loading
```bash
# Check if model file exists
ls -la ml/python-service/stock_reorder_model.pkl

# Test model loading
python -c "import joblib; model = joblib.load('stock_reorder_model.pkl'); print('✅ Model loaded')"
```

### Railway Deployment Issues
```bash
# Check logs
railway logs

# Restart service
railway restart
```

### Edge Function Errors
```bash
# Check logs
supabase functions logs stock-prediction

# Test locally
supabase functions serve stock-prediction
```

---

## 📊 Monitoring

### Check Predictions
```sql
-- View recent predictions
SELECT 
  product_id,
  prediction_data->>'reorder_required' as needs_reorder,
  prediction_data->>'confidence' as confidence,
  created_at
FROM ai_predictions
WHERE prediction_type = 'stock_reorder'
ORDER BY created_at DESC
LIMIT 10;
```

### Track Accuracy
```sql
-- Compare predictions vs actual reorders
SELECT 
  DATE(created_at) as date,
  COUNT(*) as total_predictions,
  SUM(CASE WHEN prediction_data->>'reorder_required' = 'true' THEN 1 ELSE 0 END) as predicted_reorders
FROM ai_predictions
WHERE prediction_type = 'stock_reorder'
GROUP BY DATE(created_at)
ORDER BY date DESC;
```

---

## ✅ Checklist

- [ ] Export model from Jupyter notebook
- [ ] Copy model to `ml/python-service/`
- [ ] Test locally (`python main.py`)
- [ ] Create Railway account
- [ ] Deploy to Railway
- [ ] Get service URL
- [ ] Add URL to Supabase secrets
- [ ] Deploy Edge Function
- [ ] Run database migration
- [ ] Test end-to-end
- [ ] Ready to build UI!

---

## 🎉 What's Next?

Once deployed, let me know and I'll:
1. Build the prediction UI components
2. Integrate with inventory page
3. Add automated reorder alerts
4. Create prediction analytics dashboard

Your ML model will be live and making predictions! 🚀
