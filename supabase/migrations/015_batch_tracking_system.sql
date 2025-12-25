-- Batch Tracking System Migration
-- This adds comprehensive batch/lot tracking for inventory management

-- Product Batches Table
CREATE TABLE IF NOT EXISTS product_batches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  batch_number TEXT NOT NULL, -- User-defined or auto-generated batch identifier
  quantity_received INTEGER NOT NULL DEFAULT 0, -- Original quantity received
  quantity_current INTEGER NOT NULL DEFAULT 0, -- Current available quantity
  unit_cost DECIMAL(10, 2), -- Cost per unit for this batch (for COGS calculation)
  received_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  expiry_date TIMESTAMP WITH TIME ZONE, -- Optional expiry date
  supplier_name TEXT, -- Who supplied this batch
  supplier_reference TEXT, -- Supplier's reference/invoice number
  notes TEXT, -- Additional notes about this batch
  
  -- Multi-tenancy support
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Sync fields
  synced BOOLEAN DEFAULT false,
  last_modified TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  sync_attempts INTEGER DEFAULT 0,
  last_sync_error TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT positive_quantities CHECK (quantity_received >= 0 AND quantity_current >= 0),
  CONSTRAINT current_not_exceed_received CHECK (quantity_current <= quantity_received),
  UNIQUE(organization_id, product_id, batch_number) -- Unique batch number per product per organization
);

-- Batch Movements Table (for audit trail and FIFO/FEFO tracking)
CREATE TABLE IF NOT EXISTS batch_movements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  batch_id UUID NOT NULL REFERENCES product_batches(id) ON DELETE CASCADE,
  movement_type TEXT NOT NULL CHECK (movement_type IN ('in', 'out', 'adjustment', 'expired', 'damaged')),
  quantity INTEGER NOT NULL, -- Positive for in, negative for out
  reference_type TEXT, -- 'sale', 'purchase', 'adjustment', 'expiry', etc.
  reference_id UUID, -- ID of the related transaction/invoice/adjustment
  unit_cost DECIMAL(10, 2), -- Cost per unit for this movement
  notes TEXT,
  movement_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  -- Multi-tenancy support
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Sync fields
  synced BOOLEAN DEFAULT false,
  last_modified TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  sync_attempts INTEGER DEFAULT 0,
  last_sync_error TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add batch tracking fields to products table
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS batch_tracking_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS default_shelf_life_days INTEGER, -- Default shelf life for new batches
ADD COLUMN IF NOT EXISTS reorder_point INTEGER DEFAULT 0, -- Minimum stock level before reorder alert
ADD COLUMN IF NOT EXISTS barcode TEXT; -- Barcode field if not already present

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_product_batches_product_id ON product_batches(product_id);
CREATE INDEX IF NOT EXISTS idx_product_batches_expiry ON product_batches(expiry_date) WHERE expiry_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_product_batches_org ON product_batches(organization_id);
CREATE INDEX IF NOT EXISTS idx_product_batches_received_date ON product_batches(received_date DESC);
CREATE INDEX IF NOT EXISTS idx_batch_movements_batch_id ON batch_movements(batch_id);
CREATE INDEX IF NOT EXISTS idx_batch_movements_date ON batch_movements(movement_date DESC);
CREATE INDEX IF NOT EXISTS idx_batch_movements_org ON batch_movements(organization_id);
CREATE INDEX IF NOT EXISTS idx_batch_movements_reference ON batch_movements(reference_type, reference_id);

-- Create a view for easy batch summary per product
CREATE OR REPLACE VIEW product_batch_summary AS
SELECT 
  p.id as product_id,
  p.name as product_name,
  p.organization_id,
  COUNT(pb.id) as total_batches,
  COALESCE(SUM(pb.quantity_current), 0) as total_quantity,
  MIN(pb.expiry_date) as earliest_expiry,
  COUNT(CASE WHEN pb.expiry_date <= NOW() + INTERVAL '30 days' THEN 1 END) as expiring_soon_count,
  COUNT(CASE WHEN pb.expiry_date <= NOW() THEN 1 END) as expired_count,
  AVG(pb.unit_cost) as average_cost
FROM products p
LEFT JOIN product_batches pb ON p.id = pb.product_id AND pb.quantity_current > 0
WHERE p.batch_tracking_enabled = true
GROUP BY p.id, p.name, p.organization_id;

