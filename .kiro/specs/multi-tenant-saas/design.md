# Design Document

## Overview

This design transforms Store Master from a single-tenant inventory management application into a multi-tenant SaaS platform. The architecture supports multiple organizations with isolated data, subscription-based billing through Flutterwave, and comprehensive admin controls. The system maintains the existing offline-first architecture while adding organization context to all operations.

## Architecture

### High-Level Multi-Tenant Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Admin Dashboard                           │
│  - Organization Management                                   │
│  - User Management                                           │
│  - Subscription Management                                   │
│  - Analytics & Reporting                                     │
└───────────────────────────┬─────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────┐
│                  Organization Context Layer                  │
│  - Organization Selection                                    │
│  - Data Isolation Enforcement                                │
│  - Permission Checking                                       │
└───────────────────────────┬─────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────┐
│              Existing Application Layer                      │
│  - Inventory Management                                      │
│  - Point of Sale                                             │
│  - Customer Management                                       │
│  - Invoicing                                                 │
└─────────────┬───────────────────────────┬───────────────────┘
              │                           │
┌─────────────▼──────────┐   ┌───────────▼──────────────────┐
│   Supabase + RLS       │   │   Flutterwave Payment API    │
│   - Multi-tenant DB    │   │   - Subscription Billing     │
│   - Row-Level Security │   │   - Payment Processing       │
└────────────────────────┘   └──────────────────────────────┘
```

### Data Isolation Strategy

**Row-Level Security (RLS)**:
- All data tables include `organization_id` foreign key
- RLS policies filter queries automatically by organization
- Users can only access data from organizations they belong to
- Admins have special policies to access all data

**Organization Context**:
- React Context provides current organization throughout app
- All API calls include organization context
- Local storage keys are scoped by organization
- Sync operations respect organization boundaries

## Components and Interfaces

### 1. Database Schema

**Core Multi-Tenancy Tables**:

```sql
-- Organizations (Tenants)
organizations (
  id UUID PRIMARY KEY,
  name TEXT,
  slug TEXT UNIQUE,
  subscription_tier TEXT,
  subscription_status TEXT,
  max_users INTEGER,
  max_products INTEGER,
  is_active BOOLEAN,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)

-- Admin Users
admin_users (
  id UUID PRIMARY KEY REFERENCES auth.users,
  is_super_admin BOOLEAN,
  permissions JSONB,
  last_login_at TIMESTAMP
)

-- Organization Members
organization_members (
  id UUID PRIMARY KEY,
  organization_id UUID REFERENCES organizations,
  user_id UUID REFERENCES auth.users,
  role TEXT, -- 'owner', 'admin', 'member'
  is_active BOOLEAN,
  joined_at TIMESTAMP
)

-- Subscriptions
subscriptions (
  id UUID PRIMARY KEY,
  organization_id UUID REFERENCES organizations,
  plan_id TEXT,
  amount DECIMAL,
  status TEXT,
  flutterwave_subscription_id TEXT,
  current_period_start TIMESTAMP,
  current_period_end TIMESTAMP
)

-- Usage Metrics
usage_metrics (
  id UUID PRIMARY KEY,
  organization_id UUID REFERENCES organizations,
  metric_type TEXT,
  metric_value INTEGER,
  period_start TIMESTAMP,
  period_end TIMESTAMP
)

-- Audit Logs
audit_logs (
  id UUID PRIMARY KEY,
  admin_user_id UUID,
  action TEXT,
  target_type TEXT,
  target_id UUID,
  organization_id UUID,
  details JSONB,
  created_at TIMESTAMP
)
```

**Enhanced Existing Tables**:
```sql
-- Add organization_id to all existing tables
ALTER TABLE products ADD COLUMN organization_id UUID REFERENCES organizations;
ALTER TABLE categories ADD COLUMN organization_id UUID REFERENCES organizations;
ALTER TABLE customers ADD COLUMN organization_id UUID REFERENCES organizations;
ALTER TABLE invoices ADD COLUMN organization_id UUID REFERENCES organizations;
ALTER TABLE transactions ADD COLUMN organization_id UUID REFERENCES organizations;
```

### 2. Organization Context Provider

**Purpose**: Provide organization data throughout the application

**Location**: `src/contexts/OrganizationContext.tsx`

**Interface**:
```typescript
interface OrganizationContextType {
  organization: Organization | null;
  membership: OrganizationMember | null;
  loading: boolean;
  error: Error | null;
  refreshOrganization: () => Promise<void>;
  isOwner: boolean;
  isAdmin: boolean;
  canManageUsers: boolean;
}
```

**Responsibilities**:
- Load user's organization on authentication
- Provide organization data to all components
- Handle organization switching (for multi-org users)
- Validate organization membership
- Provide role-based permission checks

### 3. Admin Service

**Purpose**: Manage organizations, users, and platform operations

**Location**: `src/services/adminService.ts`

**Key Methods**:
```typescript
interface AdminService {
  // Organizations
  getAllOrganizations(): Promise<Organization[]>;
  getOrganization(id: string): Promise<Organization>;
  createOrganization(org: Partial<Organization>): Promise<Organization>;
  updateOrganization(id: string, updates: Partial<Organization>): Promise<Organization>;
  suspendOrganization(id: string): Promise<void>;
  activateOrganization(id: string): Promise<void>;
  
