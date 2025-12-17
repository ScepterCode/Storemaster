-- Create Organization for Admin User
-- Run this after making yourself an admin

-- Step 1: Create an organization for the admin
-- Replace 'scepterboss@gmail.com' with your email

-- Create the organization and assign you as owner
SELECT create_organization_with_owner(
  'Admin Organization',           -- Organization name
  'admin-org',                     -- Slug (unique identifier)
  'scepterboss@gmail.com',        -- Your email (CHANGE THIS!)
  NULL,                            -- Phone (optional)
  NULL,                            -- Address (optional)
  'enterprise'                     -- Subscription tier
);

-- Step 2: Verify it worked
SELECT 
  o.name as organization_name,
  o.slug,
  o.subscription_tier,
  om.role,
  u.email
FROM organizations o
JOIN organization_members om ON o.id = om.organization_id
JOIN auth.users u ON om.user_id = u.id
WHERE u.email = 'scepterboss@gmail.com';  -- CHANGE THIS!

-- You should see your organization with role = 'owner'

-- Now you can:
-- 1. Login at http://localhost:5173/login
-- 2. Go to http://localhost:5173/dashboard (your organization dashboard)
-- 3. Go to http://localhost:5173/admin (system admin panel)
