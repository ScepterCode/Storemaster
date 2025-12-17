# Flutterwave Webhook Implementation Notes

## What Was Implemented

This implementation creates a complete Supabase Edge Function for handling Flutterwave webhook events in the Store Master multi-tenant SaaS platform.

## Files Created

1. **`supabase/functions/flutterwave-webhook/index.ts`**
   - Main webhook handler implementation
   - Validates webhook signatures
   - Processes payment events
   - Updates database records
   - Logs audit trail

2. **`supabase/functions/flutterwave-webhook/README.md`**
   - Comprehensive documentation
   - Deployment instructions
   - Testing guide
   - Troubleshooting tips

3. **`supabase/functions/flutterwave-webhook/.env.example`**
   - Environment variable template
   - Configuration examples

4. **`supabase/functions/deploy.sh`**
   - Automated deployment script
   - Checks prerequisites
   - Deploys function
   - Provides next steps

5. **`supabase/functions/test-webhook.sh`**
   - Test script for webhook events
   - Tests all event types
   - Validates signature checking
   - Can test local or deployed function

6. **`docs/WEBHOOK_INTEGRATION.md`**
   - Complete integration guide
   - Architecture overview
   - Event handling details
   - Security best practices
   - Monitoring and troubleshooting

## Requirements Covered

### Requirement 3.3
✅ **WHEN payment is completed, THE System SHALL receive a webhook notification from Flutterwave**

Implementation:
- Edge function receives POST requests from Flutterwave
- Handles `charge.completed` event
- Processes payment data

### Requirement 3.4
✅ **WHEN payment is verified, THE System SHALL activate the subscription and grant access to features**

Implementation:
- Validates webhook signature
- Updates subscription status to 'active'
- Updates organization status to 'active'
- Sets subscription period dates
- Grants access by setting `is_active = true`

### Requirement 10.3
✅ **WHEN receiving webhooks, THE System SHALL verify the signature to prevent fraud**

Implementation:
- Validates `verif-hash` header
- Compares with `FLUTTERWAVE_SECRET_HASH`
- Returns 401 Unauthorized if invalid
- Logs validation failures

### Requirement 10.4
✅ **THE System SHALL handle Flutterwave API errors gracefully with appropriate user messages**

Implementation:
- Comprehensive try-catch blocks
- Detailed error logging
- Graceful error responses
- Doesn't expose sensitive information

### Requirement 10.5
✅ **THE System SHALL log all payment transactions for reconciliation purposes**

Implementation:
- Logs all events to `audit_logs` table
- Records transaction details
- Includes payment amounts and references
- Tracks organization context

## Key Features

### 1. Webhook Signature Validation
- Validates all incoming webhooks
- Prevents unauthorized access
- Protects against fraud

### 2. Event Handling
Supports multiple webhook events:
- `charge.completed` - Successful payment
- `charge.failed` - Failed payment
- `subscription.cancelled` - Subscription cancelled
- `subscription.expired` - Subscription expired

### 3. Transaction Reference Parsing
Extracts organization ID from transaction reference:
- Format: `SUB-{orgId}-{timestamp}`
- Format: `UPGRADE-{orgId}-{timestamp}`
- Handles both new subscriptions and upgrades

### 4. Database Updates
Updates multiple tables:
- `subscriptions` - Payment and status updates
- `organizations` - Activation and status
- `audit_logs` - Event tracking

### 5. Failed Payment Tracking
- Increments failed payment counter
- Marks subscription as 'failed' after 3 failures
- Provides grace period for payment issues

### 6. Audit Logging
Logs all webhook events:
- Payment received
- Payment failed
- Subscription cancelled
- Subscription expired
- Subscription upgraded

## Security Considerations

### Implemented Security Measures

1. **Signature Validation**
   - All webhooks validated before processing
   - Uses Flutterwave's `verif-hash` header
   - Rejects invalid signatures

2. **Service Role Key**
   - Uses Supabase service role key
   - Bypasses RLS policies for webhook operations
   - Stored securely in environment variables

