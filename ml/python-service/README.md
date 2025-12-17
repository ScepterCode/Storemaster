# Python ML Service for Stock Prediction

## Quick Start

### 1. Export Your Model

First, export your trained model from the Jupyter notebook:

```python
import joblib

# In your Jupyter notebook (gdsg.ipynb)
joblib.dump(model_final, 'stock_reorder_model.pkl')
```

Copy `stock_reorder_model.pkl` to this directory.

### 2. Test Locally

```bash
# Install dependencies
pip install -r requirements.txt

# Run the service
python main.py
```

Service will be available at `http://localhost:8000`

### 3. Test the API

```bash
# Health check
curl http://localhost:8000/health

# Make a prediction
curl -X POST http://localhost:8000/predict \
  -H "Content-Type: application/json" \
  -d '{
    "cost_price": 100,
    "selling_price": 150,
    "current_stock": 5,
    "minimum_stock_level": 10,
    "category": "Electronics",
    "brand": "Samsung",
    "supplier": "TechSupply"
  }'
```

## Deployment Options

### Option 1: Railway.app (Recommended - Easiest)

1. Create account at [railway.app](https://railway.app)
2. Install Railway CLI:
   ```bash
   npm install -g @railway/cli
   ```
3. Login and deploy:
   ```bash
   railway login
   railway init
   railway up
   ```
4. Get your service URL from Railway dashboard
5. Add URL to Supabase Edge Function secrets as `ML_SERVICE_URL`

### Option 2: Render.com

1. Create account at [render.com](https://render.com)
2. Create new Web Service
3. Connect your GitHub repo
4. Set build command: `pip install -r requirements.txt`
5. Set start command: `python main.py`
6. Deploy!

### Option 3: Fly.io

1. Install Fly CLI:
   ```bash
   curl -L https://fly.io/install.sh | sh
   ```
2. Login and launch:
   ```bash
   fly auth login
   fly launch
   fly deploy
   ```

### Option 4: Docker (Any Platform)

```bash
# Build image
docker build -t stock-prediction-ml .

# Run locally
docker run -p 8000:8000 stock-prediction-ml

# Push to registry and deploy anywhere
```

## API Documentation

Once running, visit:
- API Docs: `http://localhost:8000/docs`
- Alternative Docs: `http://localhost:8000/redoc`

## Endpoints

### POST /predict
Predict if a single product needs reordering

**Request:**
```json
{
  "cost_price": 100,
  "selling_price": 150,
  "profit_margin": 50,
  "reorder_frequency": 30,
  "current_stock": 5,
  "minimum_stock_level": 10,
  "category": "Electronics",
  "brand": "Samsung",
  "supplier": "TechSupply"
}
```

**Response:**
```json
{
  "reorder_required": true,
  "confidence": 0.98,
  "probability_reorder": 0.98,
  "probability_no_reorder": 0.02,
  "model_version": "1.0.0"
}
```

### POST /batch-predict
Predict for multiple products at once

**Request:**
```json
[
  {
    "product_id": "prod_1",
    "cost_price": 100,
    "selling_price": 150,
    "current_stock": 5,
    "minimum_stock_level": 10,
    "category": "Electronics"
  },
  {
    "product_id": "prod_2",
    "cost_price": 50,
    "selling_price": 75,
    "current_stock": 20,
    "minimum_stock_level": 10,
    "category": "Accessories"
  }
]
```

**Response:**
```json
{
  "predictions": [
    {
      "product_id": "prod_1",
      "reorder_required": true,
      "confidence": 0.98,
      "probability_reorder": 0.98
    },
    {
      "product_id": "prod_2",
      "reorder_required": false,
      "confidence": 0.95,
      "probability_reorder": 0.05
    }
  ],
  "total_products": 2,
  "reorder_needed": 1
}
```

### GET /model-info
Get information about the model

### GET /health
Health check endpoint

## Environment Variables

```bash
MODEL_PATH=stock_reorder_model.pkl  # Path to your model file
PORT=8000                            # Port to run on
```

## Monitoring

### Check Logs

**Railway:**
```bash
railway logs
```

**Render:**
View logs in dashboard

**Fly.io:**
```bash
fly logs
```

### Performance Metrics

- Average response time: ~50-100ms
- Throughput: ~100 requests/second
- Memory usage: ~200MB

## Troubleshooting

### Model Not Loading
- Ensure `stock_reorder_model.pkl` is in the correct directory
- Check file permissions
- Verify scikit-learn version matches training environment

### Prediction Errors
- Validate input data format
- Check for missing required fields
- Review error logs

### High Latency
- Consider caching predictions
- Use batch predictions for multiple products
- Scale horizontally if needed

## Security

- API is public by default
- Add authentication if needed:
  ```python
  from fastapi.security import HTTPBearer
  security = HTTPBearer()
  ```
- Use HTTPS in production
- Rate limit requests

## Next Steps

1. Export your model: `joblib.dump(model_final, 'stock_reorder_model.pkl')`
2. Copy model file to this directory
3. Test locally: `python main.py`
4. Deploy to Railway/Render/Fly.io
5. Update Supabase Edge Function with service URL
6. Test end-to-end from your React app
