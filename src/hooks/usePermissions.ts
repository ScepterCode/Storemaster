
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export type Permission = 
  | 'dashboard_view'
  | 'cash_desk_access'
  | 'cash_desk_edit'
  | 'transactions_view'
  | 'transactions_edit'
  | 'inventory_view'
  | 'inventory_edit'
  | 'reports_view'
  | 'settings_view'
  | 'settings_edit'
  | 'user_management';

export type UserRole = 'owner' | 'manager' | 'cashier' | 'staff';

export interface UserPermission {
  permission: Permission;
  granted: boolean;
}

// Default permissions that every authenticated user should have
const DEFAULT_PERMISSIONS: Permission[] = [
  'dashboard_view',
  'cash_desk_access',
  'cash_desk_edit',
  'transactions_view',
  'inventory_view',
  'reports_view',
  'settings_view'
];

export const usePermissions = () => {
  const { user } = useAuth();
  const [role, setRole] = useState<UserRole | null>(null);
  const [permissions, setPermissions] = useState<Permission[]>(DEFAULT_PERMISSIONS);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (!user) {
      setRole(null);
      setPermissions([]);
      setLoading(false);
      return;
    }

    // Always start with default permissions for authenticated users
    setPermissions(DEFAULT_PERMISSIONS);
    
    const fetchPermissions = async () => {
      try {
        setLoading(true);
        console.log('Fetching permissions for user:', user.id);
        
        // Get user role with timeout
        const rolePromise = supabase.rpc('get_user_role', { _user_id: user.id });
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), 5000)
        );
        
        const { data: roleData, error: roleError } = await Promise.race([
          rolePromise,
          timeoutPromise
        ]) as any;
        
        if (roleError) {
          console.warn('Role fetch failed, using default:', roleError);
          setRole('staff');
          setLoading(false);
          return;
        }
        
        console.log('User role:', roleData);
        setRole(roleData as UserRole);
        
        // Get role permissions
        const { data: rolePermissions, error: permissionsError } = await supabase
          .from('role_permissions')
          .select('permission')
          .eq('role', roleData);
          
        if (permissionsError) {
          console.warn('Permissions fetch failed, keeping defaults:', permissionsError);
          setLoading(false);
          return;
        }
        
        // Get user-specific permissions
        const { data: userPermissions } = await supabase
          .from('user_permissions')
          .select('permission, granted')
          .eq('user_id', user.id);
        
        // Build final permissions list
        let finalPermissions = [...DEFAULT_PERMISSIONS];
        
        // Add role permissions
        if (rolePermissions?.length > 0) {
          rolePermissions.forEach(rp => {
            const permission = rp.permission as Permission;
            if (!finalPermissions.includes(permission)) {
              finalPermissions.push(permission);
            }
          });
        }
        
        // Apply user-specific overrides
        if (userPermissions?.length > 0) {
          userPermissions.forEach(up => {
            const permission = up.permission as Permission;
            if (up.granted && !finalPermissions.includes(permission)) {
              finalPermissions.push(permission);
            } else if (!up.granted) {
              finalPermissions = finalPermissions.filter(p => p !== permission);
            }
          });
        }
        
        console.log('Final permissions:', finalPermissions);
        setPermissions(finalPermissions);
      } catch (error) {
        console.error('Error fetching permissions:', error);
        // On any error, provide basic permissions so user can still navigate
        setRole('staff');
      } finally {
        setLoading(false);
      }
    };
    
    fetchPermissions();
  }, [user]);
  
  const hasPermission = (permission: Permission): boolean => {
    return permissions.includes(permission);
  };
  
  const canAccessCashDesk = (): boolean => hasPermission('cash_desk_access');
  const canEditCashDesk = (): boolean => hasPermission('cash_desk_edit');
  const canViewTransactions = (): boolean => hasPermission('transactions_view');
  const canEditTransactions = (): boolean => hasPermission('transactions_edit');
  const canViewInventory = (): boolean => hasPermission('inventory_view');
  const canEditInventory = (): boolean => hasPermission('inventory_edit');
  const canViewReports = (): boolean => hasPermission('reports_view');
  const canViewSettings = (): boolean => hasPermission('settings_view');
  const canEditSettings = (): boolean => hasPermission('settings_edit');
  const canManageUsers = (): boolean => hasPermission('user_management');
  
  return {
    role,
    permissions,
    loading,
    hasPermission,
    canAccessCashDesk,
    canEditCashDesk,
    canViewTransactions,
    canEditTransactions,
    canViewInventory,
    canEditInventory,
    canViewReports,
    canViewSettings,
    canEditSettings,
    canManageUsers
  };
};
