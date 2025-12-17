# System Admin Setup Guide

## Overview

This guide explains how to set up and access the system admin panel where you can manage all organizations, users, subscriptions, and view platform analytics.

## Admin System Architecture

### What is a System Admin?

- **System Admins** are platform administrators who can manage ALL organizations
- **Super Admins** have full control including creating other admins
- **Regular Admins** have limited permissions based on their role

### Admin vs Organization Owner

- **Organization Owner**: Manages their own organization only
- **System Admin**: Manages ALL organizations across the platform

## Step 1: Run the Admin Migration

First, apply the admin management migration:

```bash
# Make sure you're connected to your Supabase database
# Then run the migration
```

The migration file is: `supabase/migrations/008_admin_user_management.sql`

This creates:
- Functions to manage admin users
- RLS policies for admin access
- Helper functions for listing admins

## Step 2: Create Your First Super Admin

### Option A: Using Supabase SQL Editor (Recommended)

1. Go to your Supabase Dashboard: https://lynrucsoxywacywkxjgc.supabase.co
2. Navigate to **SQL Editor**
3. Create a new query
4. Run this SQL (replace with your email):

```sql
-- First, make sure you have a user account
-- If not, sign up through your app first at http://localhost:5173/login

-- Then make that user a super admin
SELECT make_user_admin(
  'your-email@example.com',  -- Replace with your email
  true,                       -- Make super admin
  '["manage_organizations", "view_analytics", "manage_subscriptions", "manage_admins"]'::jsonb
);
```

5. Verify it worked:

```sql
-- Check if you're now an admin
SELECT * FROM list_admin_users();
```

### Option B: Using Direct SQL

If you have direct database access:

```sql
-- Insert directly into admin_users table
INSERT INTO admin_users (id, is_super_admin, permissions)
SELECT 
  id,
  true,
  '["manage_organizations", "view_analytics", "manage_subscriptions", "manage_admins"]'::jsonb
FROM auth.users
WHERE email = 'your-email@example.com'
ON CONFLICT (id) DO UPDATE
SET 
  is_super_admin = true,
  permissions = EXCLUDED.permissions,
  updated_at = NOW();
```

## Step 3: Access the Admin Panel

### Login Process

1. **Sign in normally** at: http://localhost:5173/login
2. Use your admin email and password
3. After login, navigate to: http://localhost:5173/admin
4. You should see the admin dashboard

### Admin Panel Features

The admin panel includes:

- **Overview**: Platform statistics and metrics
- **Organizations**: Manage all organizations
  - View all organizations
  - Create new organizations
  - Suspend/activate organizations
  - View organization details
- **Analytics**: Platform-wide analytics
  - Revenue metrics
  - User growth
  - Subscription trends
- **Audit Logs**: Track all admin actions
  - Who did what and when
  - Organization changes
  - Subscription modifications

## Step 4: Create Additional Admins

Once you're logged in as a super admin, you can create other admins:

### Using SQL (Recommended for now)

```sql
-- Make another user a regular admin (not super admin)
SELECT make_user_admin(
  'admin@example.com',
  false,  -- Not a super admin
  '["manage_organizations", "view_analytics"]'::jsonb
);

-- Make a user a super admin
SELECT make_user_admin(
  'superadmin@example.com',
  true,  -- Super admin
  '["manage_organizations", "view_analytics", "manage_subscriptions", "manage_admins"]'::jsonb
);
```

### Available Permissions

- `manage_organizations`: Create, update, suspend organizations
- `view_analytics`: View platform analytics
- `manage_subscriptions`: Manage subscription plans and billing
- `manage_admins`: Create and remove other admins (super admin only)
- `view_audit_logs`: View audit logs
- `manage_users`: Manage user accounts

## Admin User Management Functions

### Make User Admin

```sql
SELECT make_user_admin(
  user_email TEXT,
  is_super_admin BOOLEAN DEFAULT false,
  permissions JSONB DEFAULT '["manage_organizations", "view_analytics"]'::jsonb
);
```

### Remove Admin Privileges

```sql
SELECT remove_admin_privileges('user@example.com');
```

### List All Admins

```sql
SELECT * FROM list_admin_users();
```

## Troubleshooting

### Issue: "Unauthorized" when accessing /admin

**Causes:**
1. User is not in the admin_users table
2. User is not logged in
3. RLS policies not applied

**Solutions:**
1. Verify user is an admin:
   ```sql
   SELECT * FROM admin_users WHERE id = (
     SELECT id FROM auth.users WHERE email = 'your-email@example.com'
   );
   ```

2. Check if user is logged in (browser console):
   ```javascript
   const { data } = await supabase.auth.getUser();
   console.log(data);
   ```

3. Re-run migrations if needed

### Issue: Cannot create admin users

**Cause:** Migration not applied

**Solution:**
```bash
# Apply the migration
# Check your Supabase dashboard > Database > Migrations
```

### Issue: Admin panel shows loading forever

**Cause:** useAdminAuth hook failing

**Solution:**
1. Check browser console for errors
2. Verify admin_users table exists
3. Check RLS policies are enabled

## Security Best Practices

### 1. Limit Super Admins
- Only create super admins for trusted personnel
- Super admins can create/remove other admins

### 2. Use Specific Permissions
- Don't give all permissions to every admin
- Use least privilege principle

### 3. Monitor Admin Actions
- Regularly review audit logs
- Track who makes changes

### 4. Secure Admin Accounts
- Use strong passwords
- Enable 2FA (when available)
- Don't share admin credentials

## Testing Admin Access

### Quick Test

1. **Create test admin:**
   ```sql
   SELECT make_user_admin('test@example.com', true);
   ```

2. **Login:**
   - Go to http://localhost:5173/login
   - Login with test@example.com

3. **Access admin panel:**
   - Navigate to http://localhost:5173/admin
   - Should see admin dashboard

4. **Test features:**
   - View organizations
   - Check analytics
   - View audit logs

## Admin Panel Routes

- `/admin` - Admin dashboard overview
- `/admin/organizations` - Manage organizations
- `/admin/organizations/:id` - Organization details
- `/admin/analytics` - Platform analytics
- `/admin/audit-logs` - Audit logs

## Next Steps

1. ✅ Run migration 008
2. ✅ Create your first super admin
3. ✅ Login and access /admin
4. ✅ Test admin features
5. ✅ Create additional admins as needed
6. ✅ Set up monitoring and alerts

## Production Considerations

### Before Going Live:

1. **Create production super admin**
   - Use a secure email
   - Use a strong password
   - Document credentials securely

2. **Set up admin team**
   - Define roles and permissions
   - Create admin accounts
   - Document access procedures

3. **Enable audit logging**
   - Monitor all admin actions
   - Set up alerts for critical changes
   - Regular audit log reviews

4. **Secure admin access**
   - Consider IP whitelisting
   - Enable 2FA
   - Use VPN for admin access

## Support

If you encounter issues:

1. Check Supabase logs for errors
2. Verify migrations are applied
3. Check RLS policies
4. Review browser console for errors
5. Check network tab for API failures

## Quick Reference

### Create Super Admin
```sql
SELECT make_user_admin('email@example.com', true);
```

### Create Regular Admin
```sql
SELECT make_user_admin('email@example.com', false, '["manage_organizations"]'::jsonb);
```

### Remove Admin
```sql
SELECT remove_admin_privileges('email@example.com');
```

### List Admins
```sql
SELECT * FROM list_admin_users();
```

### Check if User is Admin
```sql
SELECT is_admin(user_id);
```

### Check if User is Super Admin
```sql
SELECT is_super_admin(user_id);
```
