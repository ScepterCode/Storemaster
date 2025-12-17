-- Fix RLS Policies to Prevent Infinite Recursion
-- This migration fixes the circular dependency in organization_members policies

-- Drop the problematic policies
DROP POLICY IF EXISTS "Users can view their organization members" ON organization_members;
DROP POLICY IF EXISTS "Admins can view all organization members" ON organization_members;
DROP POLICY IF EXISTS "Users can view their organization" ON organizations;
DROP POLICY IF EXISTS "Admins can view all organizations" ON organizations;
DROP POLICY IF EXISTS "Authenticated users can create organizations" ON organizations;
DROP POLICY IF EXISTS "Organization admins can update their organization" ON organizations;
DROP POLICY IF EXISTS "Users can view their own membership" ON organization_members;
DROP POLICY IF EXISTS "Users can view members in their organizations" ON organization_members;
DROP POLICY IF EXISTS "Admins can manage all organization members" ON organization_members;
DROP POLICY IF EXISTS "Organization admins can add members" ON organization_members;
DROP POLICY IF EXISTS "Organization admins can update members" ON organization_members;
DROP POLICY IF EXISTS "Organization admins can remove members" ON organization_members;
DROP POLICY IF EXISTS "Users can view their organizations" ON organizations;
DROP POLICY IF EXISTS "Admins can manage all organizations" ON organizations;
DROP POLICY IF EXISTS "Users can create their own membership" ON organization_members;

-- Organization Members: Allow users to view members where they are the user
-- This breaks the recursion by using auth.uid() directly instead of a subquery
CREATE POLICY "Users can view their own membership"
  ON organization_members FOR SELECT
  USING (user_id = auth.uid());

-- Organization Members: Allow users to view other members in their organizations
-- Use a security definer function to break the recursion
CREATE OR REPLACE FUNCTION user_organizations()
RETURNS SETOF UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
BEGIN
  RETURN QUERY
  SELECT organization_id 
  FROM organization_members 
  WHERE user_id = auth.uid() AND is_active = true;
END;
$$;

CREATE POLICY "Users can view members in their organizations"
  ON organization_members FOR SELECT
  USING (organization_id IN (SELECT user_organizations()));

-- Organization Members: Admins can view all
CREATE POLICY "Admins can manage all organization members"
  ON organization_members FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE id = auth.uid()
    )
  );

-- Organizations: Users can view their own organizations using the helper function
CREATE POLICY "Users can view their organizations"
  ON organizations FOR SELECT
  USING (id IN (SELECT user_organizations()));

-- Organizations: Admins can manage all organizations
CREATE POLICY "Admins can manage all organizations"
  ON organizations FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE id = auth.uid()
    )
  );

-- Organizations: Allow INSERT for authenticated users (for onboarding)
CREATE POLICY "Authenticated users can create organizations"
  ON organizations FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Organization Members: Allow INSERT for authenticated users (they can add themselves)
CREATE POLICY "Users can create their own membership"
  ON organization_members FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Organization Members: Allow INSERT for organization owners/admins
CREATE POLICY "Organization admins can add members"
  ON organization_members FOR INSERT
  WITH CHECK (
    -- User is an admin/owner of the organization (use security definer function)
    organization_id IN (
      SELECT om.organization_id FROM organization_members om
      WHERE om.user_id = auth.uid()
        AND om.role IN ('owner', 'admin')
        AND om.is_active = true
    )
    OR
    -- User is a platform admin
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE id = auth.uid()
    )
  );

-- Organization Members: Allow UPDATE for organization owners/admins
CREATE POLICY "Organization admins can update members"
  ON organization_members FOR UPDATE
  USING (
    -- User is updating their own membership
    user_id = auth.uid()
    OR
    -- User is an admin/owner of the organization
    organization_id IN (
      SELECT om.organization_id FROM organization_members om
      WHERE om.user_id = auth.uid()
        AND om.role IN ('owner', 'admin')
        AND om.is_active = true
    )
    OR
    -- User is a platform admin
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE id = auth.uid()
    )
  );

-- Organization Members: Allow DELETE for organization owners/admins
CREATE POLICY "Organization admins can remove members"
  ON organization_members FOR DELETE
  USING (
    -- User is an admin/owner of the organization
    organization_id IN (
      SELECT om.organization_id FROM organization_members om
      WHERE om.user_id = auth.uid()
        AND om.role IN ('owner', 'admin')
        AND om.is_active = true
    )
    OR
    -- User is a platform admin
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE id = auth.uid()
    )
  );

-- Organizations: Allow UPDATE for organization owners/admins
CREATE POLICY "Organization admins can update their organization"
  ON organizations FOR UPDATE
  USING (
    id IN (
      SELECT om.organization_id FROM organization_members om
      WHERE om.user_id = auth.uid()
        AND om.role IN ('owner', 'admin')
        AND om.is_active = true
    )
    OR
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE id = auth.uid()
    )
  );

COMMENT ON FUNCTION user_organizations() IS 'Security definer function to get user organizations without RLS recursion';
