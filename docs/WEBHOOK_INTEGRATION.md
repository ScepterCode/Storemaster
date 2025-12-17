# Flutterwave Webhook Integration Guide

This guide explains how the Flutterwave webhook integration works in the Store Master multi-tenant SaaS platform.

## Overview

The webhook handler is implemented as a Supabase Edge Function that receives and processes payment events from Flutterwave. It handles subscription payments, renewals, cancellations, and failures.

## Architecture

```
┌─────────────────┐
│   Flutterwave   │
│   Dashboard     │
└────────┬────────┘
         │ Webhook Events
         │ (HTTPS POST)
         ▼
┌─────────────────────────────┐
│  Supabase Edge Function     │
│  flutterwave-webhook        │
│                             │
│  1. Validate Signature      │
│  2. Parse Event             │
│  3. Process Payment         │
│  4. Update Database         │
│  5. Log Audit Trail         │
└────────┬────────────────────┘
         │
         ▼
┌─────────────────────────────┐
│  Supabase Database          │
│                             │
│  - subscriptions            │
│  - organizations            │
│  - audit_logs               │
└─────────────────────────────┘
```

## Webhook Events

### 1. charge.completed

**Triggered when**: A payment is successfully completed

**Payload Example**:
```json
{
  "event": "charge.completed",
  "data": {
    "id": 12345,
    "tx_ref": "SUB-org-id-timestamp",
    "flw_ref": "FLW-REF-123",
    "amount": 15000,
    "currency": "NGN",
    "charged_amount": 15000,
    "status": "successful",
    "payment_type": "card",
    "customer": {
      "id": 67890,
      "email": "user@example.com",
      "name": "John Doe"
    },
    "created_at": "2024-01-01T00:00:00Z"
  }
}
```

**Actions Performed**:
1. Extract organization ID from `tx_ref`
2. Update subscription status to 'active'
3. Set subscription period dates (30 days)
4. Update organization status to 'active'
5. Reset failed payment count
6. Log payment event in audit logs

**Database Updates**:
```sql
-- Update subscription
UPDATE subscriptions SET
  status = 'active',
  flutterwave_subscription_id = '12345',
  current_period_start = NOW(),
  current_period_end = NOW() + INTERVAL '30 days',
  last_payment_date = NOW(),
  failed_payment_count = 0
WHERE organization_id = 'extracted-org-id';

-- Update organization
UPDATE organizations SET
  subscription_status = 'active',
  is_active = true
WHERE id = 'extracted-org-id';
```

### 2. charge.failed

**Triggered when**: A payment attempt fails

**Actions Performed**:
1. Extract organization ID from `tx_ref`
2. Increment failed payment count
3. Update subscription status to 'failed' after 3 failures
4. Log failed payment event

**Grace Period Logic**:
- 1st failure: Increment counter, keep subscription active
- 2nd failure: Increment counter, keep subscription active
- 3rd failure: Mark subscription as 'failed', restrict access

### 3. subscription.cancelled

**Triggered when**: A subscription is cancelled by the user or admin

**Actions Performed**:
1. Update subscription status to 'cancelled'
2. Set `cancel_at_period_end` flag
3. Log cancellation event

**Note**: Access continues until the end of the current billing period.

### 4. subscription.expired

**Triggered when**: A subscription reaches its expiration date

**Actions Performed**:
1. Update subscription status to 'expired'
2. Update organization status to 'expired'
3. Deactivate organization access
4. Log expiration event

**Note**: Data is preserved but access to paid features is restricted.

## Transaction Reference Format

The webhook handler uses the transaction reference (`tx_ref`) to identify the organization:

### Format Patterns

1. **New Subscription**: `SUB-{organizationId}-{timestamp}`
   - Example: `SUB-550e8400-e29b-41d4-a716-446655440000-1701234567890`

2. **Upgrade**: `UPGRADE-{organizationId}-{timestamp}`
   - Example: `UPGRADE-550e8400-e29b-41d4-a716-446655440000-1701234567890`

### Extraction Logic

```typescript
const txRef = data.tx_ref;
const orgIdMatch = txRef.match(/(?:SUB|UPGRADE)-([^-]+)-/);
const organizationId = orgIdMatch[1];
const isUpgrade = txRef.startsWith('UPGRADE-');
```

## Security

### Webhook Signature Validation

