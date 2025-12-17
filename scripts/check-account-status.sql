-- Check if scepterboss@gmail.com exists in the system
-- Run this in Supabase SQL Editor

-- Check if user exists
SELECT 
  id,
  email,
  created_at,
  email_confirmed_at,
  last_sign_in_at,
  CASE 
    WHEN email_confirmed_at IS NULL THEN '⚠️ Email not confirmed'
    ELSE '✅ Email confirmed'
  END as status
FROM auth.users
WHERE email = 'scepterboss@gmail.com';

-- If this returns NO ROWS, the account doesn't exist yet
-- If it returns a row, the account exists

-- Also check if already an admin
SELECT 
  'Already an admin!' as message,
  is_super_admin,
  permissions
FROM admin_users
WHERE id = (
  SELECT id FROM auth.users WHERE email = 'scepterboss@gmail.com'
);

-- If this returns NO ROWS, you need to run the make_user_admin function
-- If it returns a row, you're already an admin!
