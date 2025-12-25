-- Quick Fix for User Roles RLS
-- Run this in your Supabase SQL Editor to fix the 403 error

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Users can manage their own role" ON user_roles;
DROP POLICY IF EXISTS "Admins can manage all user roles" ON user_roles;
DROP POLICY IF EXISTS "Users can view their own role" ON user_roles;
DROP POLICY IF EXISTS "Staff can manage user roles" ON user_roles;
DROP POLICY IF EXISTS "Temporary: Allow authenticated users to manage roles" ON user_roles;

-- Create permissive policy for authenticated users (temporary for testing)
CREATE POLICY "Allow authenticated users to manage roles"
  ON user_roles FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- This allows any logged-in user to manage user roles
-- In production, you should restrict this to admins only