Flutterwave sends a signature in the `verif-hash` header. The webhook handler validates this signature before processing any events.

**Validation Process**:
```typescript
function validateWebhookSignature(signature: string, payload: string): boolean {
  // Compare signature with FLUTTERWAVE_SECRET_HASH
  return signature === FLUTTERWAVE_SECRET_HASH;
}
```

**Security Best Practices**:
- Always validate signature before processing
- Use HTTPS only (enforced by Supabase)
- Store secret hash in environment variables
- Never expose secret hash in client-side code
- Log all webhook events for audit trail

### Environment Variables

Required environment variables:

```bash
FLUTTERWAVE_SECRET_HASH=your_secret_hash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

**Getting Your Secret Hash**:
1. Log in to Flutterwave Dashboard
2. Navigate to Settings > Webhooks
3. Copy the Secret Hash
4. Add to Supabase secrets: `supabase secrets set FLUTTERWAVE_SECRET_HASH=your_hash`

## Deployment

### Prerequisites

1. Supabase CLI installed:
   ```bash
   npm install -g supabase
   ```

2. Project linked:
   ```bash
   supabase link --project-ref your-project-ref
   ```

### Deploy Steps

1. **Deploy the function**:
   ```bash
   cd supabase/functions
   ./deploy.sh
   ```

   Or manually:
   ```bash
   supabase functions deploy flutterwave-webhook
   ```

2. **Set environment variables**:
   ```bash
   supabase secrets set FLUTTERWAVE_SECRET_HASH=your_secret_hash
   ```

3. **Get function URL**:
   ```bash
   supabase functions list
   ```
   
   URL format: `https://your-project-ref.supabase.co/functions/v1/flutterwave-webhook`

4. **Configure Flutterwave**:
   - Go to Flutterwave Dashboard > Settings > Webhooks
   - Add webhook URL
   - Select events: `charge.completed`, `charge.failed`, `subscription.cancelled`, `subscription.expired`
   - Save configuration

## Testing

### Local Testing

1. **Start Supabase locally**:
   ```bash
   supabase start
   ```

2. **Serve function locally**:
   ```bash
   supabase functions serve flutterwave-webhook
   ```

3. **Run test script**:
   ```bash
   cd supabase/functions
   ./test-webhook.sh http://localhost:54321/functions/v1/flutterwave-webhook test-secret
   ```

### Testing with Flutterwave Test Mode

1. Use Flutterwave test API keys
2. Create a test subscription
3. Make a test payment using test card:
   - Card: 5531886652142950
   - CVV: 564
   - Expiry: 09/32
   - PIN: 3310
   - OTP: 12345
4. Check webhook logs in Supabase Dashboard
5. Verify database updates

### Manual Testing with cURL

```bash
curl -X POST https://your-project.supabase.co/functions/v1/flutterwave-webhook \
  -H "Content-Type: application/json" \
  -H "verif-hash: your_secret_hash" \
  -d '{
    "event": "charge.completed",
    "data": {
      "id": 12345,
      "tx_ref": "SUB-test-org-id-1234567890",
      "flw_ref": "FLW-REF-123",
      "amount": 15000,
      "currency": "NGN",
      "charged_amount": 15000,
      "status": "successful",
      "payment_type": "card",
      "customer": {
        "id": 67890,
        "email": "test@example.com",
        "name": "Test User"
      },
      "created_at": "2024-01-01T00:00:00Z"
    }
  }'
```

## Monitoring

### View Function Logs

```bash
# View recent logs
supabase functions logs flutterwave-webhook

# Follow logs in real-time
supabase functions logs flutterwave-webhook --follow

# Filter by time
supabase functions logs flutterwave-webhook --since 1h
```

### Check Audit Logs

Query the audit logs table to see all webhook events:

```sql
SELECT 
  action,
  organization_id,
  details->>'tx_ref' as tx_ref,
  details->>'amount' as amount,
  created_at
FROM audit_logs 
WHERE action LIKE 'subscription.%' 
ORDER BY created_at DESC 
LIMIT 20;
```

### Monitor Subscription Status

```sql
SELECT 
  o.name as organization,
  s.status,
  s.last_payment_date,
  s.next_payment_date,
  s.failed_payment_count,
  s.current_period_end
FROM subscriptions s
JOIN organizations o ON o.id = s.organization_id
WHERE s.status IN ('active', 'failed')
ORDER BY s.current_period_end ASC;
```

