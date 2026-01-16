-- Fix Database Issues - Multi-tenant and Security Tables
-- This script addresses the console errors and ensures proper data structure

-- First, let's check if the user has an organization
DO $$
DECLARE
    user_id UUID := 'f9fd317d-5a0d-4eee-a4f2-adeab3c4e0c8';
    org_id UUID;
    org_exists BOOLEAN := FALSE;
BEGIN
    -- Check if user has an organization
    SELECT organization_id INTO org_id
    FROM organization_members 
    WHERE user_id = user_id AND is_active = true
    LIMIT 1;
    
    IF org_id IS NOT NULL THEN
        org_exists := TRUE;
        RAISE NOTICE 'User has organization: %', org_id;
    ELSE
        RAISE NOTICE 'User has no organization, creating one...';
        
        -- Create organization for the user
        INSERT INTO organizations (name, slug, subscription_tier, is_active)
        VALUES ('Default Organization', 'default-org-' || EXTRACT(EPOCH FROM NOW())::text, 'free', true)
        RETURNING id INTO org_id;
        
        -- Add user as owner of the organization
        INSERT INTO organization_members (organization_id, user_id, role, is_active)
        VALUES (org_id, user_id, 'owner', true);
        
        RAISE NOTICE 'Created organization: %', org_id;
    END IF;
    
    -- Update any data that has null organization_id for this user
    UPDATE products 
    SET organization_id = org_id 
    WHERE user_id = user_id AND organization_id IS NULL;
    
    UPDATE categories 
    SET organization_id = org_id 
    WHERE user_id = user_id AND organization_id IS NULL;
    
    UPDATE customers 
    SET organization_id = org_id 
    WHERE user_id = user_id AND organization_id IS NULL;
    
    UPDATE invoices 
    SET organization_id = org_id 
    WHERE user_id = user_id AND organization_id IS NULL;
    
    UPDATE transactions 
    SET organization_id = org_id 
    WHERE user_id = user_id AND organization_id IS NULL;
    
    RAISE NOTICE 'Updated data with organization_id: %', org_id;
END $$;

-- Ensure the enhanced security tables exist (in case migration wasn't applied)
CREATE TABLE IF NOT EXISTS user_mfa (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  secret TEXT NOT NULL,
  enabled BOOLEAN DEFAULT false,
  backup_codes TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_id)
);

CREATE TABLE IF NOT EXISTS trusted_devices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  device_id TEXT NOT NULL,
  device_name TEXT NOT NULL,
  device_type TEXT DEFAULT 'unknown',
  user_agent TEXT,
  ip_address INET,
  is_active BOOLEAN DEFAULT true,
  trusted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_seen_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_id, device_id)
);

CREATE TABLE IF NOT EXISTS security_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN (
    'login', 'logout', 'failed_login', 'password_change', 
    'mfa_enabled', 'mfa_disabled', 'device_trusted', 
    'device_revoked', 'suspicious_activity', 'account_locked'
  )),
  ip_address INET,
  user_agent TEXT,
  location JSONB,
  details JSONB DEFAULT '{}',
  risk_score INTEGER DEFAULT 0 CHECK (risk_score >= 0 AND risk_score <= 100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on new tables if not already enabled
ALTER TABLE user_mfa ENABLE ROW LEVEL SECURITY;
ALTER TABLE trusted_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_events ENABLE ROW LEVEL SECURITY;

-- Create policies for new tables
DO $$
BEGIN
    -- User MFA policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_mfa' AND policyname = 'Users can manage their own MFA') THEN
        CREATE POLICY "Users can manage their own MFA"
          ON user_mfa
          FOR ALL
          USING (user_id = auth.uid());
    END IF;

    -- Trusted devices policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'trusted_devices' AND policyname = 'Users can manage their own devices') THEN
        CREATE POLICY "Users can manage their own devices"
          ON trusted_devices
          FOR ALL
          USING (user_id = auth.uid());
    END IF;

    -- Security events policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'security_events' AND policyname = 'Users can view their own security events') THEN
        CREATE POLICY "Users can view their own security events"
          ON security_events
          FOR SELECT
          USING (user_id = auth.uid());
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'security_events' AND policyname = 'System can insert security events') THEN
        CREATE POLICY "System can insert security events"
          ON security_events
          FOR INSERT
          WITH CHECK (true);
    END IF;
