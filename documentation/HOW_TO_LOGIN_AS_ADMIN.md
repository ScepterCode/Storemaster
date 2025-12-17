# How to Login as System Admin

## Visual Step-by-Step Guide

### Prerequisites
- ✅ Migration 008 applied to database
- ✅ User account created

---

## Step 1: Create Your Admin Account

### Option A: Using the SQL Script (Easiest)

1. Open `create-first-admin.sql` in your editor

2. Find this line (appears 3 times):
   ```sql
   'your-email@example.com'
   ```

3. Replace with your actual email:
   ```sql
   'john@example.com'  -- Use your real email!
   ```

4. Go to Supabase Dashboard:
   - URL: https://lynrucsoxywacywkxjgc.supabase.co
   - Click **SQL Editor**
   - Paste the modified script
   - Click **Run**

5. You should see output like:
   ```
   User found! Proceeding to make them a super admin...
   
   email: john@example.com
   is_super_admin: true
   permissions: ["manage_organizations", ...]
   ```

### Option B: Using Direct SQL

Run this in Supabase SQL Editor:

```sql
-- Replace with your email
SELECT make_user_admin('your-email@example.com', true);
```

---

## Step 2: Login to Your App

1. Open your browser

2. Go to: **http://localhost:5173/login**

3. Enter your credentials:
   - Email: (the email you made admin)
   - Password: (your password)

4. Click **Login**

---

## Step 3: Access Admin Panel

1. After login, navigate to: **http://localhost:5173/admin**

2. You should see the **Admin Dashboard** with:
   - 📊 Overview
   - 🏢 Organizations
   - 📈 Analytics
   - 📝 Audit Logs
   - 🛡️ Admin Users

3. If you see "Unauthorized" instead:
   - Go back to Step 1
   - Verify you ran the SQL correctly
   - Check your email matches exactly

---

## Step 4: Explore Admin Features

### View Organizations
- Click **Organizations** in sidebar
- See all organizations in the system
- Create, edit, or suspend organizations

### View Analytics
- Click **Analytics** in sidebar
- See platform-wide statistics
- Monitor revenue and growth

### Manage Admins (Super Admin Only)
- Click **Admin Users** in sidebar
- Add new admins
- Remove admin privileges
- Promote to super admin

---

## Verification Checklist

Use this to verify everything is working:

- [ ] Migration 008 applied
- [ ] User account exists
- [ ] User is in admin_users table
- [ ] Can login at /login
- [ ] Can access /admin
- [ ] Can see admin dashboard
- [ ] Can view organizations
- [ ] Can access admin users page (if super admin)

---

## Quick Verification Commands

### Check if you're an admin:
```sql
SELECT 
  u.email,
  a.is_super_admin,
  a.permissions
FROM admin_users a
JOIN auth.users u ON a.id = u.id
WHERE u.email = 'your-email@example.com';
```

### List all admins:
```sql
SELECT * FROM list_admin_users();
```

### Check if functions exist:
```sql
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_name LIKE '%admin%';
```

---

## Common Issues & Solutions

### ❌ "User not found" error

**Problem**: User account doesn't exist

**Solution**: 
1. Go to http://localhost:5173/login
2. Click "Sign Up"
3. Create account with your email
4. Then run the admin SQL script

---

### ❌ "Unauthorized" when accessing /admin

**Problem**: User is not in admin_users table

**Solution**:
```sql
-- Check if you're an admin
SELECT * FROM admin_users WHERE id = (
  SELECT id FROM auth.users WHERE email = 'your-email@example.com'
);

-- If empty, make yourself admin
SELECT make_user_admin('your-email@example.com', true);
```

---

### ❌ "Function does not exist" error

**Problem**: Migration 008 not applied

**Solution**:
```bash
# Apply migrations
supabase db push

# Or apply manually in SQL Editor
# Copy contents of: supabase/migrations/008_admin_user_management.sql
```

---

### ❌ Can't see "Admin Users" menu

**Problem**: You're a regular admin, not super admin

**Solution**:
```sql
-- Promote yourself to super admin
UPDATE admin_users 
SET is_super_admin = true 
WHERE id = (
  SELECT id FROM auth.users WHERE email = 'your-email@example.com'
);
```

---

## What You Can Do as Admin

### 🏢 Manage Organizations
- View all organizations
- Create new organizations
- Edit organization details
- Suspend/activate organizations
- View organization members
- Manage subscriptions

### 📊 View Analytics
- Total organizations
- Active users
- Revenue metrics (MRR)
- Growth trends
- Subscription distribution

### 📝 Audit Logs
- Track all admin actions
- See who changed what
- Monitor system activity
- Compliance and security

### 🛡️ Manage Admins (Super Admin Only)
- Add new admins
- Remove admin privileges
- Set permissions
- Promote to super admin

---

## Admin Panel URLs

| Page | URL | Access |
|------|-----|--------|
| Dashboard | `/admin` | All admins |
| Organizations | `/admin/organizations` | All admins |
| Org Details | `/admin/organizations/:id` | All admins |
| Analytics | `/admin/analytics` | All admins |
| Audit Logs | `/admin/audit-logs` | All admins |
| Admin Users | `/admin/admins` | Super admins only |

---

## Security Best Practices

1. **Use Strong Passwords**
   - Minimum 12 characters
   - Mix of letters, numbers, symbols

2. **Limit Super Admins**
   - Only trusted personnel
   - Minimum necessary

3. **Monitor Audit Logs**
   - Regular reviews
   - Watch for suspicious activity

4. **Secure Your Email**
   - Enable 2FA on email
   - Use secure email provider

---

## Need More Help?

- **Quick Start**: See `ADMIN_QUICK_START.md`
- **Full Guide**: See `ADMIN_SETUP_GUIDE.md`
- **Summary**: See `ADMIN_LOGIN_SUMMARY.md`

---

## Success! 🎉

If you can:
- ✅ Login at /login
- ✅ Access /admin
- ✅ See the admin dashboard
- ✅ View organizations

**You're all set!** You now have full system admin access.

---

## Quick Reference

### Make User Admin
```sql
SELECT make_user_admin('email@example.com', true);
```

### Remove Admin
```sql
SELECT remove_admin_privileges('email@example.com');
```

### List Admins
```sql
SELECT * FROM list_admin_users();
```

### Check Your Status
```sql
SELECT * FROM admin_users WHERE id = auth.uid();
```
