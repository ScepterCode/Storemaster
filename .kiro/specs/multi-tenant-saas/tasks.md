# Implementation Plan

- [x] 1. Database foundation (COMPLETED)
  - [x] 1.1 Run multi-tenancy migration
    - Execute `supabase/migrations/001_multi_tenancy_foundation.sql`
    - Create organizations, admin_users, organization_members, subscriptions tables
    - Add organization_id to existing tables
    - Set up Row-Level Security policies
    - _Requirements: 1.1, 2.1, 5.1, 5.3_

- [x] 2. Core types and services (COMPLETED)
  - [x] 2.1 Create admin types
    - Implement `src/types/admin.ts` with all multi-tenant types
    - Define Organization, Subscription, AdminUser, OrganizationMember interfaces
    - _Requirements: 1.1, 2.1, 3.1, 5.1_
  
  - [x] 2.2 Implement admin service
    - Create `src/services/adminService.ts`
    - Implement organization CRUD operations
    - Implement member management
    - Implement subscription management
    - Implement analytics and audit logging
    - _Requirements: 1.1, 1.2, 1.3, 2.2, 2.3, 7.1, 8.1, 8.2_
  
  - [x] 2.3 Implement Flutterwave service
    - Create `src/services/flutterwaveService.ts`
    - Implement payment initialization
    - Implement payment verification
    - Implement subscription operations
    - Implement webhook handlers
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 10.1, 10.2, 10.3, 10.4_
  
  - [x] 2.4 Create subscription plans configuration
    - Create `src/config/subscriptionPlans.ts`
    - Define Free, Basic, Pro, Enterprise plans
    - Implement helper functions for plan management
    - _Requirements: 3.1, 9.1_

- [x] 3. Context providers and hooks (COMPLETED)
  - [x] 3.1 Create organization context
    - Implement `src/contexts/OrganizationContext.tsx`
    - Load user's organization on authentication
    - Provide organization data throughout app
    - Implement role-based permission checks
    - _Requirements: 2.1, 2.2, 2.4, 5.1, 6.1, 6.2, 6.3_
  
  - [x] 3.2 Create admin authentication hook
    - Implement `src/hooks/useAdminAuth.ts`
    - Check admin status and permissions
    - Update last login time
    - _Requirements: 1.1, 1.5, 8.1_

- [x] 4. Update existing services for multi-tenancy




  - [x] 4.1 Update product service


    - Modify `src/services/productService.ts` to include organization_id
    - Update all API calls to filter by organization
    - Update local storage to scope by organization
    - Ensure RLS policies are respected
    - _Requirements: 5.1, 5.2, 5.4_


  
  - [ ] 4.2 Update category service
    - Modify `src/services/categoryService.ts` to include organization_id
    - Update all API calls to filter by organization


    - Update local storage to scope by organization
    - _Requirements: 5.1, 5.2, 5.4_
  
  - [x] 4.3 Update customer service


    - Modify `src/services/customerService.ts` to include organization_id
    - Update all API calls to filter by organization
    - Update local storage to scope by organization
    - _Requirements: 5.1, 5.2, 5.4_

  - [x] 4.4 Update invoice service


    - Modify `src/services/invoiceService.ts` to include organization_id
    - Update all API calls to filter by organization
    - Update local storage to scope by organization
    - _Requirements: 5.1, 5.2, 5.4_
  
  - [x] 4.5 Update transaction service


    - Modify `src/services/transactionService.ts` to include organization_id
    - Update all API calls to filter by organization
    - Update local storage to scope by organization
    - _Requirements: 5.1, 5.2, 5.4_

- [x] 5. Update sync coordinator for multi-tenancy



  - [x] 5.1 Modify sync coordinator


    - Update `src/services/syncCoordinator.ts` to respect organization context
    - Ensure sync operations include organization_id
    - Update sync queue to be organization-scoped
    - _Requirements: 5.1, 5.2, 6.1_

