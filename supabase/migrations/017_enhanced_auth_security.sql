-- Enhanced Authentication Security Migration
-- Adds tables and functions for robust authentication features

-- User MFA (Multi-Factor Authentication) Table
CREATE TABLE IF NOT EXISTS user_mfa (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  secret TEXT NOT NULL,
  enabled BOOLEAN DEFAULT false,
  backup_codes TEXT[], -- Array of backup codes
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_id)
);

-- Trusted Devices Table
CREATE TABLE IF NOT EXISTS trusted_devices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  device_id TEXT NOT NULL, -- Device fingerprint
  device_name TEXT NOT NULL,
  device_type TEXT DEFAULT 'unknown', -- 'desktop', 'mobile', 'tablet'
  user_agent TEXT,
  ip_address INET,
  is_active BOOLEAN DEFAULT true,
  trusted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_seen_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_id, device_id)
);

-- Security Events Table
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
  location JSONB, -- Geolocation data
  details JSONB DEFAULT '{}',
  risk_score INTEGER DEFAULT 0 CHECK (risk_score >= 0 AND risk_score <= 100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Password History Table (prevent password reuse)
CREATE TABLE IF NOT EXISTS password_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Account Lockouts Table
CREATE TABLE IF NOT EXISTS account_lockouts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT, -- For tracking lockouts before user creation
  reason TEXT NOT NULL,
  locked_until TIMESTAMP WITH TIME ZONE NOT NULL,
  attempt_count INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_id),
  UNIQUE(email)
);

-- Session Management Table
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

-- Create indexes for performance
CREATE INDEX idx_user_mfa_user_id ON user_mfa(user_id);
CREATE INDEX idx_trusted_devices_user_id ON trusted_devices(user_id);
CREATE INDEX idx_trusted_devices_active ON trusted_devices(user_id, is_active) WHERE is_active = true;
CREATE INDEX idx_security_events_user_id ON security_events(user_id);
CREATE INDEX idx_security_events_type ON security_events(event_type);
CREATE INDEX idx_security_events_created_at ON security_events(created_at DESC);
CREATE INDEX idx_password_history_user_id ON password_history(user_id);
CREATE INDEX idx_account_lockouts_user_id ON account_lockouts(user_id);
CREATE INDEX idx_account_lockouts_email ON account_lockouts(email);
CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_user_sessions_token ON user_sessions(session_token);
CREATE INDEX idx_user_sessions_active ON user_sessions(user_id, is_active) WHERE is_active = true;

-- RLS Policies for security tables

-- User MFA: Users can only access their own MFA settings
ALTER TABLE user_mfa ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own MFA"
  ON user_mfa
  FOR ALL
  USING (user_id = auth.uid());

CREATE POLICY "Admins can view all MFA settings"
  ON user_mfa
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE id = auth.uid()
    )
  );

-- Trusted Devices: Users can only access their own devices
ALTER TABLE trusted_devices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own devices"
  ON trusted_devices
  FOR ALL
  USING (user_id = auth.uid());

CREATE POLICY "Admins can view all devices"
  ON trusted_devices
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE id = auth.uid()
    )
  );

-- Security Events: Users can view their own events, admins can view all
ALTER TABLE security_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own security events"
  ON security_events
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Admins can view all security events"
  ON security_events
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE id = auth.uid()
    )
  );

CREATE POLICY "System can insert security events"
  ON security_events
  FOR INSERT
  WITH CHECK (true);

-- Password History: Users can view their own history, no updates/deletes
ALTER TABLE password_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own password history"
  ON password_history
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "System can insert password history"
  ON password_history
  FOR INSERT
  WITH CHECK (true);

-- Account Lockouts: Admin only
ALTER TABLE account_lockouts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage account lockouts"
  ON account_lockouts
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE id = auth.uid()
    )
  );

-- User Sessions: Users can view their own sessions
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own sessions"
  ON user_sessions
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "System can manage sessions"
  ON user_sessions
  FOR ALL
  WITH CHECK (true);

-- Security Functions

-- Function to check if account is locked
CREATE OR REPLACE FUNCTION is_account_locked(check_user_id UUID DEFAULT NULL, check_email TEXT DEFAULT NULL)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check by user_id first
  IF check_user_id IS NOT NULL THEN
    RETURN EXISTS (
      SELECT 1 FROM account_lockouts
      WHERE user_id = check_user_id
        AND locked_until > NOW()
    );
  END IF;
  
  -- Check by email
  IF check_email IS NOT NULL THEN
    RETURN EXISTS (
      SELECT 1 FROM account_lockouts
      WHERE email = check_email
        AND locked_until > NOW()
    );
  END IF;
  
  RETURN FALSE;
END;
$$;

-- Function to lock account
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

-- Function to log security event
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

-- Function to clean up old security events (keep last 1000 per user)
CREATE OR REPLACE FUNCTION cleanup_security_events()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM security_events
  WHERE id IN (
    SELECT id FROM (
      SELECT id,
             ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at DESC) as rn
      FROM security_events
    ) ranked
    WHERE rn > 1000
  );
END;
$$;

-- Function to detect suspicious activity
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

-- Trigger to automatically clean up old sessions
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  DELETE FROM user_sessions
  WHERE expires_at < NOW()
    OR (last_activity < NOW() - INTERVAL '30 days');
  
  RETURN NULL;
END;
$$;

-- Create trigger for session cleanup (runs on insert)
CREATE TRIGGER trigger_cleanup_sessions
  AFTER INSERT ON user_sessions
  EXECUTE FUNCTION cleanup_expired_sessions();

-- Create a scheduled job to run cleanup functions (if pg_cron is available)
-- This would typically be set up separately in production
-- SELECT cron.schedule('cleanup-security-events', '0 2 * * *', 'SELECT cleanup_security_events();');

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;