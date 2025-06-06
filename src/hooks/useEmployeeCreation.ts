
import { useState } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { UserRole, Permission } from '@/hooks/usePermissions';
import { NewEmployee } from '@/types/employee';
import { Database } from '@/integrations/supabase/types';

type DatabasePermission = Database['public']['Enums']['permission_type'];

export const useEmployeeCreation = () => {
  const [isCreating, setIsCreating] = useState(false);

  const createEmployee = async (
    newEmployee: NewEmployee,
    customPermissions: Record<Permission, boolean>
  ) => {
    if (!newEmployee.email || !newEmployee.password) {
      toast.error('Email and password are required');
      return false;
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
      return true;

    } catch (error) {
      console.error('Error creating employee:', error);
      toast.error('Failed to create employee account');
      return false;
    } finally {
      setIsCreating(false);
    }
  };

  return {
    createEmployee,
    isCreating,
  };
};