- [-] 6. Admin dashboard UI

  - [x] 6.1 Create admin dashboard layout


    - Create `src/pages/admin/AdminDashboard.tsx`
    - Implement navigation for admin sections
    - Add admin route protection
    - _Requirements: 1.1, 1.2_
  
  - [x] 6.2 Create organization management UI


    - Create `src/pages/admin/OrganizationsPage.tsx`
    - Display organization list with filters
    - Implement organization creation form
    - Implement organization edit form
    - Add suspend/activate actions
    - _Requirements: 1.1, 1.2, 1.3, 1.4_
  
  - [x] 6.3 Create organization details page

    - Create `src/pages/admin/OrganizationDetailsPage.tsx`
    - Display organization information
    - Show subscription status
    - Display usage metrics
    - Show member list
    - _Requirements: 1.2, 2.2, 7.1, 7.3_
  
  - [x] 6.4 Create platform analytics dashboard
    - Create `src/pages/admin/AnalyticsPage.tsx`
    - Display platform statistics (MRR, users, organizations)
    - Show revenue charts
    - Display growth metrics
    - _Requirements: 7.1, 7.2, 7.3_
  
  - [x] 6.5 Create audit log viewer


    - Create `src/pages/admin/AuditLogsPage.tsx`
    - Display audit logs with filters
    - Implement search functionality
    - Show action details
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

- [x] 7. User-facing subscription UI





  - [x] 7.1 Create subscription plans page


    - Create `src/pages/SubscriptionPlansPage.tsx`
    - Display available plans with features
    - Highlight current plan
    - Implement plan selection
    - _Requirements: 3.1, 9.1_
  
  - [x] 7.2 Create subscription management page


    - Create `src/pages/SubscriptionPage.tsx`
    - Display current subscription details
    - Show billing history
    - Implement upgrade/downgrade actions
    - Add cancel subscription option
    - _Requirements: 3.1, 3.5, 4.1, 4.2, 4.3, 9.1, 9.2, 9.3, 9.4, 9.5_
  
  - [x] 7.3 Create payment callback page


    - Create `src/pages/PaymentCallbackPage.tsx`
    - Handle Flutterwave redirect
    - Verify payment status
    - Update subscription status
    - Show success/failure message
    - _Requirements: 3.2, 3.3, 3.4_
  
  - [x] 7.4 Create subscription expired page


    - Create `src/pages/SubscriptionExpiredPage.tsx`
    - Show expiration message
    - Display renewal options
    - Provide grace period information
    - _Requirements: 4.2, 4.3, 4.4_

- [x] 8. Organization onboarding flow






  - [x] 8.1 Create organization setup wizard

    - Create `src/pages/onboarding/OrganizationSetup.tsx`
    - Implement multi-step form
    - Collect organization details
    - Create organization in database
    - _Requirements: 1.1, 2.1_
  

  - [x] 8.2 Create subscription selection step

    - Create `src/pages/onboarding/SelectPlan.tsx`
    - Display plan options
    - Handle plan selection
    - Redirect to payment
    - _Requirements: 3.1, 3.2_
  
  - [x] 8.3 Create welcome page


    - Create `src/pages/onboarding/Welcome.tsx`
    - Show onboarding completion
    - Provide quick start guide
    - Redirect to main app
    - _Requirements: 1.1, 3.4_

- [x] 9. Team management UI




  - [x] 9.1 Create team members page


    - Create `src/pages/TeamMembersPage.tsx`
    - Display organization members
    - Show member roles
    - Implement member invitation
    - Add remove member action
    - _Requirements: 2.1, 2.2, 2.3, 2.4_
  
  - [x] 9.2 Create invitation system


    - Create `src/services/invitationService.ts`
    - Generate invitation tokens
    - Send invitation emails (via Supabase)
    - Handle invitation acceptance
    - _Requirements: 2.1, 2.2_
  
  - [x] 9.3 Create invitation acceptance page
    - Create `src/pages/AcceptInvitationPage.tsx`
    - Validate invitation token
    - Create organization membership
    - Redirect to app
    - _Requirements: 2.2, 2.4_

