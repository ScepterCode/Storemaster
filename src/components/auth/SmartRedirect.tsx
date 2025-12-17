/**
 * Smart Redirect Component
 * 
 * Redirects authenticated users to the appropriate dashboard:
 * - System admins → /admin
 * - Regular users with organization → /dashboard
 * - Users without organization → /onboarding/setup
 */

import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useOrganization } from '@/contexts/OrganizationContext';
import { supabase } from '@/integrations/supabase/client';

const SmartRedirect: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const { organization, loading: orgLoading } = useOrganization();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!user) {
        setIsAdmin(false);
        setChecking(false);
        return;
      }

      try {
        const { data } = await supabase
          .from('admin_users' as any)
          .select('id')
          .eq('id', user.id)
          .maybeSingle();

        setIsAdmin(!!data);
      } catch (err) {
        console.error('Error checking admin status:', err);
        setIsAdmin(false);
      } finally {
        setChecking(false);
      }
    };

    if (!authLoading && !orgLoading) {
      checkAdminStatus();
    }
  }, [user, authLoading, orgLoading]);

  // Show loading state
  if (authLoading || orgLoading || checking) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Not logged in - stay on landing page
  if (!user) {
    return null; // Landing page will show
  }

  // System admin - redirect to admin dashboard
  if (isAdmin) {
    return <Navigate to="/admin" replace />;
  }

  // Has organization - redirect to dashboard
  if (organization) {
    return <Navigate to="/dashboard" replace />;
  }

  // No organization - redirect to onboarding
  return <Navigate to="/onboarding/setup" replace />;
};

export default SmartRedirect;
