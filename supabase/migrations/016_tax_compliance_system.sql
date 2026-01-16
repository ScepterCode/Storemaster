-- Tax Compliance System Migration
-- Implements VAT automation and tax compliance features for Nigerian retail stores

-- Tax configurations table
CREATE TABLE IF NOT EXISTS tax_configurations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    vat_rate DECIMAL(5,2) DEFAULT 7.5 NOT NULL,
    vat_enabled BOOLEAN DEFAULT true NOT NULL,
    exempt_categories TEXT[] DEFAULT '{}',
    zero_rated_categories TEXT[] DEFAULT '{}',
    small_company_status BOOLEAN DEFAULT false,
    tax_identification_number TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(organization_id)
);

-- Taxable transactions table
CREATE TABLE IF NOT EXISTS taxable_transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    transaction_id UUID NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
    gross_amount DECIMAL(15,2) NOT NULL,
    vat_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
    net_amount DECIMAL(15,2) NOT NULL,
    vat_rate DECIMAL(5,2) NOT NULL DEFAULT 7.5,
    is_exempt BOOLEAN DEFAULT false,
    exemption_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(transaction_id)
);

-- VAT returns table
CREATE TABLE IF NOT EXISTS vat_returns (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    output_vat DECIMAL(15,2) NOT NULL DEFAULT 0, -- VAT collected on sales
    input_vat DECIMAL(15,2) NOT NULL DEFAULT 0,  -- VAT paid on purchases
    net_vat DECIMAL(15,2) NOT NULL DEFAULT 0,    -- Amount to pay/refund
    status TEXT CHECK (status IN ('draft', 'submitted', 'paid')) DEFAULT 'draft',
    due_date DATE NOT NULL,
    submitted_at TIMESTAMP WITH TIME ZONE,
    paid_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add tax-related columns to existing tables
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS vat_exempt BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS exemption_reason TEXT;

ALTER TABLE invoices 
ADD COLUMN IF NOT EXISTS vat_amount DECIMAL(15,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_tax_invoice BOOLEAN DEFAULT true;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_tax_configurations_org_id ON tax_configurations(organization_id);
CREATE INDEX IF NOT EXISTS idx_taxable_transactions_transaction_id ON taxable_transactions(transaction_id);
CREATE INDEX IF NOT EXISTS idx_vat_returns_org_period ON vat_returns(organization_id, period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_vat_returns_due_date ON vat_returns(due_date);
CREATE INDEX IF NOT EXISTS idx_products_vat_exempt ON products(vat_exempt);

-- RLS Policies
ALTER TABLE tax_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE taxable_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE vat_returns ENABLE ROW LEVEL SECURITY;

-- Tax configurations policies
CREATE POLICY "Users can view their organization's tax config" ON tax_configurations
    FOR SELECT USING (
        organization_id IN (
            SELECT organization_id FROM user_roles 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update their organization's tax config" ON tax_configurations
    FOR UPDATE USING (
        organization_id IN (
            SELECT organization_id FROM user_roles 
            WHERE user_id = auth.uid() 
            AND role IN ('owner', 'admin')
        )
    );

CREATE POLICY "Users can insert their organization's tax config" ON tax_configurations
    FOR INSERT WITH CHECK (
        organization_id IN (
            SELECT organization_id FROM user_roles 
            WHERE user_id = auth.uid() 
            AND role IN ('owner', 'admin')
        )
    );

-- Taxable transactions policies
CREATE POLICY "Users can view their organization's taxable transactions" ON taxable_transactions
    FOR SELECT USING (
        transaction_id IN (
            SELECT t.id FROM transactions t
            JOIN user_roles ur ON t.organization_id = ur.organization_id
            WHERE ur.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert taxable transactions for their organization" ON taxable_transactions
    FOR INSERT WITH CHECK (
        transaction_id IN (
            SELECT t.id FROM transactions t
            JOIN user_roles ur ON t.organization_id = ur.organization_id
            WHERE ur.user_id = auth.uid()
        )
    );

-- VAT returns policies
CREATE POLICY "Users can view their organization's VAT returns" ON vat_returns
    FOR SELECT USING (
        organization_id IN (
            SELECT organization_id FROM user_roles 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can manage their organization's VAT returns" ON vat_returns
    FOR ALL USING (
        organization_id IN (
            SELECT organization_id FROM user_roles 
            WHERE user_id = auth.uid() 
            AND role IN ('owner', 'admin', 'manager')
        )
    );

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_tax_configurations_updated_at 
    BEFORE UPDATE ON tax_configurations 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vat_returns_updated_at 
    BEFORE UPDATE ON vat_returns 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to calculate VAT automatically
CREATE OR REPLACE FUNCTION calculate_transaction_vat()
RETURNS TRIGGER AS $$
DECLARE
    tax_config RECORD;
    vat_calc RECORD;
BEGIN
    -- Get tax configuration for the organization
    SELECT tc.* INTO tax_config
    FROM tax_configurations tc
    JOIN transactions t ON t.organization_id = tc.organization_id
    WHERE t.id = NEW.id;
    
    -- If no tax config exists or VAT is disabled, skip VAT calculation
    IF tax_config IS NULL OR NOT tax_config.vat_enabled THEN
        RETURN NEW;
    END IF;
    
    -- For sales transactions, calculate and record VAT
    IF NEW.type = 'sale' AND NEW.amount > 0 THEN
        -- Calculate VAT (assuming amount is VAT-inclusive)
        INSERT INTO taxable_transactions (
            transaction_id,
            gross_amount,
            vat_amount,
            net_amount,
            vat_rate,
            is_exempt
        ) VALUES (
            NEW.id,
            NEW.amount,
            NEW.amount - (NEW.amount / (1 + tax_config.vat_rate / 100)),
            NEW.amount / (1 + tax_config.vat_rate / 100),
            tax_config.vat_rate,
            false
        ) ON CONFLICT (transaction_id) DO NOTHING;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically calculate VAT for new transactions
CREATE TRIGGER auto_calculate_transaction_vat
    AFTER INSERT ON transactions
    FOR EACH ROW
    EXECUTE FUNCTION calculate_transaction_vat();

-- Insert default tax configurations for existing organizations
INSERT INTO tax_configurations (organization_id, vat_rate, vat_enabled)
SELECT id, 7.5, true
FROM organizations
WHERE id NOT IN (SELECT organization_id FROM tax_configurations)
ON CONFLICT (organization_id) DO NOTHING;