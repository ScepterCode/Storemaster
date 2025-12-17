-- Make Yourself an Admin
-- 
-- STEP 1: First run check-existing-users.sql to see your email
-- STEP 2: Replace YOUR_ACTUAL_EMAIL below with your real email from step 1
-- STEP 3: Run this script

-- Make user a super admin
SELECT make_user_admin(
  'YOUR_ACTUAL_EMAIL',  -- ⚠️ REPLACE THIS with your actual email!
  true,                  -- true = super admin, false = regular admin
  '["manage_organizations", "view_analytics", "manage_subscriptions", "manage_admins", "view_audit_logs", "manage_users"]'::jsonb
);

-- Verify it worked
SELECT 
  u.email,
  a.is_super_admin,
  a.permissions,
  a.created_at
FROM admin_users a
JOIN auth.users u ON a.id = u.id
WHERE u.email = 'scepterboss@gmail.com';  -- ⚠️ REPLACE THIS too!

-- If you see your email with is_super_admin = true, you're done!
-- Now login at http://localhost:5173/login
-- Then go to http://localhost:5173/admin
