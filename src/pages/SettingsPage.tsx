
import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AppLayout from '@/components/layout/AppLayout';
import UserManagement from '@/components/settings/UserManagement';
import NotificationSettings from '@/components/settings/NotificationSettings';
import GeneralSettings from '@/components/settings/GeneralSettings';
import EmployeeManagement from '@/components/settings/EmployeeManagement';
import { usePermissions } from '@/hooks/usePermissions';

const SettingsPage = () => {
  const [searchParams] = useSearchParams();
  const { hasPermission, role } = usePermissions();
  const [activeTab, setActiveTab] = useState('general');

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  // Show employee management to owners, managers, or users with explicit user_management permission
  const canManageEmployees = role === 'owner' || role === 'manager' || hasPermission('user_management');

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">
            Manage your application settings and preferences.
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList>
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            {canManageEmployees && (
              <>
                <TabsTrigger value="employees">Add Employee</TabsTrigger>
                <TabsTrigger value="users">User Management</TabsTrigger>
              </>
            )}
          </TabsList>

          <TabsContent value="general" className="space-y-4">
            <GeneralSettings />
          </TabsContent>

          <TabsContent value="notifications" className="space-y-4">
            <NotificationSettings />
          </TabsContent>

          {canManageEmployees && (
            <>
              <TabsContent value="employees" className="space-y-4">
                <EmployeeManagement />
              </TabsContent>
              
              <TabsContent value="users" className="space-y-4">
                <UserManagement />
              </TabsContent>
            </>
          )}
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default SettingsPage;
