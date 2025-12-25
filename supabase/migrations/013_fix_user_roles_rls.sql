-- Fix User Roles RLS Policies
-- This migration fixes the Row Level Security policies for user_roles table

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can manage their own role" ON user_roles;
DROP POLICY IF EXISTS "Admins can manage all user roles" ON user_roles;
DROP POLICY IF EXISTS "Users can view their own role" ON user_roles;
DROP POLICY IF EXISTS "Staff can manage user roles" ON user_roles;

-- Allow users to view their own role
CREATE POLICY "Users can view their own role"
  ON user_roles FOR SELECT
  USING (user_id = auth.uid());

-- Allow users to insert their own role (for self-registration)
CREATE POLICY "Users can create their own role"
  ON user_roles FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Allow users to update their own role (temporary - for testing)
CREATE POLICY "Users can update their own role"
  ON user_roles FOR UPDATE
  USING (user_id = auth.uid());

-- Allow staff and above to manage user roles
CREATE POLICY "Staff can manage user roles"
  ON user_roles FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role IN ('staff', 'manager', 'owner')
    )
  );

-- Allow admins to manage all user roles
CREATE POLICY "Admins can manage all user roles"
  ON user_roles FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE id = auth.uid()
    )
  );

-- Temporary policy: Allow any authenticated user to manage user_roles (for testing)
-- TODO: Remove this in production and use proper role-based access
CREATE POLICY "Temporary: Allow authenticated users to manage roles"
  ON user_roles FOR ALL
  USING (auth.uid() IS NOT NULL);

COMMENT ON POLICY "Temporary: Allow authenticated users to manage roles" ON user_roles IS 'Temporary policy for testing - remove in production';