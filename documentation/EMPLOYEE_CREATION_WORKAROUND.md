# Employee Creation Workaround

## Current Issue
The employee creation feature is failing with a 403 Forbidden error because creating new users requires Supabase service role authentication, which cannot be used from client-side code for security reasons.

## Temporary Workaround

Until we deploy the proper Edge Function solution, here's how to add employees:

### Method 1: Manual User Creation (Recommended)

1. **Ask the employee to sign up normally:**
   - Direct them to your app's signup page
   - They create their account with email/password
   - They will initially have basic user access

2. **Promote them to employee after signup:**
   - Go to your admin panel
   - Find the user by email
   - Use the "Make User Admin" or role assignment features
   - Set their role to 'staff', 'manager', or 'admin'
   - Assign custom permissions as needed

### Method 2: Database Direct Access (For Developers)

If you have direct database access, you can:

1. **Create user in Supabase Auth Dashboard:**
   - Go to Supabase Dashboard > Authentication > Users
   - Click "Add User"
   - Enter email and password
   - Note the user ID

2. **Set role and permissions via SQL:**
   ```sql
   -- Set user role
   INSERT INTO user_roles (user_id, role) 
   VALUES ('user-id-here', 'staff');
   
   -- Set permissions (optional)
   INSERT INTO user_permissions (user_id, permission, granted)
   VALUES 
     ('user-id-here', 'manage_inventory', true),
     ('user-id-here', 'view_reports', true);
   ```

## Proper Solution (To Be Implemented)

The proper solution requires deploying a Supabase Edge Function that:
1. Uses service role authentication
2. Creates users securely on the server side
3. Sets roles and permissions
4. Handles error cases properly

### Files Created for Future Implementation:
- `supabase/functions/create-employee/index.ts` - Edge Function for secure user creation
- `supabase/functions/_shared/cors.ts` - CORS helper
- `supabase/migrations/012_employee_invitations.sql` - Invitation system (alternative approach)

### To Deploy the Edge Function:
1. Install Supabase CLI
2. Run: `supabase functions deploy create-employee`
3. Set environment variables in Supabase Dashboard
4. Update the client code to use the function

## Current Status
- ❌ Direct employee creation (blocked by 403 error)
- ✅ Manual workaround available
- ✅ Edge Function code ready for deployment
- ⏳ Awaiting proper deployment setup

## Next Steps
1. Set up proper deployment environment
2. Deploy the Edge Function
3. Test the secure employee creation
4. Update UI to reflect the new flow