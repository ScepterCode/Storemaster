# Quick Fix for "User not found" Error

## The Problem

You got this error:
```
ERROR: User with email your-email@example.com not found
```

## The Solution (30 seconds)

### Option 1: Use the Helper Scripts

**Step 1:** Run `check-existing-users.sql` in Supabase SQL Editor
- This shows all registered emails

**Step 2:** Open `make-me-admin.sql`
- Replace `YOUR_ACTUAL_EMAIL` with your email from step 1
- Run it

**Done!** ✅

---

### Option 2: One-Line Fix

Just run this with YOUR email:

```sql
SELECT make_user_admin('PUT_YOUR_EMAIL_HERE', true);
```

**Example:**
```sql
SELECT make_user_admin('john@example.com', true);
```

---

## Don't Have an Account?

If you don't have a user account yet:

1. Go to http://localhost:5173/login
2. Sign up with your email
3. Then run the SQL above with that email

---

## Verify It Worked

```sql
SELECT * FROM list_admin_users();
```

Should show your email with `is_super_admin = true`.

---

## Now Login

1. Go to http://localhost:5173/login
2. Login with your email
3. Navigate to http://localhost:5173/admin
4. You're an admin! 🎉

---

## Still Stuck?

See `ADMIN_SETUP_SIMPLE.md` for detailed help.
