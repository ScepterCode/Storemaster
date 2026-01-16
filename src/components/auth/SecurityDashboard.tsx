/**
 * Security Dashboard Component
 * 
 * Provides users with security management features:
 * - MFA setup and management
 * - Trusted device management
 * - Security event monitoring
 * - Password management
 * - Session management
 */

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Shield, 
  Smartphone, 
  Monitor, 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  Key,
  Eye,
  Trash2,
  RefreshCw
} from 'lucide-react';
import { useEnhancedAuth } from '@/contexts/EnhancedAuthContext';
import { useToast } from '@/components/ui/use-toast';

const SecurityDashboard: React.FC = () => {
  const {
    user,
    mfaEnabled,
    trustedDevices,
    securityEvents,
    enableMFA,
    disableMFA,
    trustDevice,
    revokeDevice,
    changePassword,
    checkSuspiciousActivity,
    extendSession,
    getSessionTimeRemaining
  } = useEnhancedAuth();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [mfaCode, setMfaCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [mfaSetup, setMfaSetup] = useState<{ secret: string; qrCode: string } | null>(null);
  
  const { toast } = useToast();

  const handleEnableMFA = async () => {
    try {
      setLoading(true);
      const setup = await enableMFA();
      setMfaSetup(setup);
      toast({
        title: "MFA Setup",
        description: "Scan the QR code with your authenticator app",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDisableMFA = async () => {
    try {
      setLoading(true);
      await disableMFA(mfaCode);
      setMfaCode('');
      toast({
        title: "MFA Disabled",
        description: "Multi-factor authentication has been disabled",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmNewPassword) {
      toast({
        title: "Error",
        description: "New passwords do not match",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      await changePassword(currentPassword, newPassword);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRevokeDevice = async (deviceId: string) => {
    try {
      await revokeDevice(deviceId);
      toast({
        title: "Device Revoked",
        description: "Device access has been revoked",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short'
    }).format(date);
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'login': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'logout': return <CheckCircle className="h-4 w-4 text-blue-500" />;
      case 'failed_login': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'password_change': return <Key className="h-4 w-4 text-yellow-500" />;
      case 'mfa_enabled': return <Shield className="h-4 w-4 text-green-500" />;
      default: return <Eye className="h-4 w-4 text-gray-500" />;
    }
  };

  const sessionTimeRemaining = getSessionTimeRemaining();
  const sessionMinutesRemaining = Math.floor(sessionTimeRemaining / (1000 * 60));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Security Dashboard</h2>
          <p className="text-muted-foreground">
            Manage your account security and monitor activity
          </p>
        </div>
        <Badge variant={mfaEnabled ? "default" : "secondary"} className="flex items-center gap-1">
          <Shield className="h-3 w-3" />
          {mfaEnabled ? "MFA Enabled" : "MFA Disabled"}
        </Badge>
      </div>

      {/* Session Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Session Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">
                Session expires in {sessionMinutesRemaining} minutes
              </p>
              <p className="text-xs text-muted-foreground">
                Logged in as: {user?.email}
              </p>
            </div>
            <Button onClick={extendSession} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Extend Session
            </Button>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="mfa" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="mfa">MFA</TabsTrigger>
          <TabsTrigger value="devices">Devices</TabsTrigger>
          <TabsTrigger value="password">Password</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        {/* MFA Management */}
        <TabsContent value="mfa">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Smartphone className="h-5 w-5" />
                Multi-Factor Authentication
              </CardTitle>
              <CardDescription>
                Add an extra layer of security to your account
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!mfaEnabled ? (
                <div className="space-y-4">
                  <Alert>
                    <Shield className="h-4 w-4" />
                    <AlertDescription>
                      MFA is not enabled. Enable it now to secure your account.
                    </AlertDescription>
                  </Alert>
                  <Button onClick={handleEnableMFA} disabled={loading}>
                    Enable MFA
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <Alert>
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription>
                      MFA is enabled and protecting your account.
                    </AlertDescription>
                  </Alert>
                  <div className="space-y-2">
                    <Label htmlFor="mfaCode">Enter MFA code to disable</Label>
                    <div className="flex gap-2">
                      <Input
                        id="mfaCode"
                        type="text"
                        placeholder="123456"
                        value={mfaCode}
                        onChange={(e) => setMfaCode(e.target.value)}
                        maxLength={6}
                      />
                      <Button 
                        onClick={handleDisableMFA} 
                        disabled={loading || !mfaCode}
                        variant="destructive"
                      >
                        Disable MFA
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {mfaSetup && (
                <div className="space-y-4 p-4 border rounded-lg">
                  <h4 className="font-medium">Setup Instructions</h4>
                  <ol className="text-sm space-y-2 list-decimal list-inside">
                    <li>Install an authenticator app (Google Authenticator, Authy, etc.)</li>
                    <li>Scan this QR code with your app</li>
                    <li>Enter the 6-digit code to verify setup</li>
                  </ol>
                  <div className="bg-white p-4 rounded border">
                    <img src={mfaSetup.qrCode} alt="MFA QR Code" className="mx-auto" />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Secret key: {mfaSetup.secret}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Trusted Devices */}
        <TabsContent value="devices">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Monitor className="h-5 w-5" />
                Trusted Devices
              </CardTitle>
              <CardDescription>
                Manage devices that can access your account
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {trustedDevices.length === 0 ? (
                  <p className="text-muted-foreground">No trusted devices found</p>
                ) : (
                  trustedDevices.map((device) => (
                    <div key={device.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{device.name}</p>
                        <p className="text-sm text-muted-foreground">
                          Last seen: {formatDate(device.lastSeen)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {device.ip}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={device.trusted ? "default" : "secondary"}>
                          {device.trusted ? "Trusted" : "Untrusted"}
                        </Badge>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleRevokeDevice(device.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Password Management */}
        <TabsContent value="password">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                Change Password
              </CardTitle>
              <CardDescription>
                Update your password to keep your account secure
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Current Password</Label>
                <Input
                  id="currentPassword"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmNewPassword">Confirm New Password</Label>
                <Input
                  id="confirmNewPassword"
                  type="password"
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                />
              </div>
              <Button 
                onClick={handleChangePassword} 
                disabled={loading || !currentPassword || !newPassword || !confirmNewPassword}
              >
                Change Password
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Activity */}
        <TabsContent value="activity">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Security Activity
              </CardTitle>
              <CardDescription>
                Recent security events for your account
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {securityEvents.length === 0 ? (
                  <p className="text-muted-foreground">No recent activity</p>
                ) : (
                  securityEvents.slice(0, 10).map((event, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 border rounded-lg">
                      {getEventIcon(event.type)}
                      <div className="flex-1">
                        <p className="font-medium capitalize">
                          {event.type.replace('_', ' ')}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {formatDate(event.timestamp)}
                        </p>
                        {event.ip && (
                          <p className="text-xs text-muted-foreground">
                            IP: {event.ip}
                          </p>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SecurityDashboard;