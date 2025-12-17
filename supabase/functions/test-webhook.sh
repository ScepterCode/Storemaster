#!/bin/bash

# Test script for Flutterwave webhook
# This script sends test webhook events to the local or deployed function

set -e

# Configuration
FUNCTION_URL="${1:-http://localhost:54321/functions/v1/flutterwave-webhook}"
SECRET_HASH="${2:-test-secret-hash}"

echo "🧪 Testing Flutterwave Webhook Handler"
echo "URL: $FUNCTION_URL"
echo ""

# Test 1: Successful Payment
echo "Test 1: Successful Payment (charge.completed)"
curl -X POST "$FUNCTION_URL" \
  -H "Content-Type: application/json" \
  -H "verif-hash: $SECRET_HASH" \
  -d '{
    "event": "charge.completed",
    "data": {
      "id": 12345,
      "tx_ref": "SUB-550e8400-e29b-41d4-a716-446655440000-1701234567890",
      "flw_ref": "FLW-REF-TEST-123",
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
echo -e "\n"

# Test 2: Failed Payment
echo "Test 2: Failed Payment (charge.failed)"
curl -X POST "$FUNCTION_URL" \
  -H "Content-Type: application/json" \
  -H "verif-hash: $SECRET_HASH" \
  -d '{
    "event": "charge.failed",
    "data": {
      "id": 12346,
      "tx_ref": "SUB-550e8400-e29b-41d4-a716-446655440000-1701234567891",
      "flw_ref": "FLW-REF-TEST-124",
      "amount": 15000,
      "currency": "NGN",
      "charged_amount": 0,
      "status": "failed",
      "payment_type": "card",
      "customer": {
        "id": 67890,
        "email": "test@example.com",
        "name": "Test User"
      },
      "created_at": "2024-01-01T00:00:00Z"
    }
  }'
echo -e "\n"

# Test 3: Subscription Cancelled
echo "Test 3: Subscription Cancelled"
curl -X POST "$FUNCTION_URL" \
  -H "Content-Type: application/json" \
  -H "verif-hash: $SECRET_HASH" \
  -d '{
    "event": "subscription.cancelled",
    "data": {
      "id": 54321,
      "tx_ref": "SUB-550e8400-e29b-41d4-a716-446655440000-1701234567892",
      "flw_ref": "FLW-REF-TEST-125",
      "amount": 15000,
      "currency": "NGN",
      "charged_amount": 15000,
      "status": "cancelled",
      "payment_type": "card",
      "customer": {
        "id": 67890,
        "email": "test@example.com",
        "name": "Test User"
      },
      "created_at": "2024-01-01T00:00:00Z"
    }
  }'
echo -e "\n"

# Test 4: Subscription Expired
echo "Test 4: Subscription Expired"
curl -X POST "$FUNCTION_URL" \
  -H "Content-Type: application/json" \
  -H "verif-hash: $SECRET_HASH" \
  -d '{
    "event": "subscription.expired",
    "data": {
      "id": 54322,
      "tx_ref": "SUB-550e8400-e29b-41d4-a716-446655440000-1701234567893",
      "flw_ref": "FLW-REF-TEST-126",
      "amount": 15000,
      "currency": "NGN",
      "charged_amount": 15000,
      "status": "expired",
      "payment_type": "card",
      "customer": {
        "id": 67890,
        "email": "test@example.com",
        "name": "Test User"
      },
      "created_at": "2024-01-01T00:00:00Z"
    }
  }'
echo -e "\n"

# Test 5: Invalid Signature
echo "Test 5: Invalid Signature (should fail)"
curl -X POST "$FUNCTION_URL" \
  -H "Content-Type: application/json" \
  -H "verif-hash: invalid-signature" \
  -d '{
    "event": "charge.completed",
    "data": {
      "id": 12347,
      "tx_ref": "SUB-test-org-1701234567894",
      "flw_ref": "FLW-REF-TEST-127",
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
echo -e "\n"

# Test 6: Upgrade Payment
echo "Test 6: Upgrade Payment"
curl -X POST "$FUNCTION_URL" \
  -H "Content-Type: application/json" \
  -H "verif-hash: $SECRET_HASH" \
  -d '{
    "event": "charge.completed",
    "data": {
      "id": 12348,
      "tx_ref": "UPGRADE-550e8400-e29b-41d4-a716-446655440000-1701234567895",
      "flw_ref": "FLW-REF-TEST-128",
      "amount": 35000,
      "currency": "NGN",
      "charged_amount": 35000,
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
echo -e "\n"

echo "✅ All tests completed!"
echo ""
echo "Usage:"
echo "  ./test-webhook.sh [function_url] [secret_hash]"
echo ""
echo "Examples:"
echo "  # Test local function"
echo "  ./test-webhook.sh http://localhost:54321/functions/v1/flutterwave-webhook test-secret"
echo ""
echo "  # Test deployed function"
echo "  ./test-webhook.sh https://your-project.supabase.co/functions/v1/flutterwave-webhook your-secret-hash"
