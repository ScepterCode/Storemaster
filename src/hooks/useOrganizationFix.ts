/**
 * Organization Fix Hook
 * 
 * Temporary fix to ensure users have proper organization setup
 * This addresses the console errors with null organization_id queries
 */

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface OrganizationData {
  id: string;
  name: string;
  slug: string;
}

export const useOrganizationFix = () => {
  const { user } = useAuth();
  const [organization, setOrganization] = useState<OrganizationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const ensureUserHasOrganization = async () => {
      try {
        setLoading(true);
        setError(null);

        // First, check if user has an organization membership
        const { data: membershipData, error: membershipError } = await supabase
          .from('organization_members')
          .select(`
            organization_id,
            role,
            organizations!inner(id, name, slug)
          `)
          .eq('user_id', user.id)
          .eq('is_active', true)
          .single();

        if (membershipError && membershipError.code !== 'PGRST116') {
          throw membershipError;
        }

        if (membershipData && membershipData.organizations) {
          // User has organization
          setOrganization({
            id: membershipData.organizations.id,
            name: membershipData.organizations.name,
            slug: membershipData.organizations.slug
          });
        } else {
          // User doesn't have organization, create one
          console.log('Creating organization for user:', user.email);
          
          const orgName = `${user.email?.split('@')[0] || 'User'}'s Organization`;
          const orgSlug = `org-${user.id.replace(/-/g, '').substring(0, 16)}`;

          // Create organization
          const { data: newOrg, error: createOrgError } = await supabase
            .from('organizations')
            .insert({
              name: orgName,
              slug: orgSlug,
              subscription_tier: 'free',
              is_active: true
            })
            .select()
            .single();

          if (createOrgError) {
            throw createOrgError;
          }

          // Add user as owner
          const { error: memberError } = await supabase
            .from('organization_members')
            .insert({
              organization_id: newOrg.id,
              user_id: user.id,
              role: 'owner',
              is_active: true
            });

          if (memberError) {
            throw memberError;
          }

          // Update existing data to have organization_id
          const updatePromises = [
            supabase.from('products').update({ organization_id: newOrg.id }).eq('user_id', user.id).is('organization_id', null),
            supabase.from('categories').update({ organization_id: newOrg.id }).eq('user_id', user.id).is('organization_id', null),
            supabase.from('customers').update({ organization_id: newOrg.id }).eq('user_id', user.id).is('organization_id', null),
            supabase.from('invoices').update({ organization_id: newOrg.id }).eq('user_id', user.id).is('organization_id', null),
            supabase.from('transactions').update({ organization_id: newOrg.id }).eq('user_id', user.id).is('organization_id', null)
          ];

          await Promise.all(updatePromises);

          setOrganization({
            id: newOrg.id,
            name: newOrg.name,
            slug: newOrg.slug
          });

          console.log('Created organization:', newOrg.name);
        }
      } catch (err) {
        console.error('Error ensuring organization:', err);
        setError(err instanceof Error ? err.message : 'Failed to setup organization');
      } finally {
        setLoading(false);
      }
    };

    ensureUserHasOrganization();
  }, [user]);

  return {
    organization,
    loading,
    error,
    hasOrganization: !!organization
  };
};