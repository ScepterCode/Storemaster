-- Employee Invitations System
-- This migration creates a system for inviting employees instead of directly creating accounts

-- Create employee_invitations table
CREATE TABLE IF NOT EXISTS employee_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('staff', 'manager', 'admin')),
  permissions JSONB DEFAULT '{}'::jsonb,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  invited_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'cancelled')),
  token TEXT UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days'),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_employee_invitations_email ON employee_invitations(email);
CREATE INDEX idx_employee_invitations_token ON employee_invitations(token);
CREATE INDEX idx_employee_invitations_org ON employee_invitations(organization_id);
CREATE INDEX idx_employee_invitations_status ON employee_invitations(status);

-- Add trigger for updated_at
CREATE TRIGGER update_employee_invitations_updated_at 
  BEFORE UPDATE ON employee_invitations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies
ALTER TABLE employee_invitations ENABLE ROW LEVEL SECURITY;

-- Organization admins can manage invitations for their organization
CREATE POLICY "Organization admins can manage employee invitations"
  ON employee_invitations FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM organization_members om
      WHERE om.organization_id = employee_invitations.organization_id
      AND om.user_id = auth.uid()
      AND om.role IN ('owner', 'admin')
    )
  );

-- Platform admins can manage all invitations
CREATE POLICY "Platform admins can manage all employee invitations"
  ON employee_invitations FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE id = auth.uid()
    )
  );

-- Users can view invitations sent to their email (for accepting)
CREATE POLICY "Users can view their own invitations"
  ON employee_invitations FOR SELECT
  USING (
    email = (
      SELECT email FROM auth.users WHERE id = auth.uid()
    )
  );

-- Function to accept an employee invitation
CREATE OR REPLACE FUNCTION accept_employee_invitation(invitation_token TEXT)
RETURNS JSONB AS $$
DECLARE
  invitation_record employee_invitations;
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
  FROM employee_invitations 
  WHERE token = invitation_token 
  AND status = 'pending' 
  AND expires_at > NOW()
  AND email = user_record.email;

  IF invitation_record IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid or expired invitation');
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
    invitation_record.role,
    NOW()
  ) ON CONFLICT (organization_id, user_id) DO UPDATE SET
    role = invitation_record.role,
    updated_at = NOW();

  -- Set user role
  INSERT INTO user_roles (user_id, role)
  VALUES (user_record.id, invitation_record.role)
  ON CONFLICT (user_id) DO UPDATE SET
    role = invitation_record.role,
    updated_at = NOW();

  -- Set custom permissions if any
  IF invitation_record.permissions IS NOT NULL AND jsonb_typeof(invitation_record.permissions) = 'object' THEN
    -- Delete existing permissions for this user
    DELETE FROM user_permissions WHERE user_id = user_record.id;
    
    -- Insert new permissions
    INSERT INTO user_permissions (user_id, permission, granted)
    SELECT 
      user_record.id,
      key::permission_type,
      (value::text)::boolean
    FROM jsonb_each(invitation_record.permissions)
    WHERE (value::text)::boolean = true;
  END IF;

  -- Mark invitation as accepted
  UPDATE employee_invitations 
  SET status = 'accepted', updated_at = NOW()
  WHERE id = invitation_record.id;

  RETURN jsonb_build_object(
    'success', true, 
    'organization_id', invitation_record.organization_id,
    'role', invitation_record.role
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to cancel an invitation
CREATE OR REPLACE FUNCTION cancel_employee_invitation(invitation_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  invitation_record employee_invitations;
BEGIN
  -- Check if user can cancel this invitation
  SELECT * INTO invitation_record 
  FROM employee_invitations 
  WHERE id = invitation_id;

  IF invitation_record IS NULL THEN
    RAISE EXCEPTION 'Invitation not found';
  END IF;

  -- Check permissions
  IF NOT (
    -- Organization admin
    EXISTS (
      SELECT 1 FROM organization_members om
      WHERE om.organization_id = invitation_record.organization_id
      AND om.user_id = auth.uid()
      AND om.role IN ('owner', 'admin')
    )
    OR
    -- Platform admin
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE id = auth.uid()
    )
  ) THEN
    RAISE EXCEPTION 'Insufficient permissions to cancel invitation';
  END IF;

  -- Cancel the invitation
  UPDATE employee_invitations 
  SET status = 'cancelled', updated_at = NOW()
  WHERE id = invitation_id;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION accept_employee_invitation(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION cancel_employee_invitation(UUID) TO authenticated;

-- Add comments
COMMENT ON TABLE employee_invitations IS 'Stores employee invitations for organizations';
COMMENT ON FUNCTION accept_employee_invitation IS 'Accepts an employee invitation and adds user to organization';
COMMENT ON FUNCTION cancel_employee_invitation IS 'Cancels a pending employee invitation';