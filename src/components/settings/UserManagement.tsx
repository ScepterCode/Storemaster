
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusIcon } from 'lucide-react';
import { useUserManagement } from '@/hooks/useUserManagement';
import UsersTable from './UsersTable';
import AddUserDialog from './AddUserDialog';
import EditUserDialog from './EditUserDialog';

const UserManagement = () => {
  const [showNewUserDialog, setShowNewUserDialog] = useState(false);
  const [showEditUserDialog, setShowEditUserDialog] = useState(false);

  const {
    users,
    loading,
    selectedUser,
    setSelectedUser,
    newUser,
    setNewUser,
    userPermissions,
    availablePermissions,
    handleAddUser,
    handleUpdateUserRole,
    handleUpdatePermission,
    handleDeleteUser,
  } = useUserManagement();

  const openEditUser = (user: any) => {
    setSelectedUser(user);
    setShowEditUserDialog(true);
  };

  const handleAddUserAndClose = async () => {
    await handleAddUser();
    setShowNewUserDialog(false);
  };

  const handleDeleteUserAndClose = async (userId: string) => {
    await handleDeleteUser(userId);
    setShowEditUserDialog(false);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>User Management</CardTitle>
            <CardDescription>Manage staff accounts and permissions</CardDescription>
          </div>
          <Button onClick={() => setShowNewUserDialog(true)}>
            <PlusIcon className="mr-2 h-4 w-4" />
            Add User
          </Button>
        </CardHeader>
        <CardContent>
          <UsersTable 
            users={users}
            loading={loading}
            onEditUser={openEditUser}
          />
        </CardContent>
      </Card>

      <AddUserDialog
        open={showNewUserDialog}
        onOpenChange={setShowNewUserDialog}
        newUser={newUser}
        onNewUserChange={setNewUser}
        onAddUser={handleAddUserAndClose}
      />

      <EditUserDialog
        open={showEditUserDialog}
        onOpenChange={setShowEditUserDialog}
        selectedUser={selectedUser}
        userPermissions={userPermissions}
        allPermissions={availablePermissions}
        onUpdateUserRole={handleUpdateUserRole}
        onUpdatePermission={handleUpdatePermission}
        onDeleteUser={handleDeleteUserAndClose}
      />
    </div>
  );
};

export default UserManagement;
