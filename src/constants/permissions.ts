
import { PermissionDefinition } from '@/types/employee';

export const AVAILABLE_PERMISSIONS: PermissionDefinition[] = [
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
