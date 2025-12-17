# Complete Admin Setup - Step by Step

## Problem: "Invalid login credentials"

This means the account doesn't exist or you're using the wrong password.

---

## Solution: Follow These Steps in Order

### Step 1: Check if Account Exists

Run `check-account-status.sql` in Supabase SQL Editor.

**If it returns NO ROWS:**
- Account doesn't exist
- Go to Step 2

**If it returns a row:**
- Account exists
- Skip to Step 3

---

### Step 2: Create the Account

You have 2 options:

#### Option A: Create via App (Recommended)

1. Go to http://localhost:5173/login
2. Look for "Sign Up" or "Create Account" button
3. Register with:
   - Email: `scepterboss@gmail.com`
   - Password: (choose a strong password)
4. Complete the signup process
5. Go to Step 3

#### Option B: Create via Supabase Dashboard

1. Go to Supabase Dashboard: https://lynrucsoxywacywkxjgc.supabase.co
2. Navigate to **Authentication** > **Users**
3. Click **Add User**
4. Enter:
   - Email: `scepterboss@gmail.com`
   - Password: (choose a password)
   - Auto Confirm User: ✅ (check this)
5. Click **Create User**
6. Go to Step 3

---

### Step 3: Make the Account an Admin

Run `run-this-now.sql` in Supabase SQL Editor:

```sql
SELECT make_user_admin(
  'scepterboss@gmail.com',
  true,
  '["manage_organizations", "view_analytics", "manage_subscriptions", "manage_admins", "view_audit_logs", "manage_users"]'::jsonb
);
```

You should see:
```
✅ Success - User is now an admin
```

---

### Step 4: Login

1. Go to http://localhost:5173/login
2. Enter:
   - Email: `scepterboss@gmail.com`
   - Password: (the password you set in Step 2)
3. Click **Login**

**If you get "Invalid credentials":**
- You're using the wrong password
- Try the "Forgot Password" link
- Or create a new account with a different email

---

### Step 5: Access Admin Panel

After successful login:

1. Navigate to: http://localhost:5173/admin
2. You should see the admin dashboard! 🎉

---

## Quick Troubleshooting

### Issue: "Invalid login credentials"

**Causes:**
1. Account doesn't exist → Create it (Step 2)
2. Wrong password → Use forgot password or create new account
3. Email not confirmed → Check email or use Supabase dashboard to confirm

**Check:**
```sql
-- See if account exists
SELECT email, email_confirmed_at 
FROM auth.users 
WHERE email = 'scepterboss@gmail.com';
```

---

### Issue: "Unauthorized" at /admin

**Cause:** Not an admin yet

**Solution:**
```sql
-- Make yourself admin
SELECT make_user_admin('scepterboss@gmail.com', true);

-- Verify
SELECT * FROM list_admin_users();
```

---

### Issue: Can't create account

**Possible causes:**
1. Email already exists
2. Password too weak
3. Email confirmation required

**Solutions:**
- Use a different email
- Use a stronger password (8+ characters)
- Check Supabase auth settings

---

## Alternative: Use a Different Email

If you keep having issues with `scepterboss@gmail.com`, try a different email:

1. Create account with a new email (e.g., `admin@test.com`)
2. Make that email an admin:
   ```sql
   SELECT make_user_admin('admin@test.com', true);
   ```
3. Login with the new email

---

## Verification Checklist

- [ ] Account exists (check with `check-account-status.sql`)
- [ ] Email is confirmed
- [ ] Password is correct
- [ ] User is in admin_users table
- [ ] Can login at /login
- [ ] Can access /admin

---

## What to Do Right Now

1. **Run `check-account-status.sql`** to see if account exists
2. **If NO account:** Create one at /login or in Supabase dashboard
3. **If account exists:** Make sure you're using the correct password
4. **Run `run-this-now.sql`** to make yourself admin
5. **Login** and go to /admin

---

## Need to Reset Password?

If you forgot your password:

1. Go to http://localhost:5173/forgot-password
2. Enter `scepterboss@gmail.com`
3. Check your email for reset link
4. Set new password
5. Login with new password

---

## Still Stuck?

Try this simple test:

1. **Create a test account:**
   - Go to /login
   - Sign up with `test@example.com`
   - Use password: `Test123456!`

2. **Make it admin:**
   ```sql
   SELECT make_user_admin('test@example.com', true);
   ```

3. **Login:**
   - Email: `test@example.com`
   - Password: `Test123456!`

4. **Go to /admin**

If this works, the issue is with the `scepterboss@gmail.com` account specifically.
