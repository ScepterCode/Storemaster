/**
 * Organization Context
 * 
 * Provides organization data and methods throughout the application
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Organization, OrganizationMember } from '@/types/admin';

interface OrganizationContextType {
  organization: Organization | null;
  membership: OrganizationMember | null;
  loading: boolean;
  error: Error | null;
  refreshOrganization: () => Promise<void>;
  isOwner: boolean;
  isAdmin: boolean;
  canManageUsers: boolean;
}

const OrganizationContext = createContext<OrganizationContextType | undefined>(undefined);

export const OrganizationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [membership, setMembership] = useState<OrganizationMember | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchOrganization = async () => {
    if (!user) {
      setOrganization(null);
      setMembership(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Get user's organization membership
      const { data: memberData, error: memberError } = await supabase
        .from('organization_members')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .maybeSingle();

      if (memberError) {
        throw memberError;
      }

      if (!memberData) {
        // No organization membership found
        setOrganization(null);
        setMembership(null);
        setLoading(false);
        return;
      }

      setMembership(memberData as OrganizationMember);

      // Get organization details
      const { data: orgData, error: orgError } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', memberData.organization_id)
        .single();

      if (orgError) {
        throw orgError;
      }

      setOrganization(orgData as Organization);
    } catch (err) {
      console.error('Error fetching organization:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch organization'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrganization();
  }, [user]);

  const refreshOrganization = async () => {
    await fetchOrganization();
  };

  const isOwner = membership?.role === 'owner';
  const isAdmin = membership?.role === 'owner' || membership?.role === 'admin';
  const canManageUsers = isAdmin;

  return (
    <OrganizationContext.Provider
      value={{
        organization,
        membership,
        loading,
        error,
        refreshOrganization,
        isOwner,
        isAdmin,
        canManageUsers,
      }}
    >
      {children}
    </OrganizationContext.Provider>
  );
};

export const useOrganization = () => {
  const context = useContext(OrganizationContext);
  if (context === undefined) {
    throw new Error('useOrganization must be used within an OrganizationProvider');
  }
  return context;
};