## Troubleshooting

### Webhook Not Receiving Events

**Symptoms**: No webhook events are being received

**Solutions**:
1. Verify webhook URL in Flutterwave Dashboard
2. Check function deployment: `supabase functions list`
3. Verify function is running: `supabase functions logs flutterwave-webhook`
4. Test with manual cURL request
5. Check Flutterwave webhook logs in their dashboard

### Signature Validation Failing

**Symptoms**: Webhook returns 401 Unauthorized

**Solutions**:
1. Verify `FLUTTERWAVE_SECRET_HASH` is set correctly
2. Check secret hash matches Flutterwave Dashboard
3. Ensure header name is `verif-hash` (lowercase)
4. Test with correct secret hash using cURL

### Database Updates Not Working

**Symptoms**: Webhook succeeds but database not updated

**Solutions**:
1. Check `SUPABASE_SERVICE_ROLE_KEY` is set
2. Verify RLS policies allow service role access
3. Check function logs for database errors
4. Verify organization_id exists in database
5. Check tx_ref format is correct

### Failed Payment Not Incrementing Counter

**Symptoms**: Failed payments not tracked correctly

**Solutions**:
1. Check subscription exists for organization
2. Verify tx_ref format includes organization ID
3. Check function logs for extraction errors
4. Verify `failed_payment_count` column exists

### Subscription Not Activating

**Symptoms**: Payment successful but subscription not active

**Solutions**:
1. Check organization ID extraction from tx_ref
2. Verify subscription record exists
3. Check function logs for update errors
4. Verify payment status is 'successful'
5. Check RLS policies on subscriptions table

## Error Handling

The webhook handler implements comprehensive error handling:

### Error Response Format

```json
{
  "error": "Webhook processing failed",
  "message": "Detailed error message"
}
```

### Error Scenarios

1. **Invalid Signature**: Returns 401 Unauthorized
2. **Invalid Payload**: Returns 400 Bad Request
3. **Database Error**: Returns 500 Internal Server Error
4. **Unknown Event**: Logs warning, returns 200 OK

### Retry Logic

Flutterwave automatically retries failed webhooks:
- Retry intervals: 5 min, 30 min, 1 hour, 6 hours, 24 hours
- Total retries: 5 attempts
- Webhook marked as failed after all retries

## Best Practices

1. **Always validate signatures**: Never process webhooks without validation
2. **Use idempotency**: Handle duplicate webhook events gracefully
3. **Log everything**: Maintain comprehensive audit logs
4. **Monitor actively**: Set up alerts for failed webhooks
5. **Test thoroughly**: Test all webhook events before going live
6. **Handle errors gracefully**: Don't expose sensitive information in errors
7. **Use service role key**: Bypass RLS for webhook operations
8. **Keep secrets secure**: Never commit secrets to version control

## Integration with Frontend

The frontend doesn't directly interact with the webhook handler, but it does:

1. **Generate tx_ref**: Creates properly formatted transaction references
2. **Redirect to payment**: Sends users to Flutterwave payment page
3. **Handle callback**: Processes return from payment page
4. **Poll status**: Checks subscription status after payment

### Payment Flow

```typescript
// 1. Generate transaction reference
const txRef = `SUB-${organizationId}-${Date.now()}`;

// 2. Initialize payment
const result = await flutterwaveService.initializePayment({
  tx_ref: txRef,
  amount: planAmount,
  currency: 'NGN',
  redirect_url: `${window.location.origin}/subscription/callback`,
  customer: { email, name },
  customizations: { title: 'Subscription Payment' }
});

// 3. Redirect to payment page
window.location.href = result.data.link;

// 4. User completes payment on Flutterwave

// 5. Webhook processes payment (background)

// 6. User redirected to callback page

// 7. Frontend verifies payment and updates UI
```

## Support and Resources

- [Flutterwave Webhook Documentation](https://developer.flutterwave.com/docs/integration-guides/webhooks)
- [Supabase Edge Functions Documentation](https://supabase.com/docs/guides/functions)
- [Store Master Developer Guide](./DEVELOPER_GUIDE.md)

## Changelog

### Version 1.0.0 (Initial Release)
- Webhook signature validation
- Payment event handling
- Subscription management
- Failed payment tracking
- Audit logging
- Comprehensive error handling