- [x] 10. Limit enforcement




  - [x] 10.1 Create limit checking utility


    - Create `src/lib/limitChecker.ts`
    - Implement functions to check current usage
    - Compare against plan limits
    - Return limit status
    - _Requirements: 5.4, 9.1_
  
  - [x] 10.2 Add limit checks to operations
    - Update product creation to check product limit
    - Update user invitation to check user limit
    - Update invoice creation to check invoice limit
    - Show upgrade prompt when limit reached
    - _Requirements: 5.4, 9.1_
  
  - [x] 10.3 Create upgrade prompt component


    - Create `src/components/UpgradePrompt.tsx`
    - Display when limit is reached
    - Show current plan and limits
    - Provide upgrade button
    - _Requirements: 9.1, 9.2_

- [x] 11. Data migration for existing users




  - [x] 11.1 Create migration script


    - Create `src/lib/multiTenantMigration.ts`
    - Create default organization for existing users
    - Assign all existing data to default organization
    - Create organization memberships
    - _Requirements: 5.1, 5.2_
  
  - [x] 11.2 Add migration trigger


    - Update `src/App.tsx` to check for migration
    - Run migration on first load for existing users
    - Mark migration as complete
    - _Requirements: 5.1_

- [x] 12. Webhook endpoint

  - [x] 12.1 Create Supabase Edge Function for webhooks
    - Create `supabase/functions/flutterwave-webhook/index.ts`
    - Validate webhook signature
    - Handle payment events
    - Update subscription status
    - _Requirements: 3.3, 3.4, 10.3, 10.4, 10.5_

- [x] 13. Update App.tsx for multi-tenancy




  - [x] 13.1 Integrate organization context


    - Wrap app with OrganizationProvider
    - Add organization loading state
    - Handle no organization case
    - Redirect to onboarding if needed
    - _Requirements: 6.1, 6.2, 6.3, 6.4_
  
  - [x] 13.2 Add subscription status checks


    - Check subscription status on app load
    - Redirect to expired page if subscription expired
    - Show grace period warnings
    - _Requirements: 4.2, 4.3_

- [-] 14. Testing
  - [x] 14.1 Add unit tests for admin service

    - Test organization CRUD operations

    - Test member management
    - Test subscription operations
    - Test analytics calculations
    - _Requirements: 1.1, 2.1, 3.1, 7.1_
  
  - [x] 14.2 Add unit tests for Flutterwave service


    - Test payment initialization
    - Test payment verification
    - Test webhook handling
    - _Requirements: 3.1, 3.3, 10.1_
  
  - [x] 14.3 Add integration tests for multi-tenancy


    - Test data isolation between organizations
    - Test RLS policies
    - Test organization switching
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_
  
  - [x] 14.4 Add integration tests for subscription flow



    - Test subscription creation
    - Test payment processing
    - Test subscription renewal
    - Test subscription cancellation
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 4.1, 4.2_

- [x] 15. Documentation








  - [x] 15.1 Update developer guide

    - Document multi-tenant architecture
    - Explain organization context usage
    - Document RLS policies
    - Provide examples for adding new features
    - _Requirements: 5.1, 6.1_
  



  - [x] 15.2 Create admin user guide







  - [x] 15.2 Create admin user guide

    - Document admin dashboard features
    - Explain organization management
    - Document subscription management
    - Provide troubleshooting guide
    - _Requirements: 1.1, 1.2, 7.1, 8.1_
  
  - [x] 15.3 Create end-user guide


    - Document subscription plans
    - Explain team management
    - Document billing and payments
    - Provide FAQ
    - _Requirements: 2.1, 3.1, 9.1_

- [x] 16. Final checkpoint


  - [x] 16.1 End-to-end testing

    - Test complete onboarding flow
    - Test subscription purchase
    - Test team collaboration
    - Test data isolation
    - Test subscription renewal
    - _Requirements: All_
  

  - [x] 16.2 Performance optimization

    - Optimize database queries
    - Add caching where appropriate
    - Test with large datasets
    - _Requirements: 5.1, 7.1_
  

  - [x] 16.3 Security audit

    - Review RLS policies
    - Test data isolation
    - Verify webhook security
    - Check for SQL injection vulnerabilities
    - _Requirements: 5.1, 5.3, 5.5, 10.3_
