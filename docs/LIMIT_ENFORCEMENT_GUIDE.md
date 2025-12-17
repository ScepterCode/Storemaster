# Limit Enforcement Guide

This guide explains how the subscription plan limit enforcement system works in Store Master.

## Overview

The limit enforcement system prevents users from exceeding their subscription plan limits for:
- **Team Members**: Maximum number of users in an organization
- **Products**: Maximum number of products in inventory
- **Invoices**: Maximum number of invoices per month
- **Storage**: Maximum storage space (placeholder for future implementation)

## Architecture

### 1. Limit Checker Utility (`src/lib/limitChecker.ts`)

The core utility that checks current usage against plan limits.

**Key Functions:**

```typescript
// Check if a specific resource can be added
await canAddUser(organizationId);
await canAddProduct(organizationId);
await canAddInvoice(organizationId);

// Get comprehensive limit status for all resources
const limits = await checkOrganizationLimits(organizationId);
```

**Limit Status Structure:**

```typescript
interface LimitStatus {
  current: number;        // Current usage count
  limit: number;          // Maximum allowed (-1 for unlimited)
  isAtLimit: boolean;     // True if at or over limit
  isNearLimit: boolean;   // True if within 80% of limit
  percentage: number;     // Usage percentage
  remaining: number;      // Remaining capacity
}
```

### 2. Integration Points

Limit checks are integrated at the service/hook level before creating new resources:

#### Products (`src/hooks/useProducts.ts`)

```typescript
// Check limit before adding product
const canAdd = await canAddProduct(organization.id);
if (!canAdd) {
  setShowUpgradePrompt(true);
  toast({ title: "Product Limit Reached", ... });
  return false;
}
```

#### Invoices (`src/hooks/useInvoices.ts`)

```typescript
// Check limit before creating new invoice
const canAdd = await canAddInvoice(organization.id);
if (!canAdd) {
  setShowUpgradePrompt(true);
  toast({ title: "Invoice Limit Reached", ... });
  return false;
}
```

#### User Invitations (`src/services/invitationService.ts`)

```typescript
// Check limit before creating invitation
const canAdd = await canAddUser(organizationId);
if (!canAdd) {
  throw new Error('User limit reached. Please upgrade your plan...');
}
```

### 3. Upgrade Prompt Component (`src/components/UpgradePrompt.tsx`)

A dialog component that displays when limits are reached.

**Features:**
- Shows current usage vs. limit
- Visual progress bar with color coding
- Lists upgrade benefits
- Previews next plan tier
- Direct link to subscription plans page

**Usage:**

```typescript
import { UpgradePrompt } from '@/components/UpgradePrompt';
import { checkOrganizationLimits } from '@/lib/limitChecker';

const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);
const [limits, setLimits] = useState<OrganizationLimits>();

// When limit is reached
const limits = await checkOrganizationLimits(organization.id);
setLimits(limits);
setShowUpgradePrompt(true);

// Render
<UpgradePrompt
  open={showUpgradePrompt}
  onOpenChange={setShowUpgradePrompt}
  limitType="products"
  limits={limits}
/>
```

## Subscription Plans

Limits are defined in `src/config/subscriptionPlans.ts`:

| Plan | Users | Products | Invoices/Month | Price |
|------|-------|----------|----------------|-------|
| Free | 2 | 50 | 20 | ₦0 |
| Basic | 5 | 500 | 100 | ₦15,000/mo |
| Professional | 15 | 2,000 | 500 | ₦35,000/mo |
| Enterprise | Unlimited | Unlimited | Unlimited | ₦75,000/mo |

## Implementation Checklist

When adding limit enforcement to a new resource:

1. **Add limit check function** to `src/lib/limitChecker.ts`:
   ```typescript
   export const canAddResource = async (organizationId: string): Promise<boolean> => {
     // Get organization limits
     // Get current count
     // Compare and return
   }
   ```

2. **Integrate check** in the creation hook/service:
   ```typescript
   const canAdd = await canAddResource(organization.id);
   if (!canAdd) {
     setShowUpgradePrompt(true);
     // Show error message
     return false;
   }
   ```

3. **Add upgrade prompt** to the UI component:
   ```typescript
   const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);
   
   <UpgradePrompt
     open={showUpgradePrompt}
     onOpenChange={setShowUpgradePrompt}
     limitType="resource"
     limits={limits}
   />
   ```

4. **Update plan features** in `src/config/subscriptionPlans.ts` if needed

## Testing

To test limit enforcement:

1. **Create test organization** with Free plan
2. **Add resources** up to the limit (e.g., 50 products)
3. **Attempt to add one more** - should show upgrade prompt
4. **Upgrade plan** and verify new limits apply
5. **Test edge cases**:
   - Exactly at limit
   - Near limit (80%+)
   - Unlimited plans (Enterprise)

## Error Handling

The limit checker includes graceful error handling:

```typescript
try {
  const canAdd = await canAddProduct(organization.id);
  if (!canAdd) {
    // Show upgrade prompt
  }
} catch (err) {
  console.error("Error checking limit:", err);
  // Continue with operation if limit check fails
  // This prevents limit check failures from blocking users
}
```

## Future Enhancements

1. **Storage Calculation**: Implement actual storage usage tracking
2. **Usage Analytics**: Track usage trends over time
3. **Proactive Notifications**: Warn users before hitting limits
4. **Soft Limits**: Allow temporary overages with warnings
5. **Custom Limits**: Allow admins to set custom limits per organization
6. **API Rate Limiting**: Enforce API call limits from plan features

## Related Files

- `src/lib/limitChecker.ts` - Core limit checking logic
- `src/components/UpgradePrompt.tsx` - Upgrade prompt UI
- `src/hooks/useProducts.ts` - Product limit integration
- `src/hooks/useInvoices.ts` - Invoice limit integration
- `src/services/invitationService.ts` - User limit integration
- `src/config/subscriptionPlans.ts` - Plan definitions
- `src/types/admin.ts` - Type definitions
