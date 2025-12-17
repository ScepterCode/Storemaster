-- Fix infinite recursion in admin_users RLS policies
-- The issue: admin_users policies check admin_users table, causing infinite recursion

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Admins can view admin users" ON admin_users;
DROP POLICY IF EXISTS "Super admins can manage admin users" ON admin_users;

-- Create simple, non-recursive policies
-- Allow users to view their own admin record
CREATE POLICY "Users can view own admin record"
  ON admin_users
  FOR SELECT
  USING (id = auth.uid());

-- Allow super admins to view all admin records
-- Use a direct check without recursion
CREATE POLICY "Super admins can view all admin records"
  ON admin_users
  FOR SELECT
  USING (
    id = auth.uid() AND is_super_admin = true
  );

-- Allow super admins to insert new admin records
CREATE POLICY "Super admins can insert admin records"
  ON admin_users
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE id = auth.uid() AND is_super_admin = true
    )
  );

-- Allow super admins to update admin records
CREATE POLICY "Super admins can update admin records"
  ON admin_users
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE id = auth.uid() AND is_super_admin = true
    )
  );

-- Allow super admins to delete admin records
CREATE POLICY "Super admins can delete admin records"
  ON admin_users
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE id = auth.uid() AND is_super_admin = true
    )
  );

-- Update the helper functions to avoid recursion
CREATE OR REPLACE FUNCTION is_admin(user_uuid UUID)
RETURNS BOOLEAN
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Direct check without policy evaluation
  RETURN EXISTS (
    SELECT 1 FROM admin_users
    WHERE id = user_uuid
  );
END;
$$;

CREATE OR REPLACE FUNCTION is_super_admin(user_uuid UUID)
RETURNS BOOLEAN
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Direct check without policy evaluation
  RETURN EXISTS (
    SELECT 1 FROM admin_users
    WHERE id = user_uuid AND is_super_admin = true
  );
END;
$$;

COMMENT ON POLICY "Users can view own admin record" ON admin_users IS 'Allows users to check if they are admins';
COMMENT ON POLICY "Super admins can view all admin records" ON admin_users IS 'Allows super admins to view all admin users';
