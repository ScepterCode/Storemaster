
import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { UserCog } from 'lucide-react';
import { UserRole } from '@/hooks/usePermissions';
import { UserWithRole } from '@/types/userManagement';

interface UsersTableProps {
  users: UserWithRole[];
  loading: boolean;
  onEditUser: (user: UserWithRole) => void;
}

const UsersTable = ({ users, loading, onEditUser }: UsersTableProps) => {
  const getRoleBadgeColor = (role: UserRole) => {
    switch (role) {
      case 'owner': return 'bg-purple-500 hover:bg-purple-600';
      case 'manager': return 'bg-blue-500 hover:bg-blue-600';
      case 'cashier': return 'bg-green-500 hover:bg-green-600';
      case 'staff': return 'bg-gray-500 hover:bg-gray-600';
      default: return 'bg-gray-500 hover:bg-gray-600';
    }
  };

  if (loading) {
    return <div className="text-center py-4">Loading users...</div>;
  }

  return (
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
                onClick={() => onEditUser(user)}
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
  );
};

export default UsersTable;
