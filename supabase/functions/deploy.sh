#!/bin/bash

# Deployment script for Supabase Edge Functions
# This script deploys the Flutterwave webhook handler

set -e

echo "🚀 Deploying Flutterwave Webhook Edge Function..."

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI is not installed"
    echo "Install it with: npm install -g supabase"
    exit 1
fi

# Check if project is linked
if [ ! -f ".supabase/config.toml" ]; then
    echo "❌ Supabase project not linked"
    echo "Link your project with: supabase link --project-ref your-project-ref"
    exit 1
fi

# Deploy the webhook function
echo "📦 Deploying flutterwave-webhook function..."
supabase functions deploy flutterwave-webhook

# Check if deployment was successful
if [ $? -eq 0 ]; then
    echo "✅ Function deployed successfully!"
    echo ""
    echo "📝 Next steps:"
    echo "1. Set your environment variables:"
    echo "   supabase secrets set FLUTTERWAVE_SECRET_HASH=your_secret_hash"
    echo ""
    echo "2. Get your function URL:"
    echo "   supabase functions list"
    echo ""
    echo "3. Configure the webhook URL in Flutterwave Dashboard:"
    echo "   Settings > Webhooks > Add your function URL"
    echo ""
    echo "4. Select these webhook events:"
    echo "   - charge.completed"
    echo "   - charge.failed"
    echo "   - subscription.cancelled"
    echo "   - subscription.expired"
else
    echo "❌ Deployment failed"
    exit 1
fi
