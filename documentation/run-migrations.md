# Database Migration Instructions

Your application is showing 404 errors because the multi-tenant database tables don't exist yet. You need to run the migrations.

## Quick Fix: Run Migrations via Supabase Dashboard

1. **Open Supabase Dashboard**
   - Go to: https://supabase.com/dashboard/project/lynrucsoxywacywkxjgc/sql

2. **Run Migration 1: Multi-Tenancy Foundation**
   - Click "New Query"
   - Copy the entire content from `supabase/migrations/001_multi_tenancy_foundation.sql`
   - Paste into the SQL editor
   - Click "Run" or press Ctrl+Enter
   - Wait for success message

3. **Run Migration 2: Organization Invitations**
   - Click "New Query"
   - Copy the entire content from `supabase/migrations/002_organization_invitations.sql`
   - Paste into the SQL editor
   - Click "Run"
   - Wait for success message

4. **Run Migration 3: Performance Indexes**
   - Click "New Query"
   - Copy the entire content from `supabase/migrations/003_performance_indexes.sql`
   - Paste into the SQL editor
   - Click "Run"
   - Wait for success message

5. **Refresh your application**
   - Go back to http://localhost:8080/
   - Hard refresh (Ctrl+Shift+R or Cmd+Shift+R)
   - The errors should be gone!

## Alternative: Use Supabase CLI (if installed)

If you have Supabase CLI installed:

```bash
# Link your project (first time only)
supabase link --project-ref lynrucsoxywacywkxjgc

# Push all migrations
supabase db push
```

## Verify Migrations

After running migrations, verify in Supabase Dashboard:
1. Go to Table Editor
2. You should see these new tables:
   - `organizations`
   - `organization_members`
   - `subscriptions`
   - `admin_users`
   - `usage_metrics`
   - `audit_logs`
   - `organization_invitations`

## What These Migrations Do

**Migration 1** creates:
- Core multi-tenant tables (organizations, members, subscriptions)
- Row-Level Security (RLS) policies for data isolation
- Helper functions for organization management

**Migration 2** creates:
- Organization invitation system
- Email-based team member invitations

**Migration 3** creates:
- Performance indexes for faster queries
- Optimized database access patterns

## Troubleshooting

If you get errors:
- Make sure you're logged into the correct Supabase project
- Check that you have the correct permissions
- Run migrations in order (001, 002, 003)
- If a migration fails, check the error message and fix any issues before proceeding

## After Migrations

Once migrations are complete:
1. Your app will work properly
2. You can create organizations
3. You can invite team members
4. All multi-tenant features will be active
