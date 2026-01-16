/**
 * Quick Database Fix Script
 * 
 * This script fixes the immediate console errors by ensuring
 * the user has proper organization setup
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://lynrucsoxywacywkxjgc.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'your-anon-key';

const supabase = createClient(supabaseUrl, supabaseKey);

const USER_ID = 'f9fd317d-5a0d-4eee-a4f2-adeab3c4e0c8';

async function fixUserOrganization() {
  try {
    console.log('🔧 Fixing user organization setup...');
    
    // Check if user has organization membership
    const { data: membership, error: memberError } = await supabase
      .from('organization_members')
      .select('organization_id, organizations!inner(id, name)')
      .eq('user_id', USER_ID)
      .eq('is_active', true)
      .single();

    if (memberError && memberError.code !== 'PGRST116') {
      throw memberError;
    }

    if (membership) {
      console.log('✅ User already has organization:', membership.organizations.name);
      return membership.organization_id;
    }

    console.log('📝 Creating organization for user...');
    
    // Create organization
    const { data: newOrg, error: createError } = await supabase
      .from('organizations')
      .insert({
        name: 'Default Organization',
        slug: `org-${Date.now()}`,
        subscription_tier: 'free',
        is_active: true
      })
      .select()
      .single();

    if (createError) {
      throw createError;
    }

    console.log('✅ Created organization:', newOrg.name);

    // Add user as owner
    const { error: membershipError } = await supabase
      .from('organization_members')
      .insert({
        organization_id: newOrg.id,
        user_id: USER_ID,
        role: 'owner',
        is_active: true
      });

    if (membershipError) {
      throw membershipError;
    }

    console.log('✅ Added user as organization owner');

    // Update existing data
    const tables = ['products', 'categories', 'customers', 'invoices', 'transactions'];
    
    for (const table of tables) {
      const { data, error } = await supabase
        .from(table)
        .update({ organization_id: newOrg.id })
        .eq('user_id', USER_ID)
        .is('organization_id', null)
        .select('id');

      if (error) {
        console.warn(`⚠️ Warning updating ${table}:`, error.message);
      } else if (data && data.length > 0) {
        console.log(`✅ Updated ${data.length} ${table} records`);
      }
    }

    console.log('🎉 Organization setup complete!');
    return newOrg.id;

  } catch (error) {
    console.error('❌ Error fixing organization:', error);
    throw error;
  }
}

// Run the fix
fixUserOrganization()
  .then(() => {
    console.log('✅ Database fix completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Database fix failed:', error);
    process.exit(1);
  });