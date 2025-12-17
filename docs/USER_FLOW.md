# Store Master - Complete User Flow Documentation

## Overview

Store Master is a multi-tenant SaaS inventory management platform with subscription-based billing. This document outlines all user flows from initial visit to daily operations.

---

## 1. 🏠 Initial Visit (Unauthenticated User)

### Landing Page (`/`)
**What happens:**
- User arrives at the public landing page
- Sees product features and benefits
- Has two options: **Login** or **Register**

**Available Actions:**
- Click "Login" tab → Enter credentials → Sign in
- Click "Register" tab → Enter email/password → Create account
- If already logged in → Auto-redirect to `/dashboard`

**Next Steps:**
- New user → Registration flow
- Existing user → Login flow

---

## 2. 🔐 Authentication Flow

### 2A. New User Registration

**Step 1: Sign Up**
- User enters email and password (min 6 characters)
- System creates Supabase auth account
- User receives email verification message
- **Note:** User stays on landing page after signup (needs to verify email)

**Step 2: Email Verification**
- User clicks verification link in email
- Supabase confirms account

**Step 3: First Login**
- User logs in with credentials
- `AuthContext` loads user session
- `OrganizationContext` checks for organization membership
- **Result:** No organization found → Redirect to onboarding

### 2B. Existing User Login

**Step 1: Sign In**
- User enters credentials on landing page or `/login`
- System authenticates via Supabase

**Step 2: Organization Check**
- `OrganizationContext` queries `organization_members` table
- **If organization exists:** Load organization data → Redirect to `/dashboard`
- **If no organization:** Redirect to `/onboarding/setup`

---

## 3. 🚀 Onboarding Flow (New Organizations)

### Step 1: Organization Setup (`/onboarding/setup`)

**What happens:**
- User fills out organization details:
  - Organization name (required)
  - Business email
  - Phone number
  - Address
- System creates:
  - New `organizations` record
  - `organization_members` record (user as owner)
  - Default subscription (Free tier, Trial status)

**Validation:**
- Organization name must be unique
- Slug auto-generated from name
- User becomes organization owner

**Next:** Redirect to `/onboarding/select-plan`

### Step 2: Plan Selection (`/onboarding/select-plan`)

**Available Plans:**
1. **Free** - ₦0/month
   - 2 users, 50 products, 20 invoices/month
   
2. **Basic** - ₦15,000/month
   - 5 users, 500 products, 100 invoices/month
   
3. **Professional** - ₦35,000/month
   - 15 users, 2000 products, 500 invoices/month
   
4. **Enterprise** - ₦75,000/month
   - Unlimited users, products, invoices

**User Actions:**
- Select "Continue with Free" → Skip payment
- Select paid plan → Redirect to Flutterwave payment

**Payment Flow (Paid Plans):**
1. System calls `flutterwaveService.getUpgradePaymentLink()`
2. User redirected to Flutterwave hosted payment page
3. User completes payment
4. Flutterwave redirects to `/subscription/callback?status=successful&tx_ref=...`
5. System verifies payment and activates subscription
6. **⚠️ ISSUE:** Callback redirects to `/subscription` instead of `/onboarding/welcome`
7. User needs to manually navigate to dashboard

**Next:** Should redirect to `/onboarding/welcome` but currently goes to `/subscription`

### Step 3: Welcome (`/onboarding/welcome`)

**What happens:**
- Congratulations message
- Quick start guide
- "Get Started" button

**Next:** Redirect to `/dashboard`

---

## 4. 📊 Main Application (Authenticated Users with Organization)

### Dashboard (`/dashboard`)

**Access Control:**
- ✅ Requires authentication
- ✅ Requires organization membership
- ✅ Checks subscription status

**Features:**
- Overview statistics (sales, inventory, transactions)
- Recent transactions
- Low stock alerts
- Quick actions

**Subscription Guard:**
- If subscription expired → Redirect to `/subscription/expired`
- If subscription expiring soon (< 7 days) → Show warning banner

