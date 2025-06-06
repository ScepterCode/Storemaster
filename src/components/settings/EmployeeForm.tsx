
import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UserRole } from '@/hooks/usePermissions';
import { NewEmployee } from '@/types/employee';

interface EmployeeFormProps {
  newEmployee: NewEmployee;
  onEmployeeChange: (employee: NewEmployee) => void;
}

const EmployeeForm = ({ newEmployee, onEmployeeChange }: EmployeeFormProps) => {
  return (
    <>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="employee-email">Email Address</Label>
          <Input
            id="employee-email"
            type="email"
            placeholder="employee@company.com"
            value={newEmployee.email}
            onChange={(e) => onEmployeeChange({ ...newEmployee, email: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="employee-password">Temporary Password</Label>
          <Input
            id="employee-password"
            type="password"
            placeholder="Enter a secure password"
            value={newEmployee.password}
            onChange={(e) => onEmployeeChange({ ...newEmployee, password: e.target.value })}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="employee-role">Role</Label>
        <Select
          value={newEmployee.role}
          onValueChange={(value) => onEmployeeChange({ ...newEmployee, role: value as UserRole })}
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
    </>
  );
};

export default EmployeeForm;
