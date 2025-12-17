# Flutterwave Webhook Edge Function

This Supabase Edge Function handles webhook events from Flutterwave for subscription payments and management.

## Features

- **Webhook Signature Validation**: Verifies webhook authenticity using Flutterwave's secret hash
- **Payment Processing**: Handles successful payment events and activates subscriptions
- **Subscription Management**: Processes cancellation and expiration events
- **Failed Payment Handling**: Tracks failed payments and updates subscription status
- **Audit Logging**: Records all payment events for compliance and debugging

## Requirements Covered

- **3.3**: Receive webhook notifications from Flutterwave when payment is completed
- **3.4**: Activate subscription and grant access to features when payment is verified
- **10.3**: Verify webhook signature to prevent fraud
- **10.4**: Handle Flutterwave API errors gracefully
- **10.5**: Log all payment transactions for reconciliation

## Environment Variables

The following environment variables must be set in your Supabase project:

```bash
FLUTTERWAVE_SECRET_HASH=your_flutterwave_secret_hash
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### Getting Your Flutterwave Secret Hash

1. Log in to your Flutterwave Dashboard
2. Go to Settings > Webhooks
3. Copy your Secret Hash
4. Add it to your Supabase project secrets

## Deployment

### Prerequisites

- Supabase CLI installed: `npm install -g supabase`
- Supabase project linked: `supabase link --project-ref your-project-ref`

### Deploy the Function

```bash
# Deploy the webhook function
supabase functions deploy flutterwave-webhook

# Set environment variables
supabase secrets set FLUTTERWAVE_SECRET_HASH=your_secret_hash
```

### Get the Function URL

After deployment, you'll get a URL like:
```
https://your-project-ref.supabase.co/functions/v1/flutterwave-webhook
```

## Configure Flutterwave Webhook

1. Log in to your Flutterwave Dashboard
2. Go to Settings > Webhooks
3. Add your webhook URL: `https://your-project-ref.supabase.co/functions/v1/flutterwave-webhook`
4. Select the following events:
   - `charge.completed`
   - `charge.failed`
   - `subscription.cancelled`
   - `subscription.expired`
5. Save the webhook configuration

## Webhook Events Handled

### charge.completed
Triggered when a payment is successfully completed.

**Actions:**
- Updates subscription status to 'active'
- Sets subscription period dates
- Updates organization status to 'active'
- Logs payment event in audit logs

### charge.failed
Triggered when a payment fails.

**Actions:**
- Increments failed payment count
- Updates subscription status to 'failed' after 3 failures
- Logs failed payment event

### subscription.cancelled
Triggered when a subscription is cancelled.

**Actions:**
- Updates subscription status to 'cancelled'
- Sets cancel_at_period_end flag
- Logs cancellation event

### subscription.expired
Triggered when a subscription expires.

**Actions:**
- Updates subscription status to 'expired'
- Updates organization status to 'expired'
- Deactivates organization access
- Logs expiration event

## Transaction Reference Format

The webhook handler expects transaction references in the following formats:

- **New Subscription**: `SUB-{organizationId}-{timestamp}`
- **Upgrade**: `UPGRADE-{organizationId}-{timestamp}`

Example: `SUB-550e8400-e29b-41d4-a716-446655440000-1701234567890`

## Testing

### Local Testing

```bash
# Start Supabase locally
supabase start

# Serve the function locally
supabase functions serve flutterwave-webhook

# Test with curl
curl -X POST http://localhost:54321/functions/v1/flutterwave-webhook \
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

### Testing with Flutterwave Test Mode

1. Use Flutterwave test API keys
2. Make a test payment
3. Check webhook logs in Supabase Dashboard > Edge Functions > Logs
4. Verify database updates in Supabase Dashboard > Table Editor

## Security Considerations

- **Signature Validation**: Always validates webhook signature before processing
- **Service Role Key**: Uses Supabase service role key to bypass RLS policies
- **HTTPS Only**: Webhook endpoint only accepts HTTPS requests in production
- **Error Handling**: Gracefully handles errors without exposing sensitive information

## Monitoring

### View Logs

```bash
# View function logs
supabase functions logs flutterwave-webhook

# Follow logs in real-time
supabase functions logs flutterwave-webhook --follow
```

### Check Audit Logs

All webhook events are logged in the `audit_logs` table:

```sql
SELECT * FROM audit_logs 
WHERE action LIKE 'subscription.%' 
ORDER BY created_at DESC 
LIMIT 10;
```

## Troubleshooting

### Webhook Not Receiving Events

1. Check Flutterwave webhook configuration
2. Verify webhook URL is correct
3. Check function deployment status: `supabase functions list`
4. Review function logs for errors

### Signature Validation Failing

1. Verify `FLUTTERWAVE_SECRET_HASH` is set correctly
2. Check that the secret hash matches your Flutterwave dashboard
3. Ensure the header name is `verif-hash` (Flutterwave's standard)

### Database Updates Not Working

1. Check that `SUPABASE_SERVICE_ROLE_KEY` is set
2. Verify RLS policies allow service role access
3. Check function logs for database errors
4. Verify organization_id format in tx_ref

## Support

For issues or questions:
- Check Supabase Edge Functions documentation
- Review Flutterwave webhook documentation
- Check function logs for detailed error messages
