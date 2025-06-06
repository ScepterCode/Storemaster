
import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { UserIcon, Trash2Icon } from 'lucide-react';
import { UserRole, Permission } from '@/hooks/usePermissions';
import { UserWithRole, RolePermission } from '@/types/userManagement';

interface EditUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedUser: UserWithRole | null;
  userPermissions: Record<Permission, boolean>;
  allPermissions: RolePermission[];
  onUpdateUserRole: (userId: string, role: UserRole) => void;
  onUpdatePermission: (permission: Permission, granted: boolean) => void;
  onDeleteUser: (userId: string) => void;
}

const EditUserDialog = ({ 
  open, 
  onOpenChange, 
  selectedUser, 
  userPermissions, 
  allPermissions,
  onUpdateUserRole,
  onUpdatePermission,
  onDeleteUser
}: EditUserDialogProps) => {
  if (!selectedUser) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <UserIcon className="mr-2 h-5 w-5" />
            {selectedUser.email}
          </DialogTitle>
          <DialogDescription>
            Manage user role and permissions
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-6 py-4">
          <div className="grid gap-2">
            <Label>User Role</Label>
            <Select
              value={selectedUser.role}
              onValueChange={(value) => onUpdateUserRole(selectedUser.id, value as UserRole)}
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
                    onCheckedChange={(checked) => onUpdatePermission(p.permission, checked)}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
        
        <DialogFooter className="flex items-center justify-between">
          <Button
            variant="destructive"
            onClick={() => onDeleteUser(selectedUser.id)}
            className="mr-auto"
          >
            <Trash2Icon className="h-4 w-4 mr-2" />
            Delete User
          </Button>
          
          <Button onClick={() => onOpenChange(false)}>
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditUserDialog;
