# How to Check if Recovery Emails Are Being Sent

## Quick Check Steps

### 1. Test the Password Reset Flow

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Navigate to: http://localhost:5173/forgot-password

3. Enter a valid email address (one that exists in your system)

4. Click "Send Reset Link"

5. Check for success message

### 2. Check Supabase Dashboard

Visit: https://lynrucsoxywacywkxjgc.supabase.co

#### Check Auth Logs:
1. Go to **Authentication** → **Logs**
2. Look for recent "password_recovery" events
3. Check the status column:
   - ✅ "sent" = Email was sent successfully
   - ⚠️ "queued" = Email is waiting to be sent
   - ❌ "failed" = Email delivery failed

#### Check Email Settings:
1. Go to **Project Settings** → **Authentication**
2. Scroll to **SMTP Settings**
3. Check if custom SMTP is configured or using default

#### Check Email Templates:
1. Go to **Authentication** → **Email Templates**
2. Find "Reset Password" template
3. Verify it's enabled

### 3. Common Issues

#### Issue: "Email sent" but not received

**Likely causes:**
- Email went to spam folder (check spam/junk)
- Rate limiting (free tier: ~3-4 emails/hour)
- Email provider blocking automated emails

**Solutions:**
- Check spam folder
- Wait 1 hour and try again
- Use a different email provider (Gmail usually works)
- Configure custom SMTP for better deliverability

#### Issue: "Invalid or expired reset link"

**Cause:** Reset links expire after 1 hour

**Solution:** Request a new reset link

#### Issue: No email template configured

**Solution:**
1. Go to Supabase Dashboard → Authentication → Email Templates
2. Enable "Reset Password" template
3. Customize if needed

### 4. Test with Real Email

To properly test, use a real email address you have access to:

1. Register a test user with your email
2. Request password reset
3. Check your inbox (and spam)
4. Click the reset link
5. Set new password

### 5. Development vs Production

**Development (Local Supabase):**
- Emails appear in Inbucket at http://localhost:54324
- No actual emails sent

**Development (Hosted Supabase):**
- Uses Supabase's default email service
- Real emails sent but may be rate-limited
- Often goes to spam

**Production:**
- Should configure custom SMTP
- Better deliverability
- Professional email templates

## Current Implementation Status

✅ **Forgot Password Page**: Working at `/forgot-password`
✅ **Reset Password Page**: Created at `/reset-password`
✅ **Email Request**: Properly calls Supabase API
⚠️ **Email Delivery**: Depends on Supabase configuration

## Next Steps

1. **Test the flow**: Try resetting password with a real email
2. **Check Supabase logs**: Verify emails are being sent
3. **Check spam folder**: Emails often end up there
4. **Configure SMTP** (optional): For production use

## Debugging Commands

```bash
# Start dev server
npm run dev

# Check if route exists
# Navigate to: http://localhost:5173/reset-password
# Should show "Invalid Reset Link" (expected without token)

# Test forgot password
# Navigate to: http://localhost:5173/forgot-password
# Enter email and submit
```

## Email Delivery Checklist

- [ ] User exists in auth.users table
- [ ] Email template enabled in Supabase
- [ ] No rate limiting active
- [ ] Checked spam folder
- [ ] Checked Supabase auth logs
- [ ] Reset password page exists and works
- [ ] Used real email address for testing

## Support Resources

- Supabase Auth Docs: https://supabase.com/docs/guides/auth
- Email Templates: https://supabase.com/docs/guides/auth/auth-email-templates
- SMTP Setup: https://supabase.com/docs/guides/auth/auth-smtp