### Core Features

#### Inventory Management (`/inventory`)
- View all products
- Add/edit/delete products
- Organize by categories
- Track stock levels
- **Limit Check:** Cannot exceed plan's product limit

#### Stock Management (`/stock`)
- View stock levels
- Update stock quantities
- Stock movement history

#### Transactions (`/transactions`)
- Record sales, purchases, expenses
- View transaction history
- Filter by type and date

#### Cash Desk (`/cashdesk`)
- **Permission Required:** `cash_desk_access`
- Point of sale interface
- Process sales
- Manage cash sessions

#### Reports (`/reports`)
- **Permission Required:** `reports_view`
- Sales reports
- Inventory reports
- Financial summaries

#### Manager Overview (`/manager-overview`)
- **Permission Required:** `reports_view`
- Staff performance
- Sales analytics
- Business insights

#### Settings (`/settings`)
- User profile
- Organization settings (owner/admin only)
- Employee management
- Permissions

---

## 5. 👥 Team Collaboration Flow

### Inviting Team Members

**Step 1: Owner/Admin Invites User**
- Navigate to `/team`
- Click "Invite Member"
- Enter email and select role (Admin or Member)
- System creates invitation token
- Email sent to invitee (via Supabase)

**Step 2: Invitee Accepts**
- Invitee clicks link in email
- Redirected to `/invitation/accept?token=...`
- If not registered → Prompted to create account
- If registered → Prompted to log in
- System creates `organization_members` record
- Redirect to `/dashboard`

**Roles:**
- **Owner:** Full control, manage billing, delete organization
- **Admin:** Manage users, settings, all features
- **Member:** Standard access, limited permissions

### Removing Team Members

**Process:**
- Owner/Admin goes to `/team`
- Clicks "Remove" on member
- Confirmation dialog
- System sets `is_active = false` on membership
- Member loses access immediately

---

## 6. 💳 Subscription Management

### Viewing Subscription (`/subscription`)

**Information Displayed:**
- Current plan and status
- Billing cycle dates
- Next payment date
- Usage vs. limits
- Billing history

**Available Actions:**
- Upgrade plan
- Downgrade plan (effective next billing cycle)
- Cancel subscription
- View invoices

### Upgrading Subscription

**Flow:**
1. User clicks "Upgrade" on `/subscription` or `/subscription/plans`
2. Selects new plan
3. System calculates prorated amount
4. Redirects to Flutterwave payment
5. User completes payment
6. Webhook updates subscription
7. New limits applied immediately

### Subscription Expiration

**Grace Period (7 days):**
- Warning banner shown on all pages
- Full access maintained
- Prompts to renew

**After Grace Period:**
- Subscription status → `expired`
- User redirected to `/subscription/expired`
- Read-only access to data
- Cannot create/edit records
- Can view and export data
- Can renew subscription

**Renewal:**
- User clicks "Renew Subscription"
- Redirected to payment
- Upon successful payment → Full access restored

---

## 7. 🔒 Admin Dashboard (Platform Administrators)

### Access (`/admin`)

**Requirements:**
- User must be in `admin_users` table
- Special admin authentication

**Features:**

#### Organizations Management (`/admin/organizations`)
- View all organizations
- Search and filter
- Suspend/activate organizations
- View organization details

#### Organization Details (`/admin/organizations/:id`)
- Organization information
- Member list
- Subscription status
- Usage metrics
- Audit trail

#### Platform Analytics (`/admin/analytics`)
- Total organizations
- Active subscriptions
- Monthly Recurring Revenue (MRR)
- Growth metrics
- Revenue charts

#### Audit Logs (`/admin/audit-logs`)
- All admin actions
- Organization changes
- Subscription events
- Security events
- Filter and search

---

## 8. 🔄 Data Isolation & Security

### Multi-Tenancy

