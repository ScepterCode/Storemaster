# Admin Quick Start Guide

## TL;DR - Get Admin Access in 3 Steps

### Step 1: Apply the Migration

The migration file `supabase/migrations/008_admin_user_management.sql` needs to be applied to your database.

If using Supabase CLI:
```bash
supabase db push
```

Or apply it manually through the Supabase Dashboard SQL Editor.

### Step 2: Create Your Admin Account

1. **First, create a regular user account** (if you haven't already):
   - Go to http://localhost:5173/login
   - Sign up with your email
   - Verify your email if required

2. **Make yourself a super admin**:
   - Go to Supabase Dashboard: https://lynrucsoxywacywkxjgc.supabase.co
   - Navigate to **SQL Editor**
   - Open the file `create-first-admin.sql`
   - Replace `'your-email@example.com'` with your actual email (3 places)
   - Run the script

### Step 3: Access the Admin Panel

1. Login at: http://localhost:5173/login
2. Navigate to: http://localhost:5173/admin
3. You should see the admin dashboard!

## What You Can Do as Admin

### Admin Dashboard Features

- **Overview** (`/admin`) - Platform statistics
- **Organizations** (`/admin/organizations`) - Manage all organizations
- **Analytics** (`/admin/analytics`) - Platform analytics
- **Audit Logs** (`/admin/audit-logs`) - Track all actions
- **Admin Users** (`/admin/admins`) - Manage other admins (super admin only)

### Managing Organizations

As an admin, you can:
- View all organizations
- Create new organizations
- Suspend/activate organizations
- View organization details
- Manage subscriptions
- View usage metrics

### Managing Admins (Super Admin Only)

Navigate to `/admin/admins` to:
- View all admin users
- Add new admins
- Remove admin privileges
- Set super admin status
- Manage permissions

## Quick Commands

### Make User Admin (SQL)
```sql
SELECT make_user_admin('user@example.com', false);
```

### Make User Super Admin (SQL)
```sql
SELECT make_user_admin('user@example.com', true);
```

### Remove Admin Privileges (SQL)
```sql
SELECT remove_admin_privileges('user@example.com');
```

### List All Admins (SQL)
```sql
SELECT * FROM list_admin_users();
```

### Check if You're an Admin (SQL)
```sql
SELECT * FROM admin_users WHERE id = auth.uid();
```

## Troubleshooting

### "Unauthorized" when accessing /admin

1. Make sure you're logged in
2. Check if you're in the admin_users table:
   ```sql
   SELECT * FROM admin_users WHERE id = (
     SELECT id FROM auth.users WHERE email = 'your-email@example.com'
   );
   ```
3. If not, run the create-first-admin.sql script

### Migration Not Applied

Check if the functions exist:
```sql
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_name IN ('make_user_admin', 'remove_admin_privileges', 'list_admin_users');
```

If they don't exist, apply migration 008.

### User Not Found Error

Make sure the user account exists first:
```sql
SELECT email FROM auth.users WHERE email = 'your-email@example.com';
```

If not found, sign up at http://localhost:5173/login first.

## Admin vs Regular User

| Feature | Regular User | Admin | Super Admin |
|---------|-------------|-------|-------------|
| Access own organization | ✅ | ✅ | ✅ |
| Access admin panel | ❌ | ✅ | ✅ |
| View all organizations | ❌ | ✅ | ✅ |
| Manage organizations | ❌ | ✅ | ✅ |
| View analytics | ❌ | ✅ | ✅ |
| Manage admins | ❌ | ❌ | ✅ |

## Security Notes

- Super admins can create/remove other admins
- Regular admins cannot manage other admins
- All admin actions are logged in audit_logs
- Admin access is controlled by RLS policies

## Next Steps

1. ✅ Create your first super admin
2. ✅ Login and access /admin
3. ✅ Explore the admin features
4. ✅ Create additional admins if needed
5. ✅ Set up monitoring and alerts

## Need Help?

Check the full guide: `ADMIN_SETUP_GUIDE.md`
