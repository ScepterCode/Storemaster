-- Fix Console Errors Migration
-- Addresses 400, 403, and 406 errors in the application

-- Ensure all users have organizations (fix null organization_id issues)
DO $$
DECLARE
    user_record RECORD;
    org_id UUID;
BEGIN
    -- Loop through users who don't have organization membership
    FOR user_record IN 
        SELECT DISTINCT u.id, u.email
        FROM auth.users u
        LEFT JOIN organization_members om ON u.id = om.user_id AND om.is_active = true
        WHERE om.user_id IS NULL
    LOOP
        -- Create organization for user
        INSERT INTO organizations (name, slug, subscription_tier, is_active)
        VALUES (
            COALESCE(user_record.email, 'User') || '''s Organization',
            'org-' || LOWER(REPLACE(user_record.id::text, '-', '')),
            'free',
            true
        )
        RETURNING id INTO org_id;
        
        -- Add user as owner
        INSERT INTO organization_members (organization_id, user_id, role, is_active)
        VALUES (org_id, user_record.id, 'owner', true);
        
        -- Update existing data to have organization_id
        UPDATE products SET organization_id = org_id WHERE user_id = user_record.id AND organization_id IS NULL;
        UPDATE categories SET organization_id = org_id WHERE user_id = user_record.id AND organization_id IS NULL;
        UPDATE customers SET organization_id = org_id WHERE user_id = user_record.id AND organization_id IS NULL;
        UPDATE invoices SET organization_id = org_id WHERE user_id = user_record.id AND organization_id IS NULL;
        UPDATE transactions SET organization_id = org_id WHERE user_id = user_record.id AND organization_id IS NULL;
        
        RAISE NOTICE 'Created organization % for user %', org_id, user_record.email;
    END LOOP;
END $$;

-- Ensure enhanced security tables exist
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
    'device_revoked', 'suspicious_activity', 'account_locked', 'route_access'
  )),
  ip_address INET,
  user_agent TEXT,
  location JSONB,
  details JSONB DEFAULT '{}',
  risk_score INTEGER DEFAULT 0 CHECK (risk_score >= 0 AND risk_score <= 100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS password_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS account_lockouts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  reason TEXT NOT NULL,
  locked_until TIMESTAMP WITH TIME ZONE NOT NULL,
  attempt_count INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id),
  UNIQUE(email)
);

CREATE TABLE IF NOT EXISTS user_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_token TEXT NOT NULL UNIQUE,
  device_id TEXT,
  ip_address INET,
  user_agent TEXT,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on all security tables
ALTER TABLE user_mfa ENABLE ROW LEVEL SECURITY;
ALTER TABLE trusted_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE password_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE account_lockouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for security tables
CREATE POLICY "Users can manage their own MFA" ON user_mfa FOR ALL USING (user_id = auth.uid());
CREATE POLICY "Users can manage their own devices" ON trusted_devices FOR ALL USING (user_id = auth.uid());
CREATE POLICY "Users can view their own security events" ON security_events FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "System can insert security events" ON security_events FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can view their own password history" ON password_history FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "System can insert password history" ON password_history FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can view their own sessions" ON user_sessions FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "System can manage sessions" ON user_sessions FOR ALL WITH CHECK (true);

-- Admin policies for security tables
CREATE POLICY "Admins can view all MFA settings" ON user_mfa FOR SELECT USING (
  EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid())
);
CREATE POLICY "Admins can view all devices" ON trusted_devices FOR SELECT USING (
  EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid())
);
CREATE POLICY "Admins can view all security events" ON security_events FOR SELECT USING (
  EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid())
);
CREATE POLICY "Admins can manage account lockouts" ON account_lockouts FOR ALL USING (
  EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid())
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_mfa_user_id ON user_mfa(user_id);
CREATE INDEX IF NOT EXISTS idx_trusted_devices_user_id ON trusted_devices(user_id);
CREATE INDEX IF NOT EXISTS idx_trusted_devices_active ON trusted_devices(user_id, is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_security_events_user_id ON security_events(user_id);
CREATE INDEX IF NOT EXISTS idx_security_events_type ON security_events(event_type);
CREATE INDEX IF NOT EXISTS idx_security_events_created_at ON security_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_password_history_user_id ON password_history(user_id);
CREATE INDEX IF NOT EXISTS idx_account_lockouts_user_id ON account_lockouts(user_id);
CREATE INDEX IF NOT EXISTS idx_account_lockouts_email ON account_lockouts(email);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_user_sessions_active ON user_sessions(user_id, is_active) WHERE is_active = true;

-- Create security helper functions
CREATE OR REPLACE FUNCTION is_account_locked(check_user_id UUID DEFAULT NULL, check_email TEXT DEFAULT NULL)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF check_user_id IS NOT NULL THEN
    RETURN EXISTS (
      SELECT 1 FROM account_lockouts
      WHERE user_id = check_user_id AND locked_until > NOW()
    );
  END IF;
  
  IF check_email IS NOT NULL THEN
    RETURN EXISTS (
      SELECT 1 FROM account_lockouts
      WHERE email = check_email AND locked_until > NOW()
    );
  END IF;
  
  RETURN FALSE;
END;
$$;

CREATE OR REPLACE FUNCTION lock_account(
  target_user_id UUID DEFAULT NULL,
  target_email TEXT DEFAULT NULL,
  lock_reason TEXT DEFAULT 'Multiple failed login attempts',
  lock_duration_minutes INTEGER DEFAULT 15
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO account_lockouts (user_id, email, reason, locked_until)
  VALUES (
    target_user_id,
    target_email,
    lock_reason,
    NOW() + (lock_duration_minutes || ' minutes')::INTERVAL
  )
  ON CONFLICT (user_id) DO UPDATE SET
    locked_until = NOW() + (lock_duration_minutes || ' minutes')::INTERVAL,
    attempt_count = account_lockouts.attempt_count + 1,
    reason = lock_reason
  ON CONFLICT (email) DO UPDATE SET
    locked_until = NOW() + (lock_duration_minutes || ' minutes')::INTERVAL,
    attempt_count = account_lockouts.attempt_count + 1,
    reason = lock_reason;
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
  different_ips INTEGER;
  risk_score INTEGER := 0;
BEGIN
  -- Count failed logins in last 24 hours
  SELECT COUNT(*)
  INTO failed_logins
  FROM security_events
  WHERE user_id = check_user_id
    AND event_type = 'failed_login'
    AND created_at > NOW() - INTERVAL '24 hours';
  
  -- Count different IP addresses in last 24 hours
  SELECT COUNT(DISTINCT ip_address)
  INTO different_ips
  FROM security_events
  WHERE user_id = check_user_id
    AND created_at > NOW() - INTERVAL '24 hours'
    AND ip_address IS NOT NULL;
  
  -- Calculate risk score
  risk_score := LEAST(100, (failed_logins * 10) + (different_ips * 5));
  
  -- Log suspicious activity if risk score is high
  IF risk_score > 50 THEN
    PERFORM log_security_event(
      check_user_id,
      'suspicious_activity',
      NULL,
      NULL,
      jsonb_build_object(
        'failed_logins', failed_logins,
        'different_ips', different_ips,
        'risk_score', risk_score
      ),
      risk_score
    );
  END IF;
  
  RETURN risk_score;
END;
$$;

-- Grant permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON user_mfa TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON trusted_devices TO authenticated;
GRANT SELECT, INSERT ON security_events TO authenticated;
GRANT SELECT ON password_history TO authenticated;
GRANT SELECT ON user_sessions TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;