3. **HTTPS Only**
   - Enforced by Supabase Edge Functions
   - All communication encrypted

4. **Error Handling**
   - Doesn't expose sensitive information
   - Logs errors for debugging
   - Returns generic error messages

5. **Environment Variables**
   - Secrets stored in Supabase
   - Never exposed in code
   - Separate from client-side config

## Deployment Checklist

- [ ] Install Supabase CLI: `npm install -g supabase`
- [ ] Link project: `supabase link --project-ref your-ref`
- [ ] Deploy function: `./deploy.sh` or `supabase functions deploy flutterwave-webhook`
- [ ] Set secret hash: `supabase secrets set FLUTTERWAVE_SECRET_HASH=your_hash`
- [ ] Get function URL: `supabase functions list`
- [ ] Configure Flutterwave webhook URL
- [ ] Select webhook events in Flutterwave Dashboard
- [ ] Test with test payment
- [ ] Monitor logs: `supabase functions logs flutterwave-webhook --follow`

## Testing Checklist

- [ ] Test successful payment (`charge.completed`)
- [ ] Test failed payment (`charge.failed`)
- [ ] Test subscription cancellation
- [ ] Test subscription expiration
- [ ] Test invalid signature (should fail)
- [ ] Test upgrade payment
- [ ] Verify database updates
- [ ] Check audit logs
- [ ] Test with Flutterwave test mode
- [ ] Monitor function logs

## Integration Points

### Frontend Integration
The webhook works with the frontend payment flow:

1. Frontend generates `tx_ref` with organization ID
2. Frontend redirects to Flutterwave payment page
3. User completes payment
4. Flutterwave sends webhook to Edge Function
5. Edge Function processes payment and updates database
6. User redirected to callback page
7. Frontend verifies payment status

### Database Integration
Updates these tables:
- `subscriptions` - Payment tracking
- `organizations` - Access control
- `audit_logs` - Event history

### Service Integration
Works with:
- `flutterwaveService.ts` - Payment initialization
- `adminService.ts` - Organization management
- `OrganizationContext.tsx` - Access control

## Monitoring and Maintenance

### What to Monitor

1. **Webhook Success Rate**
   - Track successful vs failed webhooks
   - Alert on high failure rate

2. **Payment Processing Time**
   - Monitor function execution time
   - Alert on slow processing

3. **Failed Payments**
   - Track organizations with failed payments
   - Send reminders before suspension

4. **Subscription Expirations**
   - Monitor upcoming expirations
   - Send renewal reminders

### Maintenance Tasks

1. **Regular Log Review**
   - Check for errors or warnings
   - Identify patterns in failures

2. **Database Cleanup**
   - Archive old audit logs
   - Clean up expired subscriptions

3. **Security Audits**
   - Review signature validation
   - Check for unauthorized access attempts

4. **Performance Optimization**
   - Monitor function cold starts
   - Optimize database queries

## Known Limitations

1. **Signature Validation**
   - Currently uses simple hash comparison
   - Could be enhanced with HMAC verification

2. **Retry Logic**
   - Relies on Flutterwave's retry mechanism
   - Could implement custom retry logic

3. **Idempotency**
   - Basic duplicate handling
   - Could add explicit idempotency keys

4. **Rate Limiting**
   - No rate limiting implemented
   - Could add if needed for security

## Future Enhancements

1. **Enhanced Signature Validation**
   - Implement HMAC-SHA256 verification
   - Add timestamp validation

2. **Idempotency Keys**
   - Track processed webhook IDs
   - Prevent duplicate processing

3. **Webhook Retry Queue**
   - Implement custom retry logic
   - Handle temporary failures

4. **Real-time Notifications**
   - Send email notifications
   - Push notifications to users

5. **Advanced Analytics**
   - Track payment success rates
   - Monitor revenue metrics
   - Churn analysis

## Support

For issues or questions:
- Check function logs: `supabase functions logs flutterwave-webhook`
- Review audit logs in database
- Check Flutterwave webhook logs
- Refer to documentation in `docs/WEBHOOK_INTEGRATION.md`
