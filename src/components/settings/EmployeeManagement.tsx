
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { UserRole, Permission } from '@/hooks/usePermissions';
import { UserPlus, Save } from 'lucide-react';
import { NewEmployee } from '@/types/employee';
import { useEmployeeCreation } from '@/hooks/useEmployeeCreation';
import EmployeeForm from './EmployeeForm';
import PermissionsSection from './PermissionsSection';

const EmployeeManagement = () => {
  const [newEmployee, setNewEmployee] = useState<NewEmployee>({
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
  const { createEmployee, isCreating } = useEmployeeCreation();

  const handleCreateEmployee = async () => {
    const success = await createEmployee(newEmployee, customPermissions);
    
    if (success) {
      // Reset form
      setNewEmployee({ email: '', password: '', role: 'staff' });
      setCustomPermissions(initialPermissions);
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
          <EmployeeForm 
            newEmployee={newEmployee}
            onEmployeeChange={setNewEmployee}
          />

          <PermissionsSection
            customPermissions={customPermissions}
            onPermissionChange={handlePermissionChange}
          />

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
