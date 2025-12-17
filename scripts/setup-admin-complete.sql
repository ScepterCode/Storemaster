-- Complete Admin Setup - All in One
-- 
-- This script does everything:
-- 1. Checks if user exists
-- 2. Makes user a super admin
-- 3. Creates an organization for the user
-- 
-- INSTRUCTIONS:
-- 1. Replace 'scepterboss@gmail.com' with your email (4 places)
-- 2. Make sure you've created an account first at http://localhost:5173
-- 3. Run this entire script in Supabase SQL Editor

-- ============================================
-- STEP 1: Check if user exists
-- ============================================
DO $$
DECLARE
  user_exists BOOLEAN;
  user_email TEXT := 'scepterboss@gmail.com'; -- CHANGE THIS!
BEGIN
  SELECT EXISTS(SELECT 1 FROM auth.users WHERE email = user_email) INTO user_exists;
  
  IF NOT user_exists THEN
    RAISE EXCEPTION 'User % does not exist. Please create an account first at http://localhost:5173', user_email;
  ELSE
    RAISE NOTICE '✅ User % found', user_email;
  END IF;
END $$;

-- ============================================
-- STEP 2: Make user a super admin
-- ============================================
SELECT make_user_admin(
  'scepterboss@gmail.com',  -- CHANGE THIS!
  true,  -- Super admin
  '["manage_organizations", "view_analytics", "manage_subscriptions", "manage_admins", "view_audit_logs", "manage_users"]'::jsonb
);

-- ============================================
-- STEP 3: Create organization for user
-- ============================================
SELECT create_organization_with_owner(
  'Admin Organization',      -- Organization name
  'admin-org',               -- Slug (must be unique)
  'scepterboss@gmail.com',  -- CHANGE THIS!
  NULL,                      -- Phone
  NULL,                      -- Address
  'enterprise'               -- Subscription tier
);

-- ============================================
-- STEP 4: Verify everything worked
-- ============================================
SELECT 
  '=== VERIFICATION RESULTS ===' as section,
  '' as detail
UNION ALL
SELECT 
  'User Email:' as section,
  u.email as detail
FROM auth.users u
WHERE u.email = 'scepterboss@gmail.com'  -- CHANGE THIS!

UNION ALL
SELECT 
  'Admin Status:' as section,
  CASE 
    WHEN a.is_super_admin THEN '✅ Super Admin'
    ELSE '⚠️ Regular Admin'
  END as detail
FROM admin_users a
JOIN auth.users u ON a.id = u.id
WHERE u.email = 'scepterboss@gmail.com'  -- CHANGE THIS!

UNION ALL
SELECT 
  'Organization:' as section,
  o.name as detail
FROM organizations o
JOIN organization_members om ON o.id = om.organization_id
JOIN auth.users u ON om.user_id = u.id
WHERE u.email = 'scepterboss@gmail.com'  -- CHANGE THIS!

UNION ALL
SELECT 
  'Organization Role:' as section,
  om.role as detail
FROM organization_members om
JOIN auth.users u ON om.user_id = u.id
WHERE u.email = 'scepterboss@gmail.com';  -- CHANGE THIS!

-- ============================================
-- SUCCESS!
-- ============================================
-- If you see:
-- ✅ Super Admin
-- Organization: Admin Organization
-- Role: owner
--
-- Then you're all set!
--
-- Now:
-- 1. Go to http://localhost:5173
-- 2. Login with your email
-- 3. You'll see your dashboard at /dashboard
-- 4. Navigate to /admin for system admin panel
-- ============================================
