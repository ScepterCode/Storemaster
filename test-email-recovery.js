// Quick test script to check if password recovery emails are sent
// Run with: node test-email-recovery.js

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://lynrucsoxywacywkxjgc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx5bnJ1Y3NveHl3YWN5d2t4amdjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc2MDgzMzYsImV4cCI6MjA2MzE4NDMzNn0.54YviCbZM37T1wuv2_EVoyZVeRfQCOKH6cNydziwjNQ';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testPasswordRecovery() {
  console.log('Testing password recovery email...');
  
  // Replace with a test email address
  const testEmail = 'test@example.com';
  
  try {
    const { data, error } = await supabase.auth.resetPasswordForEmail(testEmail, {
      redirectTo: `${process.env.VITE_APP_URL || 'http://localhost:5173'}/reset-password`,
    });

    if (error) {
      console.error('❌ Error sending recovery email:', error.message);
      console.error('Error details:', error);
      return false;
    }

    console.log('✅ Recovery email request sent successfully!');
    console.log('Response:', data);
    console.log('\nNote: Check the following:');
    console.log('1. Supabase Dashboard > Authentication > Email Templates');
    console.log('2. Supabase Dashboard > Project Settings > Auth > SMTP Settings');
    console.log('3. Check spam folder if using real email');
    console.log('4. In development, emails may be logged in Supabase logs instead of sent');
    
    return true;
  } catch (err) {
    console.error('❌ Unexpected error:', err);
    return false;
  }
}

testPasswordRecovery();