**How it works:**
- Every data record has `organization_id`
- Row-Level Security (RLS) policies enforce isolation
- Users can only access their organization's data
- Queries automatically filtered by organization

**Example:**
```sql
-- User queries products
SELECT * FROM products;

-- RLS policy automatically adds:
WHERE organization_id IN (
  SELECT organization_id FROM organization_members
  WHERE user_id = auth.uid() AND is_active = true
)
```

### Offline-First Architecture

**Features:**
- Data stored in localStorage
- Operations queued when offline
- Auto-sync when online
- Conflict resolution

**Storage Keys:**
- Scoped by organization: `products_${organizationId}`
- Prevents cross-organization data leakage

---

## 9. 🚨 Error & Edge Cases

### No Organization Membership

**Scenario:** User logs in but has no organization
**Action:** Redirect to `/onboarding/setup`

### Subscription Expired

**Scenario:** User's subscription expired
**Action:** Redirect to `/subscription/expired`
**Access:** Read-only mode

### Permission Denied

**Scenario:** User tries to access feature without permission
**Action:** Redirect to `/unauthorized`

### Invalid Invitation Token

**Scenario:** User clicks expired/invalid invitation link
**Action:** Show error message, redirect to login

### Payment Failed

**Scenario:** Flutterwave payment fails
**Action:** Show error, allow retry, maintain previous subscription

---

## 10. 📱 User Roles & Permissions

### Permission Matrix

| Feature | Owner | Admin | Member | Staff |
|---------|-------|-------|--------|-------|
| Dashboard | ✅ | ✅ | ✅ | ✅ |
| Inventory | ✅ | ✅ | ✅ | ✅ |
| Transactions | ✅ | ✅ | ✅ | ✅ |
| Cash Desk | ✅ | ✅ | ✅ | ✅ |
| Reports | ✅ | ✅ | ✅ | ❌ |
| Settings | ✅ | ✅ | ❌ | ❌ |
| Team Management | ✅ | ✅ | ❌ | ❌ |
| Billing | ✅ | ❌ | ❌ | ❌ |
| Delete Org | ✅ | ❌ | ❌ | ❌ |

---

## 11. 🔄 Complete User Journey Examples

### Example 1: New Business Owner

1. Visits `/` (landing page)
2. Clicks "Register" → Creates account
3. Logs in → Redirected to `/onboarding/setup`
4. Creates organization "ABC Store"
5. Selects "Basic" plan (₦15,000/month)
6. Completes Flutterwave payment
7. Sees welcome screen → Clicks "Get Started"
8. Arrives at `/dashboard`
9. Adds products to inventory
10. Invites 2 team members
11. Starts recording sales

### Example 2: Team Member Joining

1. Receives invitation email
2. Clicks link → `/invitation/accept?token=...`
3. Already has account → Logs in
4. System adds to organization
5. Redirected to `/dashboard`
6. Sees organization's data
7. Can access features based on role

### Example 3: Subscription Renewal

1. User receives expiry warning (7 days before)
2. Continues using app with banner warning
3. Subscription expires
4. Redirected to `/subscription/expired`
5. Clicks "Renew Subscription"
6. Completes payment
7. Full access restored immediately

### Example 4: Upgrading Plan

1. User on "Free" plan hits 50 product limit
2. Tries to add 51st product → Shows upgrade prompt
3. Clicks "Upgrade Now"
4. Redirected to `/subscription/plans`
5. Selects "Basic" plan
6. Completes payment
7. Can now add up to 500 products

---

## 12. 🎯 Key Decision Points

### Authentication Check
```
Is user logged in?
├─ No → Show Landing Page (/)
└─ Yes → Check organization membership
```

### Organization Check
```
Does user have organization?
├─ No → Redirect to /onboarding/setup
└─ Yes → Check subscription status
```

### Subscription Check
```
Is subscription active?
├─ No (expired) → Redirect to /subscription/expired
├─ Yes (expiring soon) → Show warning banner
└─ Yes (active) → Allow full access
```

