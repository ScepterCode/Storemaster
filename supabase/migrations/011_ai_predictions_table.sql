-- AI Predictions Table
-- Stores ML predictions for analytics and monitoring

CREATE TABLE IF NOT EXISTS ai_predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  product_id TEXT,
  prediction_type TEXT NOT NULL CHECK (prediction_type IN ('stock_reorder', 'sales_forecast', 'anomaly_detection')),
  prediction_data JSONB NOT NULL,
  confidence DECIMAL(5,4),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Indexes for performance
CREATE INDEX idx_ai_predictions_org ON ai_predictions(organization_id);
CREATE INDEX idx_ai_predictions_product ON ai_predictions(product_id);
CREATE INDEX idx_ai_predictions_type ON ai_predictions(prediction_type);
CREATE INDEX idx_ai_predictions_created ON ai_predictions(created_at DESC);

-- RLS Policies
ALTER TABLE ai_predictions ENABLE ROW LEVEL SECURITY;

-- Users can view predictions for their organization
CREATE POLICY "Users can view organization predictions"
  ON ai_predictions
  FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id 
      FROM organization_members 
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

-- System can insert predictions (via service role)
CREATE POLICY "Service role can insert predictions"
  ON ai_predictions
  FOR INSERT
  WITH CHECK (true);

-- Add comment
COMMENT ON TABLE ai_predictions IS 'Stores AI/ML predictions for analytics and monitoring';
