# Admin Guide: Setting Up Employee Creation

## Current Status
❌ **Employee creation is currently disabled** due to security limitations.

The error you're seeing (403 Forbidden) occurs because creating new users requires server-side authentication that cannot be safely done from the browser.

## Quick Fix (Recommended)

### For Adding Employees Right Now:

1. **Ask employees to sign up themselves:**
   - Send them your app URL
   - They create accounts normally
   - You'll promote them afterward

2. **Promote users to employees:**
   - Go to Settings → Team Members
   - Find the user by email
   - Change their role to Staff/Manager/Admin
   - Set their permissions

## Permanent Solution (For Developers)

To enable direct employee creation, you need to deploy a secure server-side function:

### Step 1: Install Supabase CLI
```bash
# Install via npm (if supported)
npm install -g supabase

# Or download from: https://github.com/supabase/cli/releases
```

### Step 2: Deploy the Edge Function
```bash
# Navigate to your project
cd your-project-directory

# Deploy the employee creation function
supabase functions deploy create-employee

# Set required environment variables
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### Step 3: Verify Deployment
- Check Supabase Dashboard → Edge Functions
- Test the function with a sample request
- Update your app to use the new endpoint

## Files Already Prepared

The following files are ready for deployment:
- ✅ `supabase/functions/create-employee/index.ts` - Main function
- ✅ `supabase/functions/_shared/cors.ts` - CORS helper
- ✅ Updated client-side code to use the function

## Security Notes

- ✅ Function validates user permissions
- ✅ Uses service role key securely
- ✅ Includes proper error handling
- ✅ Follows security best practices

## Alternative: Invitation System

If you prefer an invitation-based approach:
- ✅ Migration file ready: `012_employee_invitations.sql`
- ✅ Sends email invitations instead of creating accounts
- ✅ Users sign up via invitation links
- ✅ More secure and user-friendly

## Need Help?

Contact your development team with this guide. All the code is ready - it just needs proper deployment with the right permissions.

## Current Workaround Works Fine

The manual process (users sign up → you promote them) is actually more secure and is used by many professional applications. You can continue using this approach indefinitely if preferred.