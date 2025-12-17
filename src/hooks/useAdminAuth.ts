/**
 * useAdminAuth Hook
 * 
 * Hook for checking admin authentication and permissions
 */

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { AdminUser } from '@/types/admin';

export const useAdminAuth = () => {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [adminData, setAdminData] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!user) {
        setIsAdmin(false);
        setIsSuperAdmin(false);
        setAdminData(null);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const { data, error: fetchError } = await supabase
          .from('admin_users')
          .select('*')
          .eq('id', user.id)
          .single();

        if (fetchError) {
          if (fetchError.code === 'PGRST116') {
            // No admin record found - user is not an admin
            setIsAdmin(false);
            setIsSuperAdmin(false);
            setAdminData(null);
          } else {
            throw fetchError;
          }
        } else if (data) {
          setIsAdmin(true);
          setIsSuperAdmin(data.is_super_admin || false);
          setAdminData(data as AdminUser);

          // Update last login time
          await supabase
            .from('admin_users')
            .update({ last_login_at: new Date().toISOString() })
            .eq('id', user.id);
        }
      } catch (err) {
        console.error('Error checking admin status:', err);
        setError(err instanceof Error ? err : new Error('Failed to check admin status'));
        setIsAdmin(false);
        setIsSuperAdmin(false);
        setAdminData(null);
      } finally {
        setLoading(false);
      }
    };

    checkAdminStatus();
  }, [user]);

  const hasPermission = (permission: string): boolean => {
    if (!adminData) return false;
    if (isSuperAdmin) return true; // Super admins have all permissions
    return adminData.permissions.includes(permission);
  };

  return {
    isAdmin,
    isSuperAdmin,
    adminData,
    loading,
    error,
    hasPermission,
  };
};
