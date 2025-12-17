# Password Recovery Email Check

## Current Implementation Status

✅ **Code Implementation**: Password reset functionality is properly implemented in `src/pages/ForgotPasswordPage.tsx`

❌ **Reset Password Page**: The redirect target `/reset-password` page doesn't exist yet

⚠️ **Email Delivery**: Depends on Supabase email configuration

## How to Check if Emails Are Being Sent

### 1. Check Supabase Dashboard

Go to your Supabase project dashboard:
- URL: https://lynrucsoxywacywkxjgc.supabase.co

#### A. Check Auth Logs
1. Navigate to **Authentication** > **Logs**
2. Look for password reset events
3. Check if emails were queued/sent

#### B. Check SMTP Settings
1. Navigate to **Project Settings** > **Authentication**
2. Scroll to **SMTP Settings**
3. Check if custom SMTP is configured

**Default Behavior:**
- In development, Supabase uses their built-in email service
- Emails may be rate-limited (max 3-4 per hour in free tier)
- Some emails might go to spam

#### C. Check Email Templates
1. Navigate to **Authentication** > **Email Templates**
2. Find "Reset Password" template
3. Verify the template is enabled and configured

### 2. Test Email Delivery

#### Option A: Use the Application
1. Go to http://localhost:5173/forgot-password
2. Enter a valid email address (one that exists in your auth.users table)
3. Click "Send Reset Link"
4. Check the email inbox (including spam folder)

#### Option B: Use the Test Script
```bash
node test-email-recovery.js
```

#### Option C: Check Supabase Logs Directly
1. Go to Supabase Dashboard > **Logs** > **Auth Logs**
2. Filter by "password_recovery"
3. Look for recent entries

### 3. Common Issues and Solutions

#### Issue: Emails Not Received

**Possible Causes:**
1. **Rate Limiting**: Free tier has email limits
   - Solution: Wait 1 hour between tests or upgrade plan

2. **Email in Spam**: Supabase's default emails often go to spam
   - Solution: Check spam folder or configure custom SMTP

3. **Invalid Email**: Email doesn't exist in auth.users
   - Solution: Use an email that's registered in the system

4. **SMTP Not Configured**: Using default Supabase email service
   - Solution: Configure custom SMTP in Project Settings

5. **Email Template Disabled**: Template might be turned off
   - Solution: Enable in Authentication > Email Templates

#### Issue: No Reset Password Page

**Current Status**: The redirect URL points to `/reset-password` but this page doesn't exist

**Solution**: Create the reset password page (see below)

### 4. Verify Email Delivery in Development

For local development, Supabase provides an **Inbucket** email testing service:

1. Check if your project has Inbucket enabled
2. Access it at: `http://localhost:54324` (if running local Supabase)
3. All emails sent in development will appear here

**Note**: This only works with local Supabase setup, not hosted projects

### 5. Production Email Setup

For production, you should configure custom SMTP:

1. Go to **Project Settings** > **Authentication** > **SMTP Settings**
2. Configure your email provider (SendGrid, AWS SES, Mailgun, etc.)
3. Test the configuration
4. Update email templates with your branding

## Next Steps

### 1. Create Reset Password Page

The application needs a `/reset-password` page to handle the password reset flow:

```typescript
// src/pages/ResetPasswordPage.tsx
// This page should:
// 1. Extract the token from URL
// 2. Show a form to enter new password
// 3. Call supabase.auth.updateUser({ password: newPassword })
// 4. Redirect to login on success
```

### 2. Test Email Delivery

1. Try sending a password reset email
2. Check Supabase logs for delivery status
3. Verify email arrives (check spam)

### 3. Configure Production SMTP (Optional)

For better deliverability in production:
- Set up custom SMTP provider
- Configure SPF/DKIM records
- Customize email templates

## Quick Test Commands

```bash
# Test the forgot password page
npm run dev
# Navigate to: http://localhost:5173/forgot-password

# Check Supabase logs
# Go to: https://lynrucsoxywacywkxjgc.supabase.co
# Navigate to: Authentication > Logs
```

## Email Delivery Checklist

- [ ] User email exists in auth.users table
- [ ] Email template is enabled in Supabase
- [ ] SMTP settings are configured (or using default)
- [ ] Check spam folder
- [ ] Check Supabase auth logs for errors
- [ ] Rate limits not exceeded
- [ ] Reset password page exists at `/reset-password`
- [ ] Test with a real email address

## Debugging Tips

1. **Check Browser Console**: Look for any JavaScript errors
2. **Check Network Tab**: Verify the API call succeeds
3. **Check Supabase Logs**: See if email was queued
4. **Try Different Email**: Some providers block automated emails
5. **Wait Between Tests**: Rate limiting may apply

## Current Code Implementation

The password reset is implemented in `src/pages/ForgotPasswordPage.tsx`:

```typescript
const { error } = await supabase.auth.resetPasswordForEmail(email, {
  redirectTo: `${window.location.origin}/reset-password`,
});
```

This correctly uses Supabase's built-in password reset functionality.