  // Members
  getOrganizationMembers(orgId: string): Promise<OrganizationMember[]>;
  addOrganizationMember(orgId: string, userId: string, role: string): Promise<OrganizationMember>;
  removeOrganizationMember(memberId: string): Promise<void>;
  
  // Subscriptions
  getOrganizationSubscription(orgId: string): Promise<Subscription | null>;
  createSubscription(sub: Partial<Subscription>): Promise<Subscription>;
  updateSubscription(id: string, updates: Partial<Subscription>): Promise<Subscription>;
  cancelSubscription(id: string): Promise<void>;
  
  // Analytics
  getPlatformStats(): Promise<PlatformStats>;
  getOrganizationStats(orgId: string): Promise<OrganizationStats>;
  
  // Audit
  logAuditAction(action: string, targetType?: string, targetId?: string, details?: any): Promise<void>;
  getAuditLogs(filters?: AuditFilters): Promise<AuditLog[]>;
}
```

### 4. Flutterwave Service

**Purpose**: Handle payment processing and subscription billing

**Location**: `src/services/flutterwaveService.ts`

**Key Methods**:
```typescript
interface FlutterwaveService {
  // Payments
  initializePayment(data: FlutterwavePaymentData): Promise<PaymentInitResponse>;
  verifyPayment(transactionId: string): Promise<VerificationResult>;
  
  // Subscriptions
  subscribeCustomer(email: string, planId: string, orgId: string): Promise<PaymentInitResponse>;
  cancelSubscription(subscriptionId: string): Promise<CancelResult>;
  getUpgradePaymentLink(orgId: string, planId: string, amount: number, email: string, planName: string): Promise<string | null>;
  
  // Webhooks
  handleWebhook(payload: FlutterwaveWebhookPayload): Promise<void>;
  handleSuccessfulPayment(data: any): Promise<void>;
  handleSubscriptionCancelled(data: any): Promise<void>;
  handleSubscriptionExpired(data: any): Promise<void>;
}
```

**Security Considerations**:
- API keys stored in environment variables
- Webhook signature validation (backend only)
- HTTPS for all API communications
- Transaction logging for audit trail

### 5. Admin Authentication Hook

**Purpose**: Check admin status and permissions

**Location**: `src/hooks/useAdminAuth.ts`

**Interface**:
```typescript
interface AdminAuthHook {
  isAdmin: boolean;
  isSuperAdmin: boolean;
  adminData: AdminUser | null;
  loading: boolean;
  error: Error | null;
  hasPermission(permission: string): boolean;
}
```

### 6. Subscription Plans Configuration

**Purpose**: Define available subscription tiers

**Location**: `src/config/subscriptionPlans.ts`

**Plans**:
- **Free**: 2 users, 50 products, 20 invoices/month, ₦0
- **Basic**: 5 users, 500 products, 100 invoices/month, ₦15,000/month
- **Professional**: 15 users, 2000 products, 500 invoices/month, ₦35,000/month
- **Enterprise**: Unlimited users/products, ₦75,000/month

**Helper Functions**:
```typescript
getPlanById(planId: string): SubscriptionPlan | undefined;
getPlanByTier(tier: string): SubscriptionPlan | undefined;
calculateYearlySavings(plan: SubscriptionPlan): number;
formatPrice(amount: number): string;
checkLimits(plan: SubscriptionPlan, current: UsageData): LimitStatus;
```

## Data Models

### Organization Model

```typescript
interface Organization {
  id: string;
  name: string;
  slug: string;
  email?: string;
  phone?: string;
  address?: string;
  
  // Subscription
  subscription_tier: 'free' | 'basic' | 'pro' | 'enterprise';
  subscription_status: 'trial' | 'active' | 'suspended' | 'cancelled' | 'expired';
  trial_ends_at?: string;
  subscription_starts_at?: string;
  subscription_ends_at?: string;
  
  // Limits
  max_users: number;
  max_products: number;
  max_invoices_per_month: number;
  max_storage_mb: number;
  
  // Status
  is_active: boolean;
  
  // Metadata
  settings?: Record<string, any>;
  metadata?: Record<string, any>;
  
