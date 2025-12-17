# Redirect Loop Fix

## Problem

The app keeps redirecting to `/onboarding/setup` in a loop, preventing users from logging in or out.

## Cause

The ProtectedRoute component was checking organization status even when `skipOrganizationCheck` was true, causing a redirect loop on the onboarding page itself.

## Fix Applied

Updated the ProtectedRoute logic to properly handle the `skipOrganizationCheck` flag and admin status.

## Debug Steps

1. **Open Browser Console** (F12)
2. **Look for logs** starting with "ProtectedRoute Check:"
3. **Check the values:**
   - `skipOrganizationCheck` - should be `true` on onboarding routes
   - `isAdmin` - should be `true` for admin users
   - `hasOrganization` - whether user has an organization
   - `path` - current route

## Expected Behavior

### For Onboarding Route (`/onboarding/setup`):
- `skipOrganizationCheck` = `true`
- Should NOT redirect
- Log: "Skipping organization check (skipOrganizationCheck=true)"

### For Admin Users (any route):
- `isAdmin` = `true`
- Should NOT redirect to onboarding
- Log: "Skipping organization check (user is admin)"

### For Regular Users without Organization:
- `isAdmin` = `false`
- `hasOrganization` = `false`
- Should redirect to `/onboarding/setup`
- Log: "Redirecting to onboarding (no organization)"

## If Still Having Issues

### Clear Browser Cache and Cookies
```
1. Open DevTools (F12)
2. Go to Application tab
3. Clear Storage > Clear site data
4. Refresh page
```

### Check for Multiple Redirects
Look in the console for multiple "ProtectedRoute Check" logs. If you see many in quick succession, there's still a loop.

### Temporary Workaround
If you need to access the app immediately:

1. **For Admins**: Navigate directly to `/admin`
2. **For Users**: Create an organization first using SQL:
   ```sql
   SELECT create_organization_with_owner(
     'My Organization',
     'my-org',
     'your-email@example.com',
     NULL, NULL, 'free'
   );
   ```

## Testing

### Test 1: Admin Login
1. Make user an admin
2. Login
3. Should go to `/admin` (not `/onboarding/setup`)
4. Console should show: "Skipping organization check (user is admin)"

### Test 2: Regular User with Organization
1. User has an organization
2. Login
3. Should go to `/dashboard`
4. No redirect to onboarding

### Test 3: Regular User without Organization
1. User has NO organization
2. Login
3. Should go to `/onboarding/setup`
4. Should STAY on `/onboarding/setup` (no loop)
5. Console should show: "Skipping organization check (skipOrganizationCheck=true)"

### Test 4: Logout
1. Click logout
2. Should go to landing page
3. No redirect loops

## Files Modified

- `src/components/auth/ProtectedRoute.tsx` - Fixed organization check logic

## Remove Debug Logs

Once everything is working, you can remove the `console.log` statements from ProtectedRoute.tsx to clean up the console.
