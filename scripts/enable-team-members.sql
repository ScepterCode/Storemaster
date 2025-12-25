-- Enable Team Members - Run this in Supabase SQL Editor
-- This allows the team member system to work immediately

-- Fix user_roles table permissions
DROP POLICY IF EXISTS "Allow authenticated users to manage roles" ON user_roles;

CREATE POLICY "Allow authenticated users to manage roles"
  ON user_roles FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Also ensure users can manage their own roles
CREATE POLICY IF NOT EXISTS "Users can manage own role"
  ON user_roles FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- This allows:
-- 1. Any logged-in user to manage user roles (for admin functions)
-- 2. Users to set their own roles (for invitation acceptance)
-- The team member system will now work immediately!