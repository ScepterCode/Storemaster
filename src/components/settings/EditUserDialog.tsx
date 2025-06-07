
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { UserWithRole, RolePermission } from '@/types/userManagement';
import { UserRole, Permission } from '@/hooks/usePermissions';
import { Trash2 } from 'lucide-react';

interface EditUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedUser: UserWithRole | null;
  userPermissions: Permission[];
  allPermissions: RolePermission[];
  onUpdateUserRole: (userId: string, role: UserRole) => void;
  onUpdatePermission: (permission: Permission, enabled: boolean) => void;
  onDeleteUser: (userId: string) => void;
}

const EditUserDialog: React.FC<EditUserDialogProps> = ({
  open,
  onOpenChange,
  selectedUser,
  userPermissions,
  allPermissions,
  onUpdateUserRole,
  onUpdatePermission,
  onDeleteUser
}) => {
  if (!selectedUser) return null;

  const handleRoleChange = (newRole: UserRole) => {
    onUpdateUserRole(selectedUser.id, newRole);
  };

  const handleDeleteUser = () => {
    onDeleteUser(selectedUser.id);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Manage User: {selectedUser.email}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div>
            <label className="text-sm font-medium">Role</label>
            <Select
              value={selectedUser.role}
              onValueChange={handleRoleChange}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="staff">Staff</SelectItem>
                <SelectItem value="cashier">Cashier</SelectItem>
                <SelectItem value="manager">Manager</SelectItem>
                <SelectItem value="owner">Owner</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium">Permissions</label>
            <div className="space-y-2 mt-2">
              {allPermissions.map((perm) => (
                <div key={perm.permission} className="flex items-center justify-between">
                  <div>
                    <div className="text-sm">{perm.permission.replace('_', ' ')}</div>
                    <div className="text-xs text-muted-foreground">{perm.description}</div>
                  </div>
                  <Badge variant={userPermissions.includes(perm.permission) ? "default" : "secondary"}>
                    {userPermissions.includes(perm.permission) ? "Enabled" : "Disabled"}
                  </Badge>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-between">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm">
                  <Trash2 className="h-4 w-4 mr-1" />
                  Delete User
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete User</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete {selectedUser.email}? This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDeleteUser}>Delete</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <Button onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditUserDialog;
