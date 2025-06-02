import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

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

export const usePermissions = () => {
  const { user } = useAuth();
  const [role, setRole] = useState<UserRole | null>(null);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!user) {
      setRole(null);
      setPermissions([]);
      setLoading(false);
      return;
    }
    
    const fetchUserRole = async () => {
      try {
        setLoading(true);
        console.log('Fetching user role for:', user.id);
        
        // Get user role
        const { data: roleData, error: roleError } = await supabase.rpc(
          'get_user_role',
          { _user_id: user.id }
        );
        
        if (roleError) {
          console.warn('Error fetching user role:', roleError);
          // If role fetch fails, give default permissions
          setRole('staff');
          setPermissions(['dashboard_view', 'cash_desk_access', 'transactions_view', 'inventory_view']);
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
          console.warn('Error fetching role permissions:', permissionsError);
          // If permissions fetch fails, give basic permissions
          setPermissions(['dashboard_view', 'cash_desk_access', 'transactions_view', 'inventory_view']);
          setLoading(false);
          return;
        }
        
        // Get user-specific permissions
        const { data: userPermissions, error: userPermissionsError } = await supabase
          .from('user_permissions')
          .select('permission, granted')
          .eq('user_id', user.id);
          
        if (userPermissionsError) {
          console.warn('Error fetching user permissions:', userPermissionsError);
        }
        
        // Combine permissions: start with role permissions
        let effectivePermissions = rolePermissions?.map(rp => rp.permission as Permission) || [];
        
        // If no role permissions found, give basic permissions
        if (effectivePermissions.length === 0) {
          effectivePermissions = ['dashboard_view', 'cash_desk_access', 'transactions_view', 'inventory_view'];
        }
        
        // Apply user-specific overrides if they exist
        if (userPermissions) {
          userPermissions.forEach(up => {
            if (up.granted && !effectivePermissions.includes(up.permission)) {
              effectivePermissions.push(up.permission as Permission);
            } else if (!up.granted) {
              effectivePermissions = effectivePermissions.filter(p => p !== up.permission);
            }
          });
        }
        
        console.log('Final effective permissions:', effectivePermissions);
        setPermissions(effectivePermissions);
      } catch (error) {
        console.error('Error fetching permissions:', error);
        // On any error, provide basic permissions so user can still navigate
        setRole('staff');
        setPermissions(['dashboard_view', 'cash_desk_access', 'transactions_view', 'inventory_view']);
        toast.error('Failed to load user permissions, using default permissions');
      } finally {
        setLoading(false);
      }
    };
    
    fetchUserRole();
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
