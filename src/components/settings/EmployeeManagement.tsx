
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { UserRole, Permission } from '@/hooks/usePermissions';
import { UserPlus, Save } from 'lucide-react';
import { Database } from '@/integrations/supabase/types';

type DatabasePermission = Database['public']['Enums']['permission_type'];

const AVAILABLE_PERMISSIONS: { permission: Permission; label: string; description: string }[] = [
  { permission: 'dashboard_view', label: 'Dashboard View', description: 'View dashboard and analytics' },
  { permission: 'cash_desk_access', label: 'Cash Desk Access', description: 'Access the point of sale system' },
  { permission: 'cash_desk_edit', label: 'Cash Desk Edit', description: 'Modify cash desk transactions' },
  { permission: 'transactions_view', label: 'View Transactions', description: 'View transaction history' },
  { permission: 'transactions_edit', label: 'Edit Transactions', description: 'Modify transaction records' },
  { permission: 'inventory_view', label: 'View Inventory', description: 'View products and stock levels' },
  { permission: 'inventory_edit', label: 'Edit Inventory', description: 'Add, edit, and delete products' },
  { permission: 'reports_view', label: 'View Reports', description: 'Access business reports and analytics' },
  { permission: 'reports_edit', label: 'Edit Reports', description: 'Modify and create reports' },
  { permission: 'settings_view', label: 'View Settings', description: 'Access application settings' },
  { permission: 'settings_edit', label: 'Edit Settings', description: 'Modify application configuration' },
  { permission: 'user_management', label: 'User Management', description: 'Manage staff accounts and permissions' },
  { permission: 'admin_access', label: 'Admin Access', description: 'Full administrative access' },
];

const EmployeeManagement = () => {
  const [newEmployee, setNewEmployee] = useState({
    email: '',
    password: '',
    role: 'staff' as UserRole,
  });
  
  // Initialize with proper type - all permissions set to false by default
  const initialPermissions: Record<Permission, boolean> = {
    dashboard_view: false,
    cash_desk_access: false,
    cash_desk_edit: false,
    transactions_view: false,
    transactions_edit: false,
    inventory_view: false,
    inventory_edit: false,
    reports_view: false,
    reports_edit: false,
    settings_view: false,
    settings_edit: false,
    user_management: false,
    admin_access: false,
  };
  
  const [customPermissions, setCustomPermissions] = useState<Record<Permission, boolean>>(initialPermissions);
  const [isCreating, setIsCreating] = useState(false);

  const handleCreateEmployee = async () => {
    if (!newEmployee.email || !newEmployee.password) {
      toast.error('Email and password are required');
      return;
    }

    try {
      setIsCreating(true);

      // Create the user account
      const { data: userData, error: userError } = await supabase.auth.admin.createUser({
        email: newEmployee.email,
        password: newEmployee.password,
        email_confirm: true,
      });

      if (userError) throw userError;

      // Set the user role
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({
          user_id: userData.user.id,
          role: newEmployee.role,
        });

      if (roleError) throw roleError;

      // Set custom permissions if any - filter and cast to database types
      const permissionsToSet = Object.entries(customPermissions)
        .filter(([_, granted]) => granted)
        .map(([permission]) => ({
          user_id: userData.user.id,
          permission: permission as DatabasePermission,
          granted: true,
        }));

      if (permissionsToSet.length > 0) {
        const { error: permError } = await supabase
          .from('user_permissions')
          .insert(permissionsToSet);

        if (permError) throw permError;
      }

      toast.success('Employee account created successfully');
      
      // Reset form
      setNewEmployee({ email: '', password: '', role: 'staff' });
      setCustomPermissions(initialPermissions);

    } catch (error) {
      console.error('Error creating employee:', error);
      toast.error('Failed to create employee account');
    } finally {
      setIsCreating(false);
    }
  };

  const handlePermissionChange = (permission: Permission, granted: boolean) => {
    setCustomPermissions(prev => ({
      ...prev,
      [permission]: granted,
    }));
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <UserPlus className="mr-2 h-5 w-5" />
            Create Employee Account
          </CardTitle>
          <CardDescription>
            Add a new staff member and configure their access permissions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="employee-email">Email Address</Label>
              <Input
                id="employee-email"
                type="email"
                placeholder="employee@company.com"
                value={newEmployee.email}
                onChange={(e) => setNewEmployee(prev => ({ ...prev, email: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="employee-password">Temporary Password</Label>
              <Input
                id="employee-password"
                type="password"
                placeholder="Enter a secure password"
                value={newEmployee.password}
                onChange={(e) => setNewEmployee(prev => ({ ...prev, password: e.target.value }))}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="employee-role">Role</Label>
            <Select
              value={newEmployee.role}
              onValueChange={(value) => setNewEmployee(prev => ({ ...prev, role: value as UserRole }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="staff">Staff</SelectItem>
                <SelectItem value="cashier">Cashier</SelectItem>
                <SelectItem value="manager">Manager</SelectItem>
                <SelectItem value="owner">Owner</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              Role determines the default set of permissions for this employee
            </p>
          </div>

          <Separator />

          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-sm">Additional Permissions</h4>
              <p className="text-sm text-muted-foreground">
                Grant specific permissions beyond the default role permissions
              </p>
            </div>
            
            <div className="grid gap-4">
              {AVAILABLE_PERMISSIONS.map((perm) => (
                <div key={perm.permission} className="flex items-center justify-between space-x-2">
                  <div className="flex-1">
                    <Label className="text-sm font-medium">{perm.label}</Label>
                    <p className="text-xs text-muted-foreground">{perm.description}</p>
                  </div>
                  <Switch
                    checked={customPermissions[perm.permission] || false}
                    onCheckedChange={(checked) => handlePermissionChange(perm.permission, checked)}
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <Button onClick={handleCreateEmployee} disabled={isCreating}>
              <Save className="mr-2 h-4 w-4" />
              {isCreating ? 'Creating...' : 'Create Employee'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EmployeeManagement;
