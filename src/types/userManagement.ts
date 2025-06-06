
import { UserRole, Permission } from '@/hooks/usePermissions';

export interface UserWithRole {
  id: string;
  email: string;
  role: UserRole;
  created_at: string;
}

export interface RolePermission {
  permission: Permission;
  description: string;
}

export interface NewUserForm {
  email: string;
  password: string;
  role: UserRole;
}
