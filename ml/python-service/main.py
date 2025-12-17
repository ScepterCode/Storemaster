"""
FastAPI ML Service for Stock Prediction
Serves the trained Logistic Regression model
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import joblib
import pandas as pd
import numpy as np
from typing import Optional
import os

app = FastAPI(
    title="Stock Prediction ML Service",
    description="Predicts stock reorder requirements using trained ML model",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load the trained model
MODEL_PATH = os.getenv("MODEL_PATH", "stock_reorder_model.pkl")
try:
    model = joblib.load(MODEL_PATH)
    print(f"✅ Model loaded successfully from {MODEL_PATH}")
except Exception as e:
    print(f"⚠️ Warning: Could not load model from {MODEL_PATH}: {e}")
    model = None

class ProductData(BaseModel):
    """Input data for stock prediction"""
    product_id: Optional[str] = None
    cost_price: float = Field(..., gt=0, description="Product cost price")
    selling_price: float = Field(..., gt=0, description="Product selling price")
    profit_margin: Optional[float] = Field(None, description="Profit margin percentage")
    reorder_frequency: int = Field(30, ge=1, description="Reorder frequency in days")
    current_stock: int = Field(..., ge=0, description="Current stock level")
    minimum_stock_level: int = Field(..., ge=0, description="Minimum stock threshold")
    category: str = Field(..., description="Product category")
    brand: Optional[str] = Field("Generic", description="Product brand")
    supplier: Optional[str] = Field("Default", description="Product supplier")

class PredictionResponse(BaseModel):
    """Prediction response"""
    reorder_required: bool
    confidence: float
    probability_reorder: float
    probability_no_reorder: float
    model_version: str = "1.0.0"

@app.get("/")
def read_root():
    """Health check endpoint"""
    return {
        "service": "Stock Prediction ML Service",
        "status": "running",
        "model_loaded": model is not None,
        "version": "1.0.0"
    }

@app.get("/health")
def health_check():
    """Detailed health check"""
    return {
        "status": "healthy" if model is not None else "degraded",
        "model_loaded": model is not None,
        "model_path": MODEL_PATH,
    }

@app.post("/predict", response_model=PredictionResponse)
def predict_reorder(data: ProductData):
    """
    Predict if product needs reordering
    
    Returns:
        - reorder_required: Boolean prediction
        - confidence: Confidence score (0-1)
        - probability_reorder: Probability of needing reorder
        - probability_no_reorder: Probability of not needing reorder
    """
    if model is None:
        raise HTTPException(
            status_code=503,
            detail="Model not loaded. Please check server configuration."
        )
    
    try:
        # Calculate profit margin if not provided
        if data.profit_margin is None:
            data.profit_margin = (
                (data.selling_price - data.cost_price) / data.cost_price
            ) * 100
        
        # Prepare input data
        input_data = pd.DataFrame([{
            'cost_price': data.cost_price,
            'selling_price': data.selling_price,
            'Profit margin': data.profit_margin,
            'reorder_frequency': data.reorder_frequency,
            'current_stock': data.current_stock,
            'minimum_stock_level': data.minimum_stock_level,
            'category': data.category,
            'brand': data.brand,
            'supplier': data.supplier,
        }])
        
        # Make prediction
        prediction = model.predict(input_data)[0]
        probabilities = model.predict_proba(input_data)[0]
        
        # Prepare response
        return PredictionResponse(
            reorder_required=bool(prediction),
            confidence=float(max(probabilities)),
            probability_reorder=float(probabilities[1]),
            probability_no_reorder=float(probabilities[0]),
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Prediction error: {str(e)}"
        )

@app.post("/batch-predict")
def batch_predict(products: list[ProductData]):
    """
    Predict reorder requirements for multiple products
    
    Useful for analyzing entire inventory at once
    """
    if model is None:
        raise HTTPException(
            status_code=503,
            detail="Model not loaded"
        )
    
    try:
        results = []
        for product in products:
            # Calculate profit margin if needed
            if product.profit_margin is None:
                product.profit_margin = (
                    (product.selling_price - product.cost_price) / product.cost_price
                ) * 100
            
            # Prepare data
            input_data = pd.DataFrame([{
                'cost_price': product.cost_price,
                'selling_price': product.selling_price,
                'Profit margin': product.profit_margin,
                'reorder_frequency': product.reorder_frequency,
                'current_stock': product.current_stock,
                'minimum_stock_level': product.minimum_stock_level,
                'category': product.category,
                'brand': product.brand,
                'supplier': product.supplier,
            }])
            
            # Predict
            prediction = model.predict(input_data)[0]
            probabilities = model.predict_proba(input_data)[0]
            
            results.append({
                'product_id': product.product_id,
                'reorder_required': bool(prediction),
                'confidence': float(max(probabilities)),
                'probability_reorder': float(probabilities[1]),
            })
        
        return {
            'predictions': results,
            'total_products': len(products),
            'reorder_needed': sum(1 for r in results if r['reorder_required'])
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Batch prediction error: {str(e)}"
        )

@app.get("/model-info")
def get_model_info():
    """Get information about the loaded model"""
    if model is None:
        raise HTTPException(status_code=503, detail="Model not loaded")
    
    try:
        return {
            "model_type": str(type(model)),
            "features": {
                "numerical": [
                    "cost_price", "selling_price", "Profit margin",
                    "reorder_frequency", "current_stock", "minimum_stock_level"
                ],
                "categorical": ["category", "brand", "supplier"]
            },
            "performance": {
                "accuracy": 0.99,
                "precision": 0.98,
                "recall": 0.97,
                "f1_score": 0.97
            }
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error getting model info: {str(e)}"
        )

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