### Permission Check
```
Does user have required permission?
├─ No → Redirect to /unauthorized
└─ Yes → Allow access to feature
```

---

## 13. 📊 Current System Status

### ✅ Implemented Features
- Multi-tenant architecture with RLS
- Organization management
- Subscription billing (Flutterwave)
- Team collaboration
- Role-based permissions
- Offline-first sync
- Admin dashboard
- Performance optimizations
- Security measures

### ⚠️ Pending Setup
- Database migrations need to be run
- Flutterwave API keys need configuration
- Email templates for invitations

### 🔜 Recommended Next Steps
1. Run database migrations (see `run-migrations.md`)
2. Configure Flutterwave keys in `.env.local`
3. Test complete user flow
4. Set up email templates
5. Deploy to production

---

## 14. 🛠️ Technical Architecture

### Context Providers (Nested)
```
QueryClientProvider
└─ AuthProvider (user authentication)
   └─ OrganizationProvider (organization data)
      └─ SyncProvider (offline sync)
         └─ NotificationProvider (toast messages)
            └─ SidebarProvider (UI state)
               └─ ThemeProvider (dark/light mode)
```

### Route Protection Layers
```
1. Public Routes (/, /login, /invitation/accept)
   └─ No protection

2. Protected Routes (all others)
   └─ ProtectedRoute (auth check)
      └─ SubscriptionGuard (subscription check)
         └─ Permission Check (feature-specific)
```

### Data Flow
```
User Action
└─ React Component
   └─ Custom Hook (useProducts, useTransactions, etc.)
      └─ Service Layer (productService, transactionService)
         └─ Supabase Client (with RLS)
            └─ Database (filtered by organization_id)
```

---

## 15. 🐛 Issues Found During Verification

### Issue 1: Payment Callback Doesn't Return to Onboarding

**Problem:**
- During onboarding, after successful payment, user is redirected to `/subscription` page
- Should redirect to `/onboarding/welcome` to complete onboarding flow

**Location:** `src/pages/PaymentCallbackPage.tsx` line 163

**Current Code:**
```typescript
const handleContinue = () => {
  if (status === 'success') {
    navigate('/subscription');  // ❌ Wrong for onboarding
  }
}
```

**Fix Needed:**
```typescript
const handleContinue = () => {
  if (status === 'success') {
    // Check if coming from onboarding
    const isOnboarding = searchParams.get('onboarding') === 'true';
    navigate(isOnboarding ? '/onboarding/welcome' : '/subscription');
  }
}
```

**Impact:** Medium - Breaks onboarding flow for paid plans

---

### Issue 2: SelectPlan Doesn't Pass Onboarding Flag

**Problem:**
- When redirecting to Flutterwave, no flag is passed to indicate this is onboarding
- Payment callback can't distinguish between onboarding and regular upgrade

**Location:** `src/pages/onboarding/SelectPlan.tsx`

**Fix Needed:**
- Add `onboarding=true` parameter to tx_ref or callback URL
- Update payment callback to check this flag

**Impact:** Medium - Related to Issue 1

---

### Issue 3: No Direct Dashboard Route

**Problem:**
- Landing page redirects authenticated users to `/dashboard`
- But there's no route defined for `/dashboard` at root level
- Route only exists inside SubscriptionGuard wrapper

**Location:** `src/App.tsx`

**Current State:**
- `/dashboard` route is inside the nested Routes
- Works but could be clearer

**Impact:** Low - Works but routing structure could be improved

---

## Summary

Store Master provides a complete multi-tenant SaaS experience with:
- **Seamless onboarding** from landing page to first use
- **Flexible subscription** management with multiple tiers
- **Team collaboration** with role-based access
- **Data isolation** ensuring security between organizations
- **Offline capability** for uninterrupted operations
- **Admin tools** for platform management

The user flow is designed to be intuitive, secure, and scalable for businesses of all sizes.
