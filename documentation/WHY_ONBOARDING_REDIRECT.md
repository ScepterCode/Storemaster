# Why You're Being Redirected to Onboarding

## The Issue

After login, you're automatically redirected to `/onboarding/setup` instead of the dashboard.

## Why This Happens

This is a **multi-tenant SaaS application**. Every user must belong to an organization. When you login:

1. System checks: "Does this user have an organization?"
2. If NO → Redirect to `/onboarding/setup` to create one
3. If YES → Go to `/dashboard`

## The Solution

You need to create an organization for your user account.

### Quick Fix (30 seconds)

1. Open `setup-admin-complete.sql`
2. Replace `'scepterboss@gmail.com'` with your email (6 places)
3. Run it in Supabase SQL Editor
4. Login again

### What This Does

The script:
- ✅ Makes you a super admin
- ✅ Creates an organization for you
- ✅ Makes you the owner of that organization

### After Running the Script

1. Login at http://localhost:5173
2. You'll go to `/dashboard` (your organization)
3. Navigate to `/admin` (system admin panel)

## Understanding the System

### Multi-Tenant Architecture

```
User Account (auth.users)
    ↓
Organization Membership (organization_members)
    ↓
Organization (organizations)
```

Every user MUST have:
1. A user account
2. An organization membership
3. An organization

### Admin vs Organization Owner

| Role | Access |
|------|--------|
| **Organization Owner** | Manage their own organization |
| **System Admin** | Manage ALL organizations |
| **Super Admin** | System admin + manage other admins |

You can be BOTH an organization owner AND a system admin!

## Files to Use

1. **`setup-admin-complete.sql`** - Does everything in one go
2. **`create-admin-organization.sql`** - Just creates the organization
3. **`COMPLETE_ADMIN_SETUP.md`** - Detailed guide

## Quick Commands

### Check if you have an organization:
```sql
SELECT o.name, om.role
FROM organizations o
JOIN organization_members om ON o.id = om.organization_id
JOIN auth.users u ON om.user_id = u.id
WHERE u.email = 'your-email@example.com';
```

### Create organization:
```sql
SELECT create_organization_with_owner(
  'My Organization',
  'my-org',
  'your-email@example.com',
  NULL,
  NULL,
  'enterprise'
);
```

## Summary

The redirect to onboarding is **expected behavior** for users without an organization. Simply create an organization for your admin user and you'll be able to access both the dashboard and admin panel.