  // Timestamps
  created_at: string;
  updated_at: string;
  deleted_at?: string;
}
```

### Subscription Model

```typescript
interface Subscription {
  id: string;
  organization_id: string;
  
  // Plan details
  plan_id: string;
  plan_name: string;
  amount: number;
  currency: string;
  interval: 'monthly' | 'yearly';
  
  // Status
  status: 'pending' | 'active' | 'cancelled' | 'expired' | 'failed';
  
  // Billing periods
  current_period_start?: string;
  current_period_end?: string;
  cancel_at_period_end: boolean;
  cancelled_at?: string;
  
  // Flutterwave details
  flutterwave_subscription_id?: string;
  flutterwave_customer_id?: string;
  flutterwave_plan_id?: string;
  
  // Payment tracking
  next_payment_date?: string;
  last_payment_date?: string;
  failed_payment_count: number;
  
  // Metadata
  metadata?: Record<string, any>;
  
  // Timestamps
  created_at: string;
  updated_at: string;
}
```

## Error Handling

### Multi-Tenant Error Scenarios

**No Organization Membership**:
- User logs in but has no organization
- Show onboarding flow to create/join organization
- Prevent access to main application

**Subscription Expired**:
- Detect expired subscription on app load
- Show payment prompt with grace period
- Restrict access to paid features
- Maintain read-only access to data

**Limit Exceeded**:
- Check limits before operations (create user, product, etc.)
- Show upgrade prompt when limit reached
- Provide clear messaging about current usage

**Payment Failed**:
- Handle failed Flutterwave payments gracefully
- Retry logic for temporary failures
- Notify organization owner
- Provide grace period before suspension

**Data Isolation Breach**:
- RLS policies prevent unauthorized access at database level
- Application-level checks as additional security
- Log suspicious access attempts
- Alert admins of potential security issues

## Testing Strategy

### Unit Tests

**Admin Service Tests**:
- Mock Supabase client
- Test organization CRUD operations
- Test member management
- Test subscription operations
- Test analytics calculations
- Verify audit logging

**Flutterwave Service Tests**:
- Mock Flutterwave API
- Test payment initialization
- Test payment verification
- Test webhook handling
- Test subscription operations
- Verify error handling

**Organization Context Tests**:
- Mock authentication
- Test organization loading
- Test role-based permissions
- Test organization switching
- Verify error states

### Integration Tests

**Multi-Tenant Data Isolation**:
- Create multiple organizations
- Create users in each organization
- Verify users can only access their organization's data
- Test RLS policies
- Verify admin access to all data

**Subscription Flow**:
- Create organization
- Select subscription plan
- Process payment (mock Flutterwave)
- Verify subscription activation
- Test subscription renewal
- Test subscription cancellation

**Limit Enforcement**:
- Create organization with specific plan
- Attempt to exceed limits
- Verify operations are blocked
- Test upgrade flow
- Verify new limits apply

### End-to-End Tests

**Organization Onboarding**:
- User signs up
- Creates organization
- Selects subscription plan
- Completes payment
- Accesses application

**Team Collaboration**:
- Owner invites team members
- Members accept invitations
- Members access organization data
- Owner manages permissions
- Owner removes member

**Subscription Management**:
- View current subscription
- Upgrade to higher tier
- Process upgrade payment
- Verify new features available
- Downgrade at period end

## Implementation Phases

### Phase 1: Foundation (COMPLETED)

✅ Database schema with multi-tenancy tables
✅ Row-Level Security policies
✅ Admin user types and interfaces
✅ Organization context provider
✅ Admin service implementation
✅ Flutterwave service implementation
✅ Subscription plans configuration
✅ Admin authentication hook

### Phase 2: Service Layer Integration (IN PROGRESS)

- Update existing services to include organization_id
- Modify product service to filter by organization
- Modify category service to filter by organization
- Modify customer service to filter by organization
- Modify invoice service to filter by organization
- Modify transaction service to filter by organization
- Update sync coordinator for multi-tenant sync

### Phase 3: UI Components

- Admin dashboard layout
- Organization management UI
- User management UI
- Subscription management UI
- Payment flow UI
- Usage metrics dashboard
- Audit log viewer
- Organization settings page
- Team invitation flow
- Subscription upgrade/downgrade UI

### Phase 4: Onboarding Flow

- New user registration
- Organization creation wizard
- Subscription plan selection
- Payment processing
- Team invitation system
- Welcome tour

### Phase 5: Admin Features

- Platform analytics dashboard
- Organization search and filter
- Bulk operations
- Support ticket system
- Billing management
- Usage reports
- Churn analysis

### Phase 6: Testing & Deployment

- Comprehensive testing
- Performance optimization
- Security audit
- Documentation
- Deployment to production
- Monitoring setup

## Migration Strategy

### Existing Data Migration

**Challenge**: Existing single-tenant data needs organization assignment

**Solution**:
1. Create default organization for existing users
2. Assign all existing data to default organization
3. Create organization membership for existing users
4. Set default organization to free tier
5. Prompt users to upgrade

**Migration Script**:
```sql
-- Create default organization
INSERT INTO organizations (name, slug, subscription_tier, subscription_status)
VALUES ('Default Organization', 'default', 'free', 'active')
RETURNING id;

