-- Ready to Run - Make scepterboss@gmail.com a Super Admin
-- Just copy and paste this entire file into Supabase SQL Editor and run it

-- Step 1: Make user a super admin
SELECT make_user_admin(
  'scepterboss@gmail.com',
  true,
  '["manage_organizations", "view_analytics", "manage_subscriptions", "manage_admins", "view_audit_logs", "manage_users"]'::jsonb
);

-- Step 2: Verify it worked
SELECT 
  u.email,
  a.is_super_admin,
  a.permissions,
  a.created_at
FROM admin_users a
JOIN auth.users u ON a.id = u.id
WHERE u.email = 'scepterboss@gmail.com';

-- If you see your email with is_super_admin = true, SUCCESS! ✅
-- 
-- Next steps:
-- 1. Go to http://localhost:5173/login
-- 2. Login with scepterboss@gmail.com
-- 3. Navigate to http://localhost:5173/admin
-- 4. You're now a system admin! 🎉
