
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
        
        // Get user role
        const { data: roleData, error: roleError } = await supabase.rpc(
          'get_user_role',
          { _user_id: user.id }
        );
        
        if (roleError) throw roleError;
        setRole(roleData as UserRole);
        
        // Get role permissions
        const { data: rolePermissions, error: permissionsError } = await supabase
          .from('role_permissions')
          .select('permission')
          .eq('role', roleData);
          
        if (permissionsError) throw permissionsError;
        
        // Get user-specific permissions
        const { data: userPermissions, error: userPermissionsError } = await supabase
          .from('user_permissions')
          .select('permission, granted')
          .eq('user_id', user.id);
          
        if (userPermissionsError) throw userPermissionsError;
        
        // Combine permissions: start with role permissions
        let effectivePermissions = rolePermissions.map(rp => rp.permission as Permission);
        
        // Apply user-specific overrides
        userPermissions.forEach(up => {
          if (up.granted && !effectivePermissions.includes(up.permission)) {
            effectivePermissions.push(up.permission as Permission);
          } else if (!up.granted) {
            effectivePermissions = effectivePermissions.filter(p => p !== up.permission);
          }
        });
        
        setPermissions(effectivePermissions);
      } catch (error) {
        console.error('Error fetching permissions:', error);
        toast.error('Failed to load user permissions');
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