-- Assign existing data to default organization
UPDATE products SET organization_id = '<default_org_id>';
UPDATE categories SET organization_id = '<default_org_id>';
UPDATE customers SET organization_id = '<default_org_id>';
UPDATE invoices SET organization_id = '<default_org_id>';
UPDATE transactions SET organization_id = '<default_org_id>';

-- Create memberships for existing users
INSERT INTO organization_members (organization_id, user_id, role)
SELECT '<default_org_id>', id, 'owner'
FROM auth.users;
```

### Rollout Plan

1. **Phase 1**: Deploy database changes with backward compatibility
2. **Phase 2**: Deploy backend services (no UI changes yet)
3. **Phase 3**: Enable organization context (transparent to users)
4. **Phase 4**: Deploy admin dashboard (admin-only access)
5. **Phase 5**: Enable subscription features
6. **Phase 6**: Migrate existing users to organizations
7. **Phase 7**: Full multi-tenant mode

## Performance Considerations

### Database Optimization

**Indexes**:
- `organization_id` indexed on all data tables
- Composite indexes for common queries
- Index on subscription status for billing queries

**Query Optimization**:
- RLS policies use indexed columns
- Avoid N+1 queries with proper joins
- Use materialized views for analytics

**Caching**:
- Cache organization data in React Context
- Cache subscription status
- Cache usage metrics (refresh periodically)

### Scalability

**Horizontal Scaling**:
- Supabase handles database scaling
- Stateless application servers
- CDN for static assets

**Data Partitioning**:
- Consider table partitioning by organization for large datasets
- Archive old data periodically
- Implement data retention policies

## Security Considerations

### Authentication & Authorization

**Multi-Level Security**:
1. **Database Level**: RLS policies enforce data isolation
2. **Application Level**: Organization context validation
3. **API Level**: Authentication required for all endpoints

**Admin Access**:
- Separate admin authentication
- Audit all admin actions
- Require MFA for super admins
- Time-limited admin sessions

### Payment Security

**Flutterwave Integration**:
- Never store payment card details
- Use Flutterwave hosted payment pages
- Verify webhook signatures
- Log all payment transactions
- Implement fraud detection

**PCI Compliance**:
- No card data touches our servers
- Flutterwave handles PCI compliance
- Secure transmission of payment data

### Data Protection

**Encryption**:
- HTTPS for all communications
- Encrypted database connections
- Encrypt sensitive fields at rest

**Privacy**:
- GDPR compliance considerations
- Data export functionality
- Data deletion on request
- Privacy policy updates

## Monitoring and Debugging

### Logging Strategy

**Application Logs**:
- Organization context in all logs
- User actions with organization ID
- Error logs with full context
- Performance metrics

**Audit Logs**:
- All admin actions
- Subscription changes
- Payment events
- Security events

### Metrics to Track

**Business Metrics**:
- Monthly Recurring Revenue (MRR)
- Customer Acquisition Cost (CAC)
- Churn rate
- Average Revenue Per User (ARPU)
- Conversion rate (trial to paid)

**Technical Metrics**:
- API response times
- Database query performance
- Error rates by organization
- Sync success rates
- Storage usage per organization

**User Metrics**:
- Active users per organization
- Feature usage
- Session duration
- User retention

### Alerting

**Critical Alerts**:
- Payment processing failures
- Database connection issues
- RLS policy violations
- Subscription expiration (grace period)

**Warning Alerts**:
- High error rates
- Slow query performance
- Approaching usage limits
- Failed payment retries

## Future Enhancements

### Phase 7+: Advanced Features

**Multi-Location Support**:
- Organizations can have multiple locations
- Location-specific inventory
- Location-based reporting
- Inter-location transfers

**Advanced Analytics**:
- Custom reports
- Data export
- API access for integrations
- Webhook notifications

**White-Label Solution**:
- Custom branding per organization
- Custom domain support
- Branded mobile apps
- Custom email templates

**Marketplace**:
- Third-party integrations
- Plugin system
- App marketplace
- Revenue sharing

**AI Features**:
- Demand forecasting
- Inventory optimization
- Pricing recommendations
- Fraud detection

