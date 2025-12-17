-- Simple Premium Access Grant for scepterboss@gmail.com
-- Run this in Supabase SQL Editor

-- Step 1: Update organization to Pro tier
UPDATE organizations
SET 
  subscription_tier = 'pro',
  subscription_status = 'active',
  subscription_starts_at = NOW(),
  subscription_ends_at = NOW() + INTERVAL '1 year',
  max_users = 15,
  max_products = 2000,
  max_invoices_per_month = 500,
  max_storage_mb = 5000,
  updated_at = NOW()
WHERE id IN (
  SELECT om.organization_id
  FROM organization_members om
  JOIN auth.users u ON u.id = om.user_id
  WHERE u.email = 'scepterboss@gmail.com'
  AND om.is_active = true
  LIMIT 1
);

-- Step 2: Delete any existing subscriptions for this org (to avoid conflicts)
DELETE FROM subscriptions
WHERE organization_id IN (
  SELECT om.organization_id
  FROM organization_members om
  JOIN auth.users u ON u.id = om.user_id
  WHERE u.email = 'scepterboss@gmail.com'
  AND om.is_active = true
);

-- Step 3: Create new Pro subscription
INSERT INTO subscriptions (
  organization_id,
  plan_id,
  plan_name,
  amount,
  currency,
  interval,
  status,
  current_period_start,
  current_period_end,
  next_payment_date,
  metadata
)
SELECT 
  om.organization_id,
  'pro',
  'Professional',
  350000,
  'NGN',
  'yearly',
  'active',
  NOW(),
  NOW() + INTERVAL '1 year',
  NOW() + INTERVAL '1 year',
  jsonb_build_object(
    'granted_by', 'admin',
    'reason', 'testing',
    'granted_at', NOW()
  )
FROM organization_members om
JOIN auth.users u ON u.id = om.user_id
WHERE u.email = 'scepterboss@gmail.com'
AND om.is_active = true
LIMIT 1;

-- Verify the upgrade
SELECT 
  u.email,
  o.name as organization_name,
  o.subscription_tier,
  o.subscription_status,
  o.subscription_ends_at,
  o.max_users,
  o.max_products,
  s.plan_name,
  s.status as subscription_status
FROM auth.users u
JOIN organization_members om ON om.user_id = u.id
JOIN organizations o ON o.id = om.organization_id
LEFT JOIN subscriptions s ON s.organization_id = o.id
WHERE u.email = 'scepterboss@gmail.com';
