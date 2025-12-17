-- Organization Invitations Table
-- This migration adds support for inviting users to organizations

CREATE TABLE IF NOT EXISTS organization_invitations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  token TEXT NOT NULL UNIQUE,
  invited_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'cancelled')),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  accepted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_invitations_org ON organization_invitations(organization_id);
CREATE INDEX idx_invitations_email ON organization_invitations(email);
CREATE INDEX idx_invitations_token ON organization_invitations(token);
CREATE INDEX idx_invitations_status ON organization_invitations(status);

-- Create trigger for updated_at
CREATE TRIGGER update_organization_invitations_updated_at BEFORE UPDATE ON organization_invitations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE organization_invitations ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Users can view invitations for their organization
CREATE POLICY "Users can view their organization invitations"
  ON organization_invitations FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

-- Organization admins can create invitations
CREATE POLICY "Admins can create invitations"
  ON organization_invitations FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid() 
        AND is_active = true 
        AND role IN ('owner', 'admin')
    )
  );

-- Organization admins can update invitations
CREATE POLICY "Admins can update invitations"
  ON organization_invitations FOR UPDATE
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid() 
        AND is_active = true 
        AND role IN ('owner', 'admin')
    )
  );

-- Organization admins can delete invitations
CREATE POLICY "Admins can delete invitations"
  ON organization_invitations FOR DELETE
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid() 
        AND is_active = true 
        AND role IN ('owner', 'admin')
    )
  );

-- Platform admins can manage all invitations
CREATE POLICY "Platform admins can manage all invitations"
  ON organization_invitations FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE id = auth.uid()
    )
  );

COMMENT ON TABLE organization_invitations IS 'Stores pending invitations for users to join organizations';
