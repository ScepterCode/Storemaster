-- Admin User Management Functions
-- This migration adds functions to manage admin users

-- Function to make a user an admin
CREATE OR REPLACE FUNCTION make_user_admin(
  user_email TEXT,
  is_super_admin_flag BOOLEAN DEFAULT false,
  admin_permissions JSONB DEFAULT '["manage_organizations", "view_analytics", "manage_subscriptions"]'::jsonb
)
RETURNS admin_users AS $$
DECLARE
  target_user_id UUID;
  admin_record admin_users;
BEGIN
  -- Find the user by email
  SELECT id INTO target_user_id
  FROM auth.users
  WHERE email = user_email;

  IF target_user_id IS NULL THEN
    RAISE EXCEPTION 'User with email % not found', user_email;
  END IF;

  -- Insert or update admin_users record
  INSERT INTO admin_users (id, is_super_admin, permissions)
  VALUES (target_user_id, is_super_admin_flag, admin_permissions)
  ON CONFLICT (id) DO UPDATE
  SET 
    is_super_admin = is_super_admin_flag,
    permissions = admin_permissions,
    updated_at = NOW()
  RETURNING * INTO admin_record;

  RETURN admin_record;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to remove admin privileges
CREATE OR REPLACE FUNCTION remove_admin_privileges(user_email TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  target_user_id UUID;
BEGIN
  -- Find the user by email
  SELECT id INTO target_user_id
  FROM auth.users
  WHERE email = user_email;

  IF target_user_id IS NULL THEN
    RAISE EXCEPTION 'User with email % not found', user_email;
  END IF;

  -- Delete from admin_users
  DELETE FROM admin_users WHERE id = target_user_id;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to list all admin users
CREATE OR REPLACE FUNCTION list_admin_users()
RETURNS TABLE (
  id UUID,
  email TEXT,
  is_super_admin BOOLEAN,
  permissions JSONB,
  last_login_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    a.id,
    u.email,
    a.is_super_admin,
    a.permissions,
    a.last_login_at,
    a.created_at
  FROM admin_users a
  JOIN auth.users u ON a.id = u.id
  ORDER BY a.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add RLS policies for admin_users table
-- Only admins can view admin_users
DROP POLICY IF EXISTS "Admins can view admin users" ON admin_users;
CREATE POLICY "Admins can view admin users"
  ON admin_users
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE id = auth.uid()
    )
  );

-- Only super admins can modify admin_users
DROP POLICY IF EXISTS "Super admins can manage admin users" ON admin_users;
CREATE POLICY "Super admins can manage admin users"
  ON admin_users
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE id = auth.uid() AND is_super_admin = true
    )
  );

-- Grant execute permissions on functions to authenticated users
GRANT EXECUTE ON FUNCTION make_user_admin(TEXT, BOOLEAN, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION remove_admin_privileges(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION list_admin_users() TO authenticated;

-- Add comments
COMMENT ON FUNCTION make_user_admin IS 'Makes a user an admin with specified permissions. Only callable by super admins via RLS.';
COMMENT ON FUNCTION remove_admin_privileges IS 'Removes admin privileges from a user. Only callable by super admins via RLS.';
COMMENT ON FUNCTION list_admin_users IS 'Lists all admin users with their details. Only callable by admins via RLS.';
