-- Quick Script to Create First Super Admin
-- 
-- INSTRUCTIONS:
-- 1. Replace 'your-email@example.com' with your actual email
-- 2. Make sure you've already created an account with this email
-- 3. Run this in Supabase SQL Editor
-- 4. Then login and go to /admin

-- Step 1: Verify the user exists
DO $$
DECLARE
  user_exists BOOLEAN;
  user_email TEXT := 'your-email@example.com'; -- CHANGE THIS!
BEGIN
  SELECT EXISTS(SELECT 1 FROM auth.users WHERE email = user_email) INTO user_exists;
  
  IF NOT user_exists THEN
    RAISE NOTICE 'ERROR: User with email % does not exist!', user_email;
    RAISE NOTICE 'Please create an account first by signing up at your app.';
  ELSE
    RAISE NOTICE 'User found! Proceeding to make them a super admin...';
  END IF;
END $$;

-- Step 2: Make the user a super admin
SELECT make_user_admin(
  'your-email@example.com',  -- CHANGE THIS to your email!
  true,                       -- Make super admin (true) or regular admin (false)
  '["manage_organizations", "view_analytics", "manage_subscriptions", "manage_admins", "view_audit_logs", "manage_users"]'::jsonb
);

-- Step 3: Verify it worked
SELECT 
  u.email,
  a.is_super_admin,
  a.permissions,
  a.created_at
FROM admin_users a
JOIN auth.users u ON a.id = u.id
WHERE u.email = 'your-email@example.com'; -- CHANGE THIS!

-- You should see your email with is_super_admin = true

-- Step 4: List all admins (optional)
SELECT * FROM list_admin_users();
