
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useNotifications } from '@/contexts/NotificationContext';
import { toast } from 'sonner';

const NotificationSettings = () => {
  const { settings, updateSettings, addNotification } = useNotifications();

  const handleSettingChange = (key: string, value: any) => {
    updateSettings({ [key]: value });
    toast.success('Notification settings updated');
  };

  const handleQuietHoursChange = (key: string, value: any) => {
    updateSettings({
      quietHours: {
        ...settings.quietHours,
        [key]: value,
      },
    });
  };

  const sendTestNotification = () => {
    addNotification({
      title: 'Test Notification',
      message: 'This is a test notification to verify your settings are working correctly.',
      type: 'info',
    });
    toast.success('Test notification sent!');
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Notification Preferences</CardTitle>
          <CardDescription>
            Configure how you want to receive notifications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="in-app">In-App Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Show notifications in the application
              </p>
            </div>
            <Switch
              id="in-app"
              checked={settings.enableInApp}
              onCheckedChange={(checked) => handleSettingChange('enableInApp', checked)}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="push">Push Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Receive push notifications on your device
              </p>
            </div>
            <Switch
              id="push"
              checked={settings.enablePush}
              onCheckedChange={(checked) => handleSettingChange('enablePush', checked)}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="email">Email Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Receive important notifications via email
              </p>
            </div>
            <Switch
              id="email"
              checked={settings.enableEmail}
              onCheckedChange={(checked) => handleSettingChange('enableEmail', checked)}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="sound">Sound Alerts</Label>
              <p className="text-sm text-muted-foreground">
                Play sound when receiving notifications
              </p>
            </div>
            <Switch
              id="sound"
              checked={settings.soundEnabled}
              onCheckedChange={(checked) => handleSettingChange('soundEnabled', checked)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Quiet Hours</CardTitle>
          <CardDescription>
            Set specific hours when you don't want to receive notifications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="quiet-hours">Enable Quiet Hours</Label>
              <p className="text-sm text-muted-foreground">
                Disable notifications during specified hours
              </p>
            </div>
            <Switch
              id="quiet-hours"
              checked={settings.quietHours.enabled}
              onCheckedChange={(checked) => handleQuietHoursChange('enabled', checked)}
            />
          </div>

          {settings.quietHours.enabled && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="quiet-start">Start Time</Label>
                <Input
                  id="quiet-start"
                  type="time"
                  value={settings.quietHours.start}
                  onChange={(e) => handleQuietHoursChange('start', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="quiet-end">End Time</Label>
                <Input
                  id="quiet-end"
                  type="time"
                  value={settings.quietHours.end}
                  onChange={(e) => handleQuietHoursChange('end', e.target.value)}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Test Notifications</CardTitle>
          <CardDescription>
            Send a test notification to verify your settings
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={sendTestNotification} variant="outline">
            Send Test Notification
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default NotificationSettings;
