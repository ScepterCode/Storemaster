# Admin User Guide

## Overview

This guide is for platform administrators who manage organizations, subscriptions, and monitor the Store Master SaaS platform. As an admin, you have access to the admin dashboard where you can oversee all organizations, manage subscriptions, view analytics, and audit system activities.

## Table of Contents

1. [Accessing the Admin Dashboard](#accessing-the-admin-dashboard)
2. [Organization Management](#organization-management)
3. [Subscription Management](#subscription-management)
4. [Platform Analytics](#platform-analytics)
5. [Audit Logs](#audit-logs)
6. [Troubleshooting](#troubleshooting)

---

## Accessing the Admin Dashboard

### Prerequisites

- You must have an admin account with appropriate permissions
- Admin accounts are created separately from regular user accounts
- Your account must be marked as an admin in the `admin_users` table

### Login Process

1. Navigate to the admin dashboard URL: `/admin`
2. Sign in with your admin credentials
3. The system will verify your admin status
4. Upon successful authentication, you'll be redirected to the admin overview page

### Admin Permissions

There are two levels of admin access:

- **Super Admin**: Full access to all features, including managing other admins
- **Admin**: Access to organization and subscription management, limited system settings

---

## Organization Management

### Viewing Organizations

The Organizations page displays all registered organizations on the platform.

**To access:**
1. Navigate to **Admin Dashboard** → **Organizations**
2. View the list of all organizations with key information:
   - Organization name and slug
   - Subscription tier and status
   - Number of members
   - Creation date
   - Active/Inactive status

**Filtering and Search:**
- Use the search bar to find organizations by name or slug
- Filter by subscription status: Active, Expired, Suspended, Cancelled
- Filter by subscription tier: Free, Basic, Professional, Enterprise
- Sort by creation date, member count, or subscription status

### Creating a New Organization

**Steps:**
1. Click **"Create Organization"** button
2. Fill in the organization details:
   - **Name**: Organization's business name
   - **Slug**: URL-friendly identifier (auto-generated from name)
   - **Email**: Primary contact email
   - **Phone**: Contact phone number (optional)
   - **Address**: Business address (optional)
3. Select initial subscription tier
4. Click **"Create"** to save

**Note:** When creating an organization manually, you'll need to add members separately.

### Viewing Organization Details

**To view details:**
1. Click on any organization in the list
2. The details page shows:
   - **Overview**: Basic information and settings
   - **Subscription**: Current plan, billing cycle, payment history
   - **Members**: List of users with their roles
   - **Usage Metrics**: Current usage vs. plan limits
   - **Activity**: Recent actions and changes

### Editing Organization Information

**Steps:**
1. Navigate to the organization details page
2. Click **"Edit Organization"**
3. Update the desired fields:
   - Name, email, phone, address
   - Subscription tier (see Subscription Management)
   - Usage limits (max users, products, invoices)
4. Click **"Save Changes"**

**Important:** Changing subscription tiers should be done through the subscription management interface to ensure proper billing.

### Suspending an Organization

Suspending an organization prevents members from accessing the system while preserving all data.

**When to suspend:**
- Payment failures after grace period
- Terms of service violations
- Security concerns
- At customer request

**Steps:**
1. Navigate to organization details
2. Click **"Suspend Organization"**
3. Provide a reason for suspension (logged in audit trail)
4. Confirm the action

**Effects:**
- All members lose access immediately
- Data is preserved
- Organization status changes to "Suspended"
- Members see a suspension notice when attempting to login

### Reactivating an Organization

**Steps:**
1. Navigate to suspended organization details
2. Click **"Activate Organization"**
3. Verify that any issues (payment, violations) are resolved
4. Confirm the action

**Effects:**
- Members regain access immediately
- Organization status changes to "Active"
- Subscription status is updated based on payment status

### Deleting an Organization

**Warning:** Deletion is permanent and cannot be undone.

**Steps:**
1. Navigate to organization details
2. Click **"Delete Organization"** (usually in a danger zone section)
3. Type the organization name to confirm
4. Confirm deletion

**Effects:**
- Organization and all associated data are permanently deleted
- All members lose access
- Subscriptions are cancelled
- Action is logged in audit trail

---

## Subscription Management

### Viewing Subscription Details

**From Organization Details:**
1. Navigate to organization details page
2. View the **Subscription** section showing:
   - Current plan (Free, Basic, Professional, Enterprise)
   - Subscription status (Trial, Active, Expired, Cancelled)
   - Billing cycle (Monthly/Yearly)
   - Current period dates
   - Next payment date
   - Payment history

### Subscription Statuses

- **Trial**: Organization is in trial period (if applicable)
- **Active**: Subscription is current and paid
- **Expired**: Subscription period has ended, grace period may apply
- **Suspended**: Access restricted due to payment failure or admin action
- **Cancelled**: Subscription cancelled, access until period end

### Manually Creating a Subscription

**Use case:** Granting complimentary access or handling offline payments

**Steps:**
1. Navigate to organization details
2. Click **"Create Subscription"**
3. Fill in subscription details:
   - Plan ID (free, basic, pro, enterprise)
   - Amount (in Naira)
   - Billing interval (monthly/yearly)
   - Start date
   - End date
4. Add payment reference if applicable
5. Click **"Create"**

### Modifying Subscriptions

**Upgrading a Plan:**
1. Navigate to organization subscription details
2. Click **"Upgrade Plan"**
3. Select new plan tier
4. System calculates prorated amount
5. Process payment or mark as paid
6. New limits apply immediately

**Downgrading a Plan:**
1. Navigate to organization subscription details
2. Click **"Downgrade Plan"**
3. Select new plan tier
4. Downgrade takes effect at end of current billing period
5. Organization is notified of pending change

**Extending Subscription:**
1. Navigate to organization subscription details
2. Click **"Extend Subscription"**
3. Enter new end date
4. Provide reason (logged in audit trail)
5. Confirm extension

### Handling Payment Issues

**Failed Payments:**
1. System automatically logs failed payments
2. Organization owner is notified
3. Grace period begins (typically 7 days)
4. After grace period, organization is suspended

**Manual Payment Verification:**
1. Navigate to organization subscription
2. Click **"Verify Payment"**
3. Enter Flutterwave transaction ID
4. System verifies with Flutterwave API
5. Subscription updated based on verification result

**Granting Grace Period:**
1. Navigate to organization subscription
2. Click **"Extend Grace Period"**
3. Enter new grace period end date
4. Provide reason
5. Confirm extension

### Cancelling Subscriptions

**Steps:**
1. Navigate to organization subscription details
2. Click **"Cancel Subscription"**
3. Choose cancellation type:
   - **Immediate**: Access ends now
   - **End of Period**: Access until current period ends
4. Provide cancellation reason
5. Confirm cancellation

**Effects:**
- Subscription status changes to "Cancelled"
- Recurring billing stops
- Access continues until period end (if selected)
- Organization can resubscribe at any time

---

## Platform Analytics

### Accessing Analytics Dashboard

Navigate to **Admin Dashboard** → **Analytics** to view platform-wide metrics.

### Key Metrics

**Revenue Metrics:**
- **MRR (Monthly Recurring Revenue)**: Total monthly subscription revenue
- **ARR (Annual Recurring Revenue)**: Projected annual revenue
- **Revenue by Plan**: Breakdown of revenue by subscription tier
- **Revenue Trends**: Historical revenue charts

**User Metrics:**
- **Total Organizations**: Number of registered organizations
- **Active Organizations**: Organizations with active subscriptions
- **Total Users**: All users across all organizations
- **Active Users**: Users who logged in recently (last 30 days)

**Subscription Metrics:**
- **Subscriptions by Tier**: Distribution across Free, Basic, Pro, Enterprise
- **Subscription Status**: Active, Expired, Cancelled breakdown
- **Trial Conversions**: Percentage of trials converting to paid
- **Churn Rate**: Percentage of cancelled subscriptions

**Growth Metrics:**
- **New Organizations**: Organizations created in period
- **New Subscriptions**: New paid subscriptions in period
- **Upgrades**: Plan upgrades in period
- **Downgrades**: Plan downgrades in period

### Filtering Analytics

- **Date Range**: Select custom date ranges for analysis
- **Plan Tier**: Filter metrics by specific subscription tiers
- **Status**: Filter by subscription status

### Exporting Data

1. Select desired metrics and filters
2. Click **"Export"** button
3. Choose format (CSV, Excel, PDF)
4. Download generated report

---

## Audit Logs

### Accessing Audit Logs

Navigate to **Admin Dashboard** → **Audit Logs** to view system activity.

### What Gets Logged

**Admin Actions:**
- Organization creation, modification, deletion
- Subscription changes
- User management actions
- System configuration changes

**Organization Actions:**
- Subscription purchases and cancellations
- Plan upgrades and downgrades
- Member additions and removals
- Payment events

**Security Events:**
- Failed login attempts
- Permission changes
- Suspicious activity
- Data access violations

### Viewing Audit Logs

The audit log viewer displays:
- **Timestamp**: When the action occurred
- **Actor**: Who performed the action (admin or user)
- **Action**: What was done
- **Target**: What was affected (organization, subscription, user)
- **Details**: Additional context and data
- **IP Address**: Source of the action

### Filtering Audit Logs

**Available Filters:**
- **Date Range**: Specific time period
- **Action Type**: Filter by action category
- **Actor**: Filter by specific admin or user
- **Organization**: Filter by specific organization
- **Target Type**: Filter by affected resource type

**Search:**
- Full-text search across all log fields
- Search by organization name, user email, action description

### Exporting Audit Logs

1. Apply desired filters
2. Click **"Export Logs"**
3. Select date range and format
4. Download audit report

**Use Cases:**
- Compliance reporting
- Security investigations
- Troubleshooting issues
- Customer support

---

## Troubleshooting

### Common Issues and Solutions

#### Issue: Organization Cannot Access System

**Symptoms:**
- Members report being unable to login
- "Access Denied" or "Subscription Expired" messages

**Diagnosis:**
1. Check organization status (Active/Suspended)
2. Check subscription status and expiry date
3. Review recent audit logs for suspension events
4. Verify payment status

**Solutions:**
- If suspended: Reactivate organization after resolving issue
- If expired: Extend subscription or process payment
- If payment failed: Verify payment manually or request new payment

#### Issue: Payment Not Reflecting

**Symptoms:**
- Organization reports payment made but subscription not active
- Payment shows in Flutterwave but not in system

**Diagnosis:**
1. Get transaction ID from organization
2. Navigate to organization subscription details
3. Check payment history
4. Review webhook logs (if available)

**Solutions:**
- Use "Verify Payment" feature with transaction ID
- Manually update subscription if payment confirmed
- Check Flutterwave webhook configuration
- Contact Flutterwave support if needed

#### Issue: Usage Limits Not Enforcing

**Symptoms:**
- Organization exceeds plan limits
- No upgrade prompts shown

**Diagnosis:**
1. Check organization's current plan limits
2. Verify actual usage (products, users, invoices)
3. Review limit checker implementation
4. Check for errors in application logs

**Solutions:**
- Manually adjust limits if needed
- Verify limit checker is enabled
- Check for code issues in limit enforcement
- Update organization plan if appropriate

#### Issue: Member Cannot Join Organization

**Symptoms:**
- Invitation email not received
- Invitation link not working
- Error when accepting invitation

**Diagnosis:**
1. Check if invitation was created (audit logs)
2. Verify invitation token is valid and not expired
3. Check organization user limit
4. Review email delivery logs

**Solutions:**
- Resend invitation if expired
- Manually add member if invitation system failing
- Upgrade plan if user limit reached
- Check email configuration

#### Issue: Subscription Not Renewing

**Symptoms:**
- Subscription expired despite auto-renewal
- Payment not processed automatically

**Diagnosis:**
1. Check Flutterwave subscription status
2. Review payment method on file
3. Check for failed payment attempts
4. Review webhook logs

**Solutions:**
- Verify Flutterwave subscription is active
- Request organization to update payment method
- Manually process renewal payment
- Check webhook configuration

### Getting Help

**For Technical Issues:**
- Check application logs for errors
- Review database for data inconsistencies
- Consult developer documentation
- Contact development team

**For Payment Issues:**
- Check Flutterwave dashboard
- Review webhook logs
- Contact Flutterwave support
- Verify API credentials

**For Customer Support:**
- Review organization's audit logs
- Check subscription and payment history
- Document issue details
- Escalate to appropriate team

### Best Practices

1. **Regular Monitoring:**
   - Check analytics dashboard daily
   - Review failed payments weekly
   - Monitor audit logs for suspicious activity

2. **Proactive Communication:**
   - Notify organizations before suspension
   - Provide clear reasons for actions
   - Document all manual interventions

3. **Data Integrity:**
   - Verify data before making changes
   - Use audit logs to track changes
   - Back up data before major operations

4. **Security:**
   - Use strong passwords and MFA
   - Log out when not in use
   - Review access logs regularly
   - Report suspicious activity immediately

5. **Documentation:**
   - Document manual interventions
   - Keep notes on recurring issues
   - Update troubleshooting guides
   - Share knowledge with team

---

## Appendix

### Subscription Plan Details

**Free Plan:**
- Cost: ₦0
- Max Users: 2
- Max Products: 50
- Max Invoices/Month: 20
- Storage: 100 MB

**Basic Plan:**
- Cost: ₦15,000/month
- Max Users: 5
- Max Products: 500
- Max Invoices/Month: 100
- Storage: 1 GB

**Professional Plan:**
- Cost: ₦35,000/month
- Max Users: 15
- Max Products: 2,000
- Max Invoices/Month: 500
- Storage: 5 GB

**Enterprise Plan:**
- Cost: ₦75,000/month
- Max Users: Unlimited
- Max Products: Unlimited
- Max Invoices/Month: Unlimited
- Storage: 20 GB

### Contact Information

**Technical Support:**
- Email: tech-support@storemaster.com
- Response Time: 24 hours

**Billing Support:**
- Email: billing@storemaster.com
- Response Time: 48 hours

**Emergency Contact:**
- Phone: [Emergency Number]
- Available: 24/7 for critical issues

---

*Last Updated: December 2024*
*Version: 1.0*
