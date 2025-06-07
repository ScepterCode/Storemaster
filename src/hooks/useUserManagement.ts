
import { useState, useEffect } from 'react';
import { UserWithRole, NewUserForm, RolePermission } from '@/types/userManagement';
import { UserRole, Permission } from '@/hooks/usePermissions';
import { getStoredItems, storeItem, STORAGE_KEYS } from '@/lib/offlineStorage';
import { useToast } from '@/hooks/use-toast';

export const useUserManagement = () => {
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<UserWithRole | null>(null);
  const [newUser, setNewUser] = useState<NewUserForm>({
    email: '',
    password: '',
    role: 'staff'
  });
  const [userPermissions, setUserPermissions] = useState<Permission[]>([]);
  const { toast } = useToast();

  const availablePermissions: RolePermission[] = [
    { permission: 'dashboard_view', description: 'View dashboard and analytics' },
    { permission: 'inventory_edit', description: 'Add, edit, and delete inventory items' },
    { permission: 'inventory_view', description: 'View inventory and stock levels' },
    { permission: 'transactions_edit', description: 'Create and edit transactions' },
    { permission: 'transactions_view', description: 'View transaction history' },
    { permission: 'cash_desk_access', description: 'Access point of sale system' },
    { permission: 'reports_view', description: 'View business reports' },
    { permission: 'settings_edit', description: 'Manage system settings' },
    { permission: 'settings_view', description: 'View system settings' },
    { permission: 'user_management', description: 'Manage user accounts and permissions' }
  ];

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    if (selectedUser) {
      loadUserPermissions(selectedUser.role);
    }
  }, [selectedUser]);

  const loadUsers = () => {
    try {
      const storedUsers = getStoredItems<UserWithRole>(STORAGE_KEYS.USERS) || [];
      setUsers(storedUsers);
    } catch (error) {
      console.error('Error loading users:', error);
      toast({
        title: "Error",
        description: "Failed to load users",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadUserPermissions = (role: UserRole) => {
    const rolePermissions: Record<UserRole, Permission[]> = {
      'owner': [
        'dashboard_view', 'inventory_edit', 'inventory_view', 
        'transactions_edit', 'transactions_view', 'cash_desk_access',
        'reports_view', 'settings_edit', 'settings_view', 'user_management'
      ],
      'manager': [
        'dashboard_view', 'inventory_edit', 'inventory_view',
        'transactions_view', 'cash_desk_access', 'reports_view',
        'settings_view'
      ],
      'cashier': [
        'dashboard_view', 'cash_desk_access', 'transactions_view',
        'inventory_view', 'reports_view', 'settings_view'
      ],
      'staff': [
        'dashboard_view', 'cash_desk_access', 'transactions_view',
        'inventory_view', 'reports_view', 'settings_view'
      ]
    };

    setUserPermissions(rolePermissions[role] || []);
  };

  const handleAddUser = async () => {
    try {
      if (!newUser.email || !newUser.password) {
        toast({
          title: "Error",
          description: "Email and password are required",
          variant: "destructive"
        });
        return false;
      }

      const existingUsers = getStoredItems<UserWithRole>(STORAGE_KEYS.USERS) || [];
      const emailExists = existingUsers.some(user => user.email === newUser.email);
      
      if (emailExists) {
        toast({
          title: "Error",
          description: "User with this email already exists",
          variant: "destructive"
        });
        return false;
      }

      const user: UserWithRole = {
        id: crypto.randomUUID(),
        email: newUser.email,
        role: newUser.role,
        created_at: new Date().toISOString()
      };

      const updatedUsers = [...existingUsers, user];
      storeItem(STORAGE_KEYS.USERS, updatedUsers);
      setUsers(updatedUsers);
      
      setNewUser({ email: '', password: '', role: 'staff' });
      
      toast({
        title: "Success",
        description: "User added successfully"
      });
      
      return true;
    } catch (error) {
      console.error('Error adding user:', error);
      toast({
        title: "Error",
        description: "Failed to add user",
        variant: "destructive"
      });
      return false;
    }
  };

  const handleUpdateUserRole = async (userId: string, role: UserRole) => {
    try {
      const existingUsers = getStoredItems<UserWithRole>(STORAGE_KEYS.USERS) || [];
      const updatedUsers = existingUsers.map(user =>
        user.id === userId ? { ...user, role } : user
      );
      
      storeItem(STORAGE_KEYS.USERS, updatedUsers);
      setUsers(updatedUsers);
      
      if (selectedUser && selectedUser.id === userId) {
        setSelectedUser({ ...selectedUser, role });
      }
      
      toast({
        title: "Success",
        description: "User role updated successfully"
      });
    } catch (error) {
      console.error('Error updating user role:', error);
      toast({
        title: "Error",
        description: "Failed to update user role",
        variant: "destructive"
      });
    }
  };

  const handleUpdatePermission = async (permission: Permission, enabled: boolean) => {
    // This would typically update individual permissions
    // For now, permissions are role-based
    console.log('Permission update:', permission, enabled);
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      const existingUsers = getStoredItems<UserWithRole>(STORAGE_KEYS.USERS) || [];
      const updatedUsers = existingUsers.filter(user => user.id !== userId);
      
      storeItem(STORAGE_KEYS.USERS, updatedUsers);
      setUsers(updatedUsers);
      
      toast({
        title: "Success",
        description: "User deleted successfully"
      });
    } catch (error) {
      console.error('Error deleting user:', error);
      toast({
        title: "Error",
        description: "Failed to delete user",
        variant: "destructive"
      });
    }
  };

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
    handleDeleteUser
  };
};
