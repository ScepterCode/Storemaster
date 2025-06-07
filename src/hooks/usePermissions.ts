
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

export type UserRole = 'owner' | 'manager' | 'cashier' | 'staff';

export type Permission = 
  | 'dashboard_view'
  | 'transactions_view'
  | 'transactions_edit'
  | 'cash_desk_access'
  | 'cash_desk_edit'
  | 'inventory_view'
  | 'inventory_edit'
  | 'reports_view'
  | 'reports_edit'
  | 'settings_view'
  | 'settings_edit'
  | 'user_management'
  | 'admin_access';

// Cache to prevent multiple API calls for the same user
const permissionsCache = new Map<string, { permissions: Permission[], role: UserRole, timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export function usePermissions() {
  const { user } = useAuth();
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [role, setRole] = useState<UserRole>('staff');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    // Check cache first
    const cached = permissionsCache.get(user.id);
    const now = Date.now();
    
    if (cached && (now - cached.timestamp) < CACHE_DURATION) {
      console.log('Using cached permissions for user:', user.id);
      setPermissions(cached.permissions);
      setRole(cached.role);
      setLoading(false);
      return;
    }

    console.log('Fetching permissions for user:', user.id);
    fetchUserPermissions();
  }, [user?.id]);

  const fetchUserPermissions = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      setError(null);

      // Get user role
      const { data: roleData, error: roleError } = await supabase
        .rpc('get_user_role', { _user_id: user.id });

      if (roleError) {
        throw new Error(`Failed to get user role: ${roleError.message}`);
      }

      const userRole = roleData || 'staff';
      console.log('User role:', userRole);

      // Define role-based permissions - Updated to give staff more access
      const rolePermissions: Record<UserRole, Permission[]> = {
        owner: [
          'dashboard_view',
          'transactions_view',
          'transactions_edit',
          'cash_desk_access',
          'cash_desk_edit',
          'inventory_view',
          'inventory_edit',
          'reports_view',
          'reports_edit',
          'settings_view',
          'settings_edit',
          'user_management',
          'admin_access'
        ],
        manager: [
          'dashboard_view',
          'transactions_view',
          'transactions_edit',
          'cash_desk_access',
          'cash_desk_edit',
          'inventory_view',
          'inventory_edit',
          'reports_view',
          'reports_edit',
          'settings_view'
        ],
        cashier: [
          'dashboard_view',
          'cash_desk_access',
          'cash_desk_edit',
          'transactions_view',
          'inventory_view',
          'reports_view',
          'settings_view'
        ],
        staff: [
          'dashboard_view',
          'cash_desk_access',
          'cash_desk_edit',
          'transactions_view',
          'inventory_view',
          'reports_view',
          'settings_view'
        ]
      };

      const userPermissions = rolePermissions[userRole as UserRole] || rolePermissions.staff;
      
      console.log('Final permissions:', userPermissions);
      
      // Cache the permissions
      permissionsCache.set(user.id, {
        permissions: userPermissions,
        role: userRole as UserRole,
        timestamp: Date.now()
      });
      
      setPermissions(userPermissions);
      setRole(userRole as UserRole);
    } catch (err) {
      console.error('Error fetching permissions:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      
      // Fallback to enhanced staff permissions
      const fallbackPermissions: Permission[] = [
        'dashboard_view',
        'cash_desk_access',
        'cash_desk_edit',
        'transactions_view',
        'inventory_view',
        'reports_view',
        'settings_view'
      ];
      setPermissions(fallbackPermissions);
      setRole('staff');
    } finally {
      setLoading(false);
    }
  };

  const hasPermission = (permission: Permission): boolean => {
    return permissions.includes(permission);
  };

  const hasAnyPermission = (permissionList: Permission[]): boolean => {
    return permissionList.some(permission => permissions.includes(permission));
  };

  const clearCache = () => {
    if (user?.id) {
      permissionsCache.delete(user.id);
    }
  };

  // Convenience methods
  const canEditCashDesk = hasPermission('cash_desk_edit');
  const canViewReports = hasPermission('reports_view');

  return {
    permissions,
    role,
    loading,
    error,
    hasPermission,
    hasAnyPermission,
    canEditCashDesk,
    canViewReports,
    refetch: fetchUserPermissions,
    clearCache
  };
}
