# Complete Admin Setup Guide

## The Problem

After login, you're redirected to `/onboarding/setup` because you don't have an organization yet. This is the expected multi-tenant behavior.

## The Solution

You need to do 3 things:

1. Create a user account
2. Make the user an admin
3. Create an organization for the user

---

## Step-by-Step Setup

### Step 1: Create User Account

Go to http://localhost:5173 and register with your email.

Or check if account exists:
```sql
SELECT email FROM auth.users WHERE email = 'scepterboss@gmail.com';
```

---

### Step 2: Make User an Admin

Run in Supabase SQL Editor:

```sql
SELECT make_user_admin('scepterboss@gmail.com', true);
```

Verify:
```sql
SELECT * FROM list_admin_users();
```

---

### Step 3: Create Organization for User

Run `create-admin-organization.sql` in Supabase SQL Editor:

```sql
SELECT create_organization_with_owner(
  'Admin Organization',
  'admin-org',
  'scepterboss@gmail.com',  -- Your email
  NULL,
  NULL,
  'enterprise'
);
```

Verify:
```sql
SELECT 
  o.name,
  om.role,
  u.email
FROM organizations o
JOIN organization_members om ON o.id = om.organization_id
JOIN auth.users u ON om.user_id = u.id
WHERE u.email = 'scepterboss@gmail.com';
```

---

## Now You Can Login

1. Go to http://localhost:5173
2. Login with `scepterboss@gmail.com`
3. You'll be redirected to `/dashboard` (your organization dashboard)
4. Navigate to `/admin` to access the system admin panel

---

## What You Have Access To

### As Organization Owner:
- `/dashboard` - Your organization's dashboard
- `/inventory` - Manage products
- `/transactions` - View sales
- `/reports` - Business reports
- `/settings` - Organization settings

### As System Admin:
- `/admin` - System admin panel
- `/admin/organizations` - Manage ALL organizations
- `/admin/analytics` - Platform analytics
- `/admin/admins` - Manage admin users
- `/admin/audit-logs` - View all actions

---

## Quick Setup Script

Run all these in order in Supabase SQL Editor:

```sql
-- 1. Check if user exists
SELECT email FROM auth.users WHERE email = 'scepterboss@gmail.com';

-- 2. Make admin (if user exists)
SELECT make_user_admin('scepterboss@gmail.com', true);

-- 3. Create organization
SELECT create_organization_with_owner(
  'Admin Organization',
  'admin-org',
  'scepterboss@gmail.com',
  NULL,
  NULL,
  'enterprise'
);

-- 4. Verify everything
SELECT 
  'Admin Status' as check_type,
  is_super_admin::text as status
FROM admin_users a
JOIN auth.users u ON a.id = u.id
WHERE u.email = 'scepterboss@gmail.com'

UNION ALL

SELECT 
  'Organization' as check_type,
  o.name as status
FROM organizations o
JOIN organization_members om ON o.id = om.organization_id
JOIN auth.users u ON om.user_id = u.id
WHERE u.email = 'scepterboss@gmail.com';
```

---

## Troubleshooting

### Issue: "User not found"
**Solution**: Create account first at http://localhost:5173

### Issue: "Still redirected to onboarding"
**Solution**: You need an organization. Run step 3 above.

### Issue: "Can't access /admin"
**Solution**: Make sure you're an admin. Run step 2 above.

### Issue: "Function does not exist"
**Solution**: Apply migrations first:
```bash
supabase db push
```

---

## Alternative: Skip Organization for Admins

If you want admins to access `/admin` without an organization, you can modify the redirect logic. But it's better to just create an organization for the admin user.

---

## Summary

The multi-tenant system requires:
1. **User account** (auth.users)
2. **Admin privileges** (admin_users table)
3. **Organization membership** (organization_members table)

All three are needed for full access.
