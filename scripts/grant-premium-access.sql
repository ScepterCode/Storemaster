-- Grant Premium (Pro) Access to scepterboss@gmail.com
-- This script upgrades the user's organization to Pro tier for testing AI features

-- First, find the user and their organization
DO $$
DECLARE
  v_user_id UUID;
  v_org_id UUID;
  v_subscription_id UUID;
BEGIN
  -- Get user ID
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = 'scepterboss@gmail.com';

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User with email scepterboss@gmail.com not found';
  END IF;

  RAISE NOTICE 'Found user ID: %', v_user_id;

  -- Get organization ID
  SELECT organization_id INTO v_org_id
  FROM organization_members
  WHERE user_id = v_user_id AND is_active = true
  LIMIT 1;

  IF v_org_id IS NULL THEN
    RAISE EXCEPTION 'No active organization found for user';
  END IF;

  RAISE NOTICE 'Found organization ID: %', v_org_id;

  -- Update organization to Pro tier
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
  WHERE id = v_org_id;

  RAISE NOTICE 'Updated organization to Pro tier';

  -- Check if subscription exists and update or insert
  SELECT id INTO v_subscription_id
  FROM subscriptions
  WHERE organization_id = v_org_id
  LIMIT 1;

  IF v_subscription_id IS NOT NULL THEN
    -- Update existing subscription
    UPDATE subscriptions
    SET 
      plan_id = 'pro',
      plan_name = 'Professional',
      amount = 350000,
      status = 'active',
      current_period_start = NOW(),
      current_period_end = NOW() + INTERVAL '1 year',
      next_payment_date = NOW() + INTERVAL '1 year',
      metadata = jsonb_build_object(
        'granted_by', 'admin',
        'reason', 'testing',
        'granted_at', NOW()
      ),
      updated_at = NOW()
    WHERE id = v_subscription_id;
    
    RAISE NOTICE 'Updated existing subscription record';
  ELSE
    -- Create new subscription
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
    VALUES (
      v_org_id,
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
    );
    
    RAISE NOTICE 'Created new subscription record';
  END IF;

  -- Log the action
  INSERT INTO audit_logs (
    user_id,
    action,
    target_type,
    target_id,
    organization_id,
    details
  )
  VALUES (
    v_user_id,
    'subscription_upgraded',
    'organization',
    v_org_id,
    v_org_id,
    jsonb_build_object(
      'from_tier', 'free',
      'to_tier', 'pro',
      'reason', 'Testing AI features',
      'granted_by', 'admin'
    )
  );

  RAISE NOTICE 'Logged audit entry';
  RAISE NOTICE 'SUCCESS: Premium access granted to scepterboss@gmail.com';
  RAISE NOTICE 'Organization upgraded to Pro tier with full AI features access';
  
END $$;

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
