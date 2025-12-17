-- Create Organization Function
-- This function creates an organization and adds the creator as owner atomically
-- This solves the RLS chicken-and-egg problem

CREATE OR REPLACE FUNCTION create_organization_with_owner(
  org_name TEXT,
  org_slug TEXT,
  org_email TEXT DEFAULT NULL,
  org_phone TEXT DEFAULT NULL,
  org_address TEXT DEFAULT NULL,
  subscription_tier TEXT DEFAULT 'free'
)
RETURNS TABLE (
  organization_id UUID,
  organization_data JSONB,
  membership_data JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_org_id UUID;
  new_org JSONB;
  new_membership JSONB;
BEGIN
  -- Check if user is authenticated
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Create the organization
  INSERT INTO organizations (
    name,
    slug,
    email,
    phone,
    address,
    subscription_tier,
    subscription_status,
    is_active,
    trial_ends_at
  ) VALUES (
    org_name,
    org_slug,
    org_email,
    org_phone,
    org_address,
    subscription_tier,
    'trial',
    true,
    NOW() + INTERVAL '14 days'
  )
  RETURNING id INTO new_org_id;

  -- Get the created organization
  SELECT to_jsonb(o.*) INTO new_org
  FROM organizations o
  WHERE o.id = new_org_id;

  -- Add the creator as owner
  INSERT INTO organization_members (
    organization_id,
    user_id,
    role,
    is_active
  ) VALUES (
    new_org_id,
    auth.uid(),
    'owner',
    true
  );

  -- Get the membership
  SELECT to_jsonb(om.*) INTO new_membership
  FROM organization_members om
  WHERE om.organization_id = new_org_id
    AND om.user_id = auth.uid();

  -- Return both
  RETURN QUERY SELECT new_org_id, new_org, new_membership;
END;
$$;

COMMENT ON FUNCTION create_organization_with_owner IS 'Creates an organization and adds the calling user as owner atomically';

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION create_organization_with_owner TO authenticated;
