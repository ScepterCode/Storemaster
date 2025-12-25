# Fix Team Members 403 Error

## The Problem
You're getting a 403 Forbidden error when trying to add team members because of Row Level Security (RLS) policies on the `user_roles` table.

## Quick Fix (5 minutes)

### Step 1: Go to Supabase Dashboard
1. Open your Supabase project dashboard
2. Go to **SQL Editor** (in the left sidebar)

### Step 2: Run This SQL Command
Copy and paste this into the SQL Editor and click **Run**:

```sql
-- Fix User Roles RLS Policy
DROP POLICY IF EXISTS "Allow authenticated users to manage roles" ON user_roles;

CREATE POLICY "Allow authenticated users to manage roles"
  ON user_roles FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
```

### Step 3: Test the Feature
1. Go back to your app
2. Try adding a team member again
3. It should work now!

## What This Does
- Removes restrictive policies on the `user_roles` table
- Allows any authenticated user to manage user roles
- Enables the team member creation feature

## Security Note
This is a permissive policy for testing. In production, you should restrict this to admins only:

```sql
-- Production-ready policy (more secure)
DROP POLICY IF EXISTS "Allow authenticated users to manage roles" ON user_roles;

CREATE POLICY "Admins can manage user roles"
  ON user_roles FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role IN ('owner', 'manager')
    )
  );
```

## Alternative: Manual Team Member Addition

If you prefer not to change database policies, you can add team members manually:

1. Ask the person to sign up at your app
2. Get their user ID from the Supabase Auth dashboard
3. Run this SQL command:

```sql
INSERT INTO user_roles (user_id, role) 
VALUES ('their-user-id-here', 'staff');
```

## Files Created
- `scripts/fix-user-roles-rls.sql` - SQL script to fix the issue
- `supabase/migrations/013_fix_user_roles_rls.sql` - Migration file for future deployments

## Need Help?
If you're still having issues, check:
1. You're logged in as an admin user
2. The SQL command ran without errors
3. Your Supabase project has the correct permissions