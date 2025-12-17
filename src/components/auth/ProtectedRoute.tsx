
import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useOrganization } from '@/contexts/OrganizationContext';
import { usePermissions, Permission } from '@/hooks/usePermissions';
import { supabase } from '@/integrations/supabase/client';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredPermission?: Permission;
  skipOrganizationCheck?: boolean; // For onboarding routes
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredPermission,
  skipOrganizationCheck = false
}) => {
  const { user, loading: authLoading } = useAuth();
  const { organization, loading: orgLoading } = useOrganization();
  const { hasPermission, loading: permissionsLoading } = usePermissions();
  const location = useLocation();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [adminCheckLoading, setAdminCheckLoading] = useState(true);
  const [hasCheckedRedirect, setHasCheckedRedirect] = useState(false);

  // Check if user is a system admin
  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!user) {
        setIsAdmin(false);
        setAdminCheckLoading(false);
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
        setAdminCheckLoading(false);
      }
    };

    checkAdminStatus();
  }, [user]);

  // Wait for loading to complete
  if (authLoading || adminCheckLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  // No user - redirect to login
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If explicitly skipping organization check (onboarding routes), allow access
  if (skipOrganizationCheck) {
    return <>{children}</>;
  }

  // System admins bypass organization check
  if (isAdmin) {
    return <>{children}</>;
  }

  // Check permission if required (only if we have permissions loaded)
  if (requiredPermission && !permissionsLoading && !hasPermission(requiredPermission)) {
    return <Navigate to="/unauthorized" replace />;
  }

  // Allow access - organization check is handled elsewhere
  return <>{children}</>;
};

export default ProtectedRoute;
