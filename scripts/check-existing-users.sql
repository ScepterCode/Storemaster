-- Check Existing Users in Your System
-- Run this first to see what email addresses are registered

-- List all users in the system
SELECT 
  id,
  email,
  created_at,
  email_confirmed_at,
  last_sign_in_at
FROM auth.users
ORDER BY created_at DESC;

-- This will show you all registered users
-- Pick the email you want to make an admin
-- Then use that email in the next step
