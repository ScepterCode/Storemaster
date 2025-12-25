-- Simple Team Invitations (works with current schema)
-- Run this in Supabase SQL Editor

-- Create simplified team_invitations table
CREATE TABLE IF NOT EXISTS team_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('staff', 'manager', 'owner')),
  invited_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'cancelled')),
  token TEXT UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days'),
  accepted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_team_invitations_email ON team_invitations(email);
CREATE INDEX idx_team_invitations_token ON team_invitations(token);
CREATE INDEX idx_team_invitations_status ON team_invitations(status);

-- Enable RLS
ALTER TABLE team_invitations ENABLE ROW LEVEL SECURITY;

-- Simple RLS policy - allow authenticated users to manage invitations
CREATE POLICY "Authenticated users can manage invitations"
  ON team_invitations FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Simple function to accept invitation
CREATE OR REPLACE FUNCTION accept_team_invitation(invitation_token TEXT)
RETURNS JSONB AS $$
DECLARE
  invitation_record team_invitations;
  user_record auth.users;
BEGIN
  -- Get current user
  SELECT * INTO user_record FROM auth.users WHERE id = auth.uid();
  
  IF user_record IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'User not authenticated');
  END IF;

  -- Find and validate invitation
  SELECT * INTO invitation_record 
  FROM team_invitations 
  WHERE token = invitation_token 
  AND status = 'pending' 
  AND expires_at > NOW();

  IF invitation_record IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid or expired invitation');
  END IF;

  -- Set user role
  INSERT INTO user_roles (user_id, role)
  VALUES (user_record.id, invitation_record.role)
  ON CONFLICT (user_id) DO UPDATE SET
    role = invitation_record.role,
    updated_at = NOW();

  -- Mark invitation as accepted
  UPDATE team_invitations 
  SET status = 'accepted', accepted_at = NOW(), updated_at = NOW()
  WHERE id = invitation_record.id;

  RETURN jsonb_build_object(
    'success', true, 
    'role', invitation_record.role
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Simple function to get invitation details
CREATE OR REPLACE FUNCTION get_invitation_details(invitation_token TEXT)
RETURNS JSONB AS $$
DECLARE
  invitation_record team_invitations;
BEGIN
  -- Find invitation
  SELECT * INTO invitation_record 
  FROM team_invitations 
  WHERE token = invitation_token;

  IF invitation_record IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invitation not found');
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'invitation', jsonb_build_object(
      'id', invitation_record.id,
      'email', invitation_record.email,
      'role', invitation_record.role,
      'status', invitation_record.status,
      'expires_at', invitation_record.expires_at,
      'organization', jsonb_build_object(
        'id', 'default-org',
        'name', 'Your Organization',
        'slug', 'default'
      )
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION accept_team_invitation(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_invitation_details(TEXT) TO authenticated;