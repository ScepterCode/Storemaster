
import React, { useState } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import UserManagement from '@/components/settings/UserManagement';
import { usePermissions } from '@/hooks/usePermissions';

const SettingsPage = () => {
  const [businessName, setBusinessName] = useState('Aba Business');
  const [language, setLanguage] = useState('en');
  const [offlineMode, setOfflineMode] = useState(true);
  const [syncOnConnect, setSyncOnConnect] = useState(true);
  const { canManageUsers, canEditSettings } = usePermissions();
  
  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Settings</h1>
            <p className="text-muted-foreground">Configure your business preferences</p>
          </div>
        </div>
        
        <Tabs defaultValue="general">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-5 h-12 mb-4">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="appearance">Appearance</TabsTrigger>
            <TabsTrigger value="account">Account</TabsTrigger>
            <TabsTrigger value="data">Data & Sync</TabsTrigger>
            {canManageUsers && (
              <TabsTrigger value="staff">Staff Management</TabsTrigger>
            )}
          </TabsList>
          
          <TabsContent value="general" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Business Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="business-name">Business Name</Label>
                  <Input
                    id="business-name"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    disabled={!canEditSettings}
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="language">Language</Label>
                  <Select value={language} onValueChange={setLanguage} disabled={!canEditSettings}>
                    <SelectTrigger id="language">
                      <SelectValue placeholder="Select language" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="ig">Igbo</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    The language setting requires Supabase connection to fully enable translations.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="appearance" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Theme Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="theme">Theme</Label>
                  <Select defaultValue="light" disabled={!canEditSettings}>
                    <SelectTrigger id="theme">
                      <SelectValue placeholder="Select theme" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">Light</SelectItem>
                      <SelectItem value="dark">Dark</SelectItem>
                      <SelectItem value="system">System</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="account" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Account Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">
                  Connect to Supabase to enable user accounts and multi-user access.
                </p>
                <Button variant="outline">Connect to Supabase</Button>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="data" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Offline Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="offline-mode">Enable Offline Mode</Label>
                    <p className="text-xs text-muted-foreground">
                      Allow the app to function when internet is unavailable
                    </p>
                  </div>
                  <Switch
                    id="offline-mode"
                    checked={offlineMode}
                    onCheckedChange={setOfflineMode}
                    disabled={!canEditSettings}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="auto-sync">Sync Automatically</Label>
                    <p className="text-xs text-muted-foreground">
                      Automatically sync data when internet connection is restored
                    </p>
                  </div>
                  <Switch
                    id="auto-sync"
                    checked={syncOnConnect}
                    onCheckedChange={setSyncOnConnect}
                    disabled={!offlineMode || !canEditSettings}
                  />
                </div>
                
                <div className="pt-4">
                  <Button variant="outline" disabled={!canEditSettings}>Export Data</Button>
                  <p className="text-xs text-muted-foreground mt-2">
                    Data export functionality requires Supabase connection.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {canManageUsers && (
            <TabsContent value="staff" className="space-y-4">
              <UserManagement />
            </TabsContent>
          )}
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default SettingsPage;
