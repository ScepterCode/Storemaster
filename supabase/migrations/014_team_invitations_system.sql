-- Team Invitations System
-- Complete workflow for inviting team members with email links

-- Create team_invitations table
CREATE TABLE IF NOT EXISTS team_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('staff', 'manager', 'owner')),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  invited_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
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
CREATE INDEX idx_team_invitations_org ON team_invitations(organization_id);
CREATE INDEX idx_team_invitations_status ON team_invitations(status);

-- Add trigger for updated_at
CREATE TRIGGER update_team_invitations_updated_at 
  BEFORE UPDATE ON team_invitations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE team_invitations ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Organization members can view their org invitations"
  ON team_invitations FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "Organization admins can manage invitations"
  ON team_invitations FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid() 
        AND is_active = true 
        AND role IN ('owner', 'admin')
    )
  );

-- Anyone can view invitations by token (for accepting)
CREATE POLICY "Anyone can view invitations by token"
  ON team_invitations FOR SELECT
  USING (true);

-- Function to accept team invitation
CREATE OR REPLACE FUNCTION accept_team_invitation(invitation_token TEXT)
RETURNS JSONB AS $$
DECLARE
  invitation_record team_invitations;
  user_record auth.users;
  result JSONB;
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

  -- Check if email matches
  IF invitation_record.email != user_record.email THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invitation email does not match your account');
  END IF;

  -- Check if user is already a member
  IF EXISTS (
    SELECT 1 FROM organization_members 
    WHERE organization_id = invitation_record.organization_id 
    AND user_id = user_record.id
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'You are already a member of this organization');
  END IF;

  -- Add user to organization
  INSERT INTO organization_members (
    organization_id,
    user_id,
    role,
    joined_at
  ) VALUES (
    invitation_record.organization_id,
    user_record.id,
    invitation_record.role::TEXT,
    NOW()
  );

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
    'organization_id', invitation_record.organization_id,
    'role', invitation_record.role
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get invitation details by token
CREATE OR REPLACE FUNCTION get_invitation_details(invitation_token TEXT)
RETURNS JSONB AS $$
DECLARE
  invitation_record team_invitations;
  org_record organizations;
BEGIN
  -- Find invitation
  SELECT * INTO invitation_record 
  FROM team_invitations 
  WHERE token = invitation_token;

  IF invitation_record IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invitation not found');
  END IF;

  -- Get organization details
  SELECT * INTO org_record 
  FROM organizations 
  WHERE id = invitation_record.organization_id;

  RETURN jsonb_build_object(
    'success', true,
    'invitation', jsonb_build_object(
      'id', invitation_record.id,
      'email', invitation_record.email,
      'role', invitation_record.role,
      'status', invitation_record.status,
      'expires_at', invitation_record.expires_at,
      'organization', jsonb_build_object(
        'id', org_record.id,
        'name', org_record.name,
        'slug', org_record.slug
      )
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION accept_team_invitation(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_invitation_details(TEXT) TO authenticated;

COMMENT ON TABLE team_invitations IS 'Stores team member invitations with email workflow';
COMMENT ON FUNCTION accept_team_invitation IS 'Accepts a team invitation and adds user to organization';
COMMENT ON FUNCTION get_invitation_details IS 'Gets invitation details for display';