END $$;

-- Fix audit_logs table access (make sure it exists and has proper policies)
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_user_id UUID REFERENCES admin_users(id),
  user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  resource_type TEXT,
  resource_id TEXT,
  details JSONB DEFAULT '{}',
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Create audit_logs policy for admins only
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'audit_logs' AND policyname = 'Admins can view audit logs') THEN
        CREATE POLICY "Admins can view audit logs"
          ON audit_logs
          FOR SELECT
          USING (
            EXISTS (
              SELECT 1 FROM admin_users
              WHERE id = auth.uid()
            )
          );
    END IF;
END $$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_mfa_user_id ON user_mfa(user_id);
CREATE INDEX IF NOT EXISTS idx_trusted_devices_user_id ON trusted_devices(user_id);
CREATE INDEX IF NOT EXISTS idx_security_events_user_id ON security_events(user_id);
CREATE INDEX IF NOT EXISTS idx_security_events_created_at ON security_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON user_mfa TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON trusted_devices TO authenticated;
GRANT SELECT, INSERT ON security_events TO authenticated;
GRANT SELECT ON audit_logs TO authenticated;

-- Create helper functions if they don't exist
CREATE OR REPLACE FUNCTION is_account_locked(check_user_id UUID DEFAULT NULL, check_email TEXT DEFAULT NULL)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- For now, return false (no accounts locked)
  -- This can be enhanced later with actual lockout logic
  RETURN FALSE;
END;
$$;

CREATE OR REPLACE FUNCTION log_security_event(
  target_user_id UUID,
  event_type TEXT,
  event_ip INET DEFAULT NULL,
  event_user_agent TEXT DEFAULT NULL,
  event_details JSONB DEFAULT '{}'::JSONB,
  event_risk_score INTEGER DEFAULT 0
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO security_events (
    user_id,
    event_type,
    ip_address,
    user_agent,
    details,
    risk_score
  ) VALUES (
    target_user_id,
    event_type,
    event_ip,
    event_user_agent,
    event_details,
    event_risk_score
  );
END;
$$;

CREATE OR REPLACE FUNCTION detect_suspicious_activity(check_user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  failed_logins INTEGER;
  risk_score INTEGER := 0;
BEGIN
  -- Count failed logins in last 24 hours
  SELECT COUNT(*)
  INTO failed_logins
  FROM security_events
  WHERE user_id = check_user_id
    AND event_type = 'failed_login'
    AND created_at > NOW() - INTERVAL '24 hours';
  
  -- Calculate basic risk score
  risk_score := LEAST(100, failed_logins * 10);
  
  RETURN risk_score;
END;
$$;

-- Final verification
DO $$
DECLARE
    user_id UUID := 'f9fd317d-5a0d-4eee-a4f2-adeab3c4e0c8';
    org_count INTEGER;
    data_count INTEGER;
BEGIN
    -- Check organization membership
    SELECT COUNT(*) INTO org_count
    FROM organization_members 
    WHERE user_id = user_id AND is_active = true;
    
    RAISE NOTICE 'User organization memberships: %', org_count;
    
    -- Check data with organization_id
    SELECT COUNT(*) INTO data_count
    FROM products 
    WHERE user_id = user_id AND organization_id IS NOT NULL;
    
    RAISE NOTICE 'Products with organization_id: %', data_count;
    
    IF org_count = 0 THEN
        RAISE WARNING 'User still has no organization membership!';
    END IF;
END $$;