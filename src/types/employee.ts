
import { UserRole, Permission } from '@/hooks/usePermissions';

export interface NewEmployee {
  email: string;
  password: string;
  role: UserRole;
}

export interface PermissionDefinition {
  permission: Permission;
  label: string;
  description: string;
}
