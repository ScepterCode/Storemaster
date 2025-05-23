
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { UserRole, Permission } from '@/hooks/usePermissions';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { PlusIcon, Trash2Icon, UserCog, UserIcon } from 'lucide-react';

interface UserWithRole {
  id: string;
  email: string;
  role: UserRole;
  created_at: string;
}

interface RolePermission {
  permission: Permission;
  description: string;
}

const UserManagement = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewUserDialog, setShowNewUserDialog] = useState(false);
  const [showEditUserDialog, setShowEditUserDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserWithRole | null>(null);
  const [newUser, setNewUser] = useState({ email: '', password: '', role: 'staff' as UserRole });
  const [allPermissions, setAllPermissions] = useState<RolePermission[]>([]);
  const [userPermissions, setUserPermissions] = useState<Record<Permission, boolean>>({} as Record<Permission, boolean>);

  // Fetch users with their roles
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        
        // Get all users (this requires admin access in Supabase)
        const { data: userData, error: userError } = await supabase.auth.admin.listUsers();
        
        if (userError) {
          console.error('Error fetching users:', userError);
          toast.error('Failed to load users');
          return;
        }

        // Get user roles
        const { data: roleData, error: roleError } = await supabase
          .from('user_roles')
          .select('user_id, role');
          
        if (roleError) {
          console.error('Error fetching roles:', roleError);
          toast.error('Failed to load user roles');
          return;
        }

        // Map roles to users
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
    
    fetchUsers();
  }, []);

  // Fetch all permissions
  useEffect(() => {
    const fetchPermissions = async () => {
      try {
        const { data, error } = await supabase
          .from('permissions')
          .select('name, description');
          
        if (error) throw error;
        
        setAllPermissions(data.map(p => ({
          permission: p.name as Permission,
          description: p.description || p.name
        })));
      } catch (error) {
        console.error('Error fetching permissions:', error);
        toast.error('Failed to load permissions');
      }
    };
    
    fetchPermissions();
  }, []);

  // Fetch user permissions when a user is selected
  useEffect(() => {
    if (!selectedUser) return;
    
    const fetchUserPermissions = async () => {
      try {
        // Get role permissions
        const { data: rolePermissions, error: roleError } = await supabase
          .from('role_permissions')
          .select('permission')
          .eq('role', selectedUser.role);
          
        if (roleError) throw roleError;
        
        // Get user-specific permissions
        const { data: userPerms, error: userError } = await supabase
          .from('user_permissions')
          .select('permission, granted')
          .eq('user_id', selectedUser.id);
          
        if (userError) throw userError;
        
        // Build permissions object
        const permObj = {} as Record<Permission, boolean>;
        
        // Start with role permissions
        rolePermissions.forEach(rp => {
          permObj[rp.permission as Permission] = true;
        });
        
        // Apply user overrides
        userPerms.forEach(up => {
          permObj[up.permission as Permission] = up.granted;
        });
        
        setUserPermissions(permObj);
      } catch (error) {
        console.error('Error fetching user permissions:', error);
        toast.error('Failed to load user permissions');
      }
    };
    
    fetchUserPermissions();
  }, [selectedUser]);

  const handleAddUser = async () => {
    try {
      if (!newUser.email || !newUser.password) {
        toast.error('Email and password are required');
        return;
      }

      // Create user
      const { data, error } = await supabase.auth.admin.createUser({
        email: newUser.email,
        password: newUser.password,
        email_confirm: true
      });
      
      if (error) throw error;

      // Set role (the trigger we created will set a default role,
      // but we'll update it if the selected role is different)
      if (newUser.role !== 'staff') {
        const { error: roleError } = await supabase
          .from('user_roles')
          .update({ role: newUser.role })
          .eq('user_id', data.user.id);
          
        if (roleError) throw roleError;
      }

      toast.success('User created successfully');
      setShowNewUserDialog(false);
      
      // Add user to the list
      setUsers([...users, {
        id: data.user.id,
        email: data.user.email || '',
        role: newUser.role,
        created_at: data.user.created_at
      }]);
      
      // Reset form
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

      // Update user in state
      setUsers(users.map(u => 
        u.id === userId ? { ...u, role } : u
      ));
      
      if (selectedUser?.id === userId) {
        setSelectedUser({ ...selectedUser, role });
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
      // Check if this is just the default for the role
      const { data: rolePermData, error: rolePermError } = await supabase
        .from('role_permissions')
        .select('permission')
        .eq('role', selectedUser.role)
        .eq('permission', permission);
        
      if (rolePermError) throw rolePermError;
      
      const isDefaultForRole = rolePermData.length > 0;
      
      // If setting to default for role, remove custom permission if it exists
      if ((isDefaultForRole && granted) || (!isDefaultForRole && !granted)) {
        // Delete any custom permission setting as it matches the role default
        const { error: deleteError } = await supabase
          .from('user_permissions')
          .delete()
          .eq('user_id', selectedUser.id)
          .eq('permission', permission);
          
        if (deleteError) throw deleteError;
      } else {
        // Need to override role default
        // Check if custom permission already exists
        const { data: existingPerm, error: existingError } = await supabase
          .from('user_permissions')
          .select('id')
          .eq('user_id', selectedUser.id)
          .eq('permission', permission);
          
        if (existingError) throw existingError;
        
        if (existingPerm.length > 0) {
          // Update existing custom permission
          const { error: updateError } = await supabase
            .from('user_permissions')
            .update({ granted })
            .eq('id', existingPerm[0].id);
            
          if (updateError) throw updateError;
        } else {
          // Create new custom permission
          const { error: insertError } = await supabase
            .from('user_permissions')
            .insert({
              user_id: selectedUser.id,
              permission,
              granted
            });
            
          if (insertError) throw insertError;
        }
      }
      
      // Update local state
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
      
      // Remove user from state
      setUsers(users.filter(u => u.id !== userId));
      
      if (selectedUser?.id === userId) {
        setSelectedUser(null);
        setShowEditUserDialog(false);
      }
      
      toast.success('User deleted successfully');
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error('Failed to delete user');
    }
  };

  const getRoleBadgeColor = (role: UserRole) => {
    switch (role) {
      case 'owner': return 'bg-purple-500 hover:bg-purple-600';
      case 'manager': return 'bg-blue-500 hover:bg-blue-600';
      case 'cashier': return 'bg-green-500 hover:bg-green-600';
      case 'staff': return 'bg-gray-500 hover:bg-gray-600';
      default: return 'bg-gray-500 hover:bg-gray-600';
    }
  };

  const openEditUser = (user: UserWithRole) => {
    setSelectedUser(user);
    setShowEditUserDialog(true);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>User Management</CardTitle>
            <CardDescription>Manage staff accounts and permissions</CardDescription>
          </div>
          <Button onClick={() => setShowNewUserDialog(true)}>
            <PlusIcon className="mr-2 h-4 w-4" />
            Add User
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-4">Loading users...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map(user => (
                  <TableRow key={user.id}>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Badge className={getRoleBadgeColor(user.role)}>
                        {user.role}
                      </Badge>
                    </TableCell>
                    <TableCell>{new Date(user.created_at).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditUser(user)}
                      >
                        <UserCog className="h-4 w-4 mr-1" />
                        Manage
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {users.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-4">No users found</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Add User Dialog */}
      <Dialog open={showNewUserDialog} onOpenChange={setShowNewUserDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add New User</DialogTitle>
            <DialogDescription>
              Create a new staff account with specific permissions.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="email" className="text-right">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={newUser.email}
                onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="password" className="text-right">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                value={newUser.password}
                onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="role" className="text-right">
                Role
              </Label>
              <Select
                value={newUser.role}
                onValueChange={(value) => setNewUser({...newUser, role: value as UserRole})}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="staff">Staff</SelectItem>
                  <SelectItem value="cashier">Cashier</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="owner">Owner</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewUserDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddUser}>
              Create User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={showEditUserDialog} onOpenChange={setShowEditUserDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <UserIcon className="mr-2 h-5 w-5" />
              {selectedUser?.email}
            </DialogTitle>
            <DialogDescription>
              Manage user role and permissions
            </DialogDescription>
          </DialogHeader>
          
          {selectedUser && (
            <div className="grid gap-6 py-4">
              <div className="grid gap-2">
                <Label>User Role</Label>
                <Select
                  value={selectedUser.role}
                  onValueChange={(value) => handleUpdateUserRole(selectedUser.id, value as UserRole)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="staff">Staff</SelectItem>
                    <SelectItem value="cashier">Cashier</SelectItem>
                    <SelectItem value="manager">Manager</SelectItem>
                    <SelectItem value="owner">Owner</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">
                  Changing the role will reset and update all permissions.
                </p>
              </div>
              
              <div className="border-t pt-4">
                <h4 className="font-medium mb-2">Permissions</h4>
                <div className="space-y-4">
                  {allPermissions.map((p) => (
                    <div key={p.permission} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{p.permission.replace(/_/g, ' ')}</p>
                        <p className="text-sm text-muted-foreground">{p.description}</p>
                      </div>
                      <Switch
                        checked={userPermissions[p.permission] || false}
                        onCheckedChange={(checked) => handleUpdatePermission(p.permission, checked)}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter className="flex items-center justify-between">
            <Button
              variant="destructive"
              onClick={() => selectedUser && handleDeleteUser(selectedUser.id)}
              className="mr-auto"
            >
              <Trash2Icon className="h-4 w-4 mr-2" />
              Delete User
            </Button>
            
            <Button onClick={() => setShowEditUserDialog(false)}>
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserManagement;
