
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { UserRole, Permission } from '@/hooks/usePermissions';
import { UserWithRole, RolePermission, NewUserForm } from '@/types/userManagement';
import { Database } from '@/integrations/supabase/types';

type DatabasePermission = Database['public']['Enums']['permission_type'];

export const useUserManagement = () => {
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<UserWithRole | null>(null);
  const [newUser, setNewUser] = useState<NewUserForm>({ email: '', password: '', role: 'staff' });
  const [userPermissions, setUserPermissions] = useState<Record<Permission, boolean>>({} as Record<Permission, boolean>);

  // Define all available permissions
  const availablePermissions: RolePermission[] = [
    { permission: 'dashboard_view', description: 'View dashboard and analytics' },
    { permission: 'transactions_view', description: 'View transaction history' },
    { permission: 'transactions_edit', description: 'Modify transaction records' },
    { permission: 'cash_desk_access', description: 'Access the point of sale system' },
    { permission: 'cash_desk_edit', description: 'Modify cash desk transactions' },
    { permission: 'inventory_view', description: 'View products and stock levels' },
    { permission: 'inventory_edit', description: 'Add, edit, and delete products' },
    { permission: 'reports_view', description: 'Access business reports and analytics' },
    { permission: 'reports_edit', description: 'Modify and create reports' },
    { permission: 'settings_view', description: 'Access application settings' },
    { permission: 'settings_edit', description: 'Modify application configuration' },
    { permission: 'user_management', description: 'Manage staff accounts and permissions' },
    { permission: 'admin_access', description: 'Full administrative access' },
  ];

  // Fetch users with their roles
  const fetchUsers = async () => {
    try {
      setLoading(true);
      
      const { data: userData, error: userError } = await supabase.auth.admin.listUsers();
      
      if (userError) {
        console.error('Error fetching users:', userError);
        toast.error('Failed to load users');
        return;
      }

      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('user_id, role');
        
      if (roleError) {
        console.error('Error fetching roles:', roleError);
        toast.error('Failed to load user roles');
        return;
      }

      const usersWithRoles = userData.users.map(u => {
        const userRole = roleData.find(r => r.user_id === u.id);
        return {
          id: u.id,
          email: u.email || '',
          role: (userRole?.role || 'staff') as UserRole,
          created_at: u.created_at
        };
      });
      
      setUsers(usersWithRoles);
    } catch (error) {
      console.error('Error in fetchUsers:', error);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  // Fetch user permissions when a user is selected
  const fetchUserPermissions = async (user: UserWithRole) => {
    try {
      const { data: rolePermissions, error: roleError } = await supabase
        .from('role_permissions')
        .select('permission')
        .eq('role', user.role);
        
      if (roleError) throw roleError;
      
      const { data: userPerms, error: userError } = await supabase
        .from('user_permissions')
        .select('permission, granted')
        .eq('user_id', user.id);
        
      if (userError) throw userError;
      
      const permObj = {} as Record<Permission, boolean>;
      
      rolePermissions.forEach(rp => {
        permObj[rp.permission as Permission] = true;
      });
      
      userPerms.forEach(up => {
        permObj[up.permission as Permission] = up.granted;
      });
      
      setUserPermissions(permObj);
    } catch (error) {
      console.error('Error fetching user permissions:', error);
      toast.error('Failed to load user permissions');
    }
  };

  const handleAddUser = async () => {
    try {
      if (!newUser.email || !newUser.password) {
        toast.error('Email and password are required');
        return;
      }

      const { data, error } = await supabase.auth.admin.createUser({
        email: newUser.email,
        password: newUser.password,
        email_confirm: true
      });
      
      if (error) throw error;

      if (newUser.role !== 'staff') {
        const { error: roleError } = await supabase
          .from('user_roles')
          .update({ role: newUser.role })
          .eq('user_id', data.user.id);
          
        if (roleError) throw roleError;
      }

      toast.success('User created successfully');
      
      setUsers([...users, {
        id: data.user.id,
        email: data.user.email || '',
        role: newUser.role,
        created_at: data.user.created_at
      }]);
      
      setNewUser({ email: '', password: '', role: 'staff' });
      
    } catch (error) {
      console.error('Error creating user:', error);
      toast.error('Failed to create user');
    }
  };

  const handleUpdateUserRole = async (userId: string, role: UserRole) => {
    try {
      const { error } = await supabase
        .from('user_roles')
        .update({ role })
        .eq('user_id', userId);
        
      if (error) throw error;

      setUsers(users.map(u => 
        u.id === userId ? { ...u, role } : u
      ));
      
      if (selectedUser?.id === userId) {
        const updatedUser = { ...selectedUser, role };
        setSelectedUser(updatedUser);
        fetchUserPermissions(updatedUser);
      }
      
      toast.success('User role updated');
    } catch (error) {
      console.error('Error updating user role:', error);
      toast.error('Failed to update user role');
    }
  };

  const handleUpdatePermission = async (permission: Permission, granted: boolean) => {
    if (!selectedUser) return;
    
    try {
      const { data: rolePermData, error: rolePermError } = await supabase
        .from('role_permissions')
        .select('permission')
        .eq('role', selectedUser.role)
        .eq('permission', permission as DatabasePermission);
        
      if (rolePermError) throw rolePermError;
      
      const isDefaultForRole = rolePermData.length > 0;
      
      if ((isDefaultForRole && granted) || (!isDefaultForRole && !granted)) {
        const { error: deleteError } = await supabase
          .from('user_permissions')
          .delete()
          .eq('user_id', selectedUser.id)
          .eq('permission', permission as DatabasePermission);
          
        if (deleteError) throw deleteError;
      } else {
        const { data: existingPerm, error: existingError } = await supabase
          .from('user_permissions')
          .select('id')
          .eq('user_id', selectedUser.id)
          .eq('permission', permission as DatabasePermission);
          
        if (existingError) throw existingError;
        
        if (existingPerm.length > 0) {
          const { error: updateError } = await supabase
            .from('user_permissions')
            .update({ granted })
            .eq('id', existingPerm[0].id);
            
          if (updateError) throw updateError;
        } else {
          const { error: insertError } = await supabase
            .from('user_permissions')
            .insert({
              user_id: selectedUser.id,
              permission: permission as DatabasePermission,
              granted
            });
            
          if (insertError) throw insertError;
        }
      }
      
      setUserPermissions({
        ...userPermissions,
        [permission]: granted
      });
      
      toast.success('Permission updated');
    } catch (error) {
      console.error('Error updating permission:', error);
      toast.error('Failed to update permission');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }
    
    try {
      const { error } = await supabase.auth.admin.deleteUser(userId);
      if (error) throw error;
      
      setUsers(users.filter(u => u.id !== userId));
      
      if (selectedUser?.id === userId) {
        setSelectedUser(null);
      }
      
      toast.success('User deleted successfully');
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error('Failed to delete user');
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    if (selectedUser) {
      fetchUserPermissions(selectedUser);
    }
  }, [selectedUser]);

  return {
    users,
    loading,
    selectedUser,
    setSelectedUser,
    newUser,
    setNewUser,
    userPermissions,
    availablePermissions,
    handleAddUser,
    handleUpdateUserRole,
    handleUpdatePermission,
    handleDeleteUser,
  };
};