-- Function to automatically update product quantity from batches
CREATE OR REPLACE FUNCTION update_product_quantity_from_batches()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the product's total quantity based on sum of all batch quantities
  UPDATE products 
  SET 
    quantity = (
      SELECT COALESCE(SUM(quantity_current), 0) 
      FROM product_batches 
      WHERE product_id = COALESCE(NEW.product_id, OLD.product_id)
    ),
    last_modified = NOW()
  WHERE id = COALESCE(NEW.product_id, OLD.product_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Triggers to keep product quantity in sync with batch quantities
CREATE TRIGGER trigger_update_product_quantity_on_batch_change
  AFTER INSERT OR UPDATE OR DELETE ON product_batches
  FOR EACH ROW
  EXECUTE FUNCTION update_product_quantity_from_batches();

-- Function to create batch movement records
CREATE OR REPLACE FUNCTION create_batch_movement(
  p_batch_id UUID,
  p_movement_type TEXT,
  p_quantity INTEGER,
  p_reference_type TEXT DEFAULT NULL,
  p_reference_id UUID DEFAULT NULL,
  p_unit_cost DECIMAL DEFAULT NULL,
  p_notes TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_movement_id UUID;
  v_organization_id UUID;
BEGIN
  -- Get organization_id from batch
  SELECT organization_id INTO v_organization_id
  FROM product_batches WHERE id = p_batch_id;
  
  -- Insert movement record
  INSERT INTO batch_movements (
    batch_id, movement_type, quantity, reference_type, 
    reference_id, unit_cost, notes, organization_id
  ) VALUES (
    p_batch_id, p_movement_type, p_quantity, p_reference_type,
    p_reference_id, p_unit_cost, p_notes, v_organization_id
  ) RETURNING id INTO v_movement_id;
  
  -- Update batch quantity
  UPDATE product_batches 
  SET 
    quantity_current = quantity_current + p_quantity,
    last_modified = NOW()
  WHERE id = p_batch_id;
  
  RETURN v_movement_id;
END;
$$ LANGUAGE plpgsql;

-- Function to allocate stock using FEFO (First Expired, First Out) method
CREATE OR REPLACE FUNCTION allocate_stock_fefo(
  p_product_id UUID,
  p_quantity_needed INTEGER,
  p_reference_type TEXT DEFAULT 'sale',
  p_reference_id UUID DEFAULT NULL
) RETURNS TABLE (
  batch_id UUID,
  allocated_quantity INTEGER,
  unit_cost DECIMAL
) AS $$
DECLARE
  v_batch RECORD;
  v_remaining INTEGER := p_quantity_needed;
  v_allocated INTEGER;
BEGIN
  -- Loop through batches ordered by expiry date (FEFO)
  FOR v_batch IN 
    SELECT pb.id, pb.quantity_current, pb.unit_cost, pb.expiry_date
    FROM product_batches pb
    WHERE pb.product_id = p_product_id 
      AND pb.quantity_current > 0
    ORDER BY 
      CASE WHEN pb.expiry_date IS NULL THEN 1 ELSE 0 END, -- Non-expiring items last
      pb.expiry_date ASC, -- Earliest expiry first
      pb.received_date ASC -- Then oldest received first
  LOOP
    EXIT WHEN v_remaining <= 0;
    
    -- Calculate how much to allocate from this batch
    v_allocated := LEAST(v_remaining, v_batch.quantity_current);
    
    -- Create movement record (negative quantity for outbound)
    PERFORM create_batch_movement(
      v_batch.id,
      'out',
      -v_allocated,
      p_reference_type,
      p_reference_id,
      v_batch.unit_cost,
      'FEFO allocation'
    );
    
    -- Return allocation details
    batch_id := v_batch.id;
    allocated_quantity := v_allocated;
    unit_cost := v_batch.unit_cost;
    RETURN NEXT;
    
    v_remaining := v_remaining - v_allocated;
  END LOOP;
  
  -- If we couldn't allocate all requested quantity, raise notice
  IF v_remaining > 0 THEN
    RAISE NOTICE 'Could not allocate % units. Short by % units.', p_quantity_needed, v_remaining;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Add RLS policies for multi-tenancy
ALTER TABLE product_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE batch_movements ENABLE ROW LEVEL SECURITY;

-- RLS Policies for product_batches
CREATE POLICY "Users can view batches in their organization" ON product_batches
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM user_organizations 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert batches in their organization" ON product_batches
  FOR INSERT WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM user_organizations 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update batches in their organization" ON product_batches
  FOR UPDATE USING (
    organization_id IN (
      SELECT organization_id FROM user_organizations 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete batches in their organization" ON product_batches
  FOR DELETE USING (
    organization_id IN (
      SELECT organization_id FROM user_organizations 
      WHERE user_id = auth.uid()
    )
  );

-- RLS Policies for batch_movements
CREATE POLICY "Users can view movements in their organization" ON batch_movements
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM user_organizations 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert movements in their organization" ON batch_movements
  FOR INSERT WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM user_organizations 
      WHERE user_id = auth.uid()
    )
  );

-- Comments
COMMENT ON TABLE product_batches IS 'Tracks individual batches/lots of products with expiry dates and quantities';
COMMENT ON TABLE batch_movements IS 'Audit trail of all batch quantity changes';
COMMENT ON FUNCTION allocate_stock_fefo IS 'Allocates stock using First Expired, First Out method';
COMMENT ON VIEW product_batch_summary IS 'Summary view of batch information per product';