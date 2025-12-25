
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

const GeneralSettings = () => {
  const { user } = useAuth();
  const [businessName, setBusinessName] = useState('StoreMaster Business');
  const [businessEmail, setBusinessEmail] = useState(user?.email || '');
  const [businessPhone, setBusinessPhone] = useState('');
  const [businessAddress, setBusinessAddress] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [timezone, setTimezone] = useState('UTC');
  const [autoBackup, setAutoBackup] = useState(true);
  const [lowStockAlerts, setLowStockAlerts] = useState(true);
  const [emailReports, setEmailReports] = useState(false);
  const [enableBarcodeScanning, setEnableBarcodeScanning] = useState(true);
  const [autoScanMode, setAutoScanMode] = useState(false);

  const handleSaveGeneral = () => {
    // Here you would typically save to Supabase or local storage
    toast.success('General settings saved successfully');
  };

  const handleExportData = () => {
    toast.info('Data export initiated. You will receive an email when ready.');
  };

  const handleImportData = () => {
    toast.info('Import functionality will be available soon.');
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Business Information</CardTitle>
          <CardDescription>
            Update your business details and contact information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="business-name">Business Name</Label>
              <Input
                id="business-name"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="business-email">Business Email</Label>
              <Input
                id="business-email"
                type="email"
                value={businessEmail}
                onChange={(e) => setBusinessEmail(e.target.value)}
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="business-phone">Business Phone</Label>
              <Input
                id="business-phone"
                value={businessPhone}
                onChange={(e) => setBusinessPhone(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="currency">Currency</Label>
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD ($)</SelectItem>
                  <SelectItem value="EUR">EUR (€)</SelectItem>
                  <SelectItem value="GBP">GBP (£)</SelectItem>
                  <SelectItem value="JPY">JPY (¥)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="business-address">Business Address</Label>
            <Input
              id="business-address"
              value={businessAddress}
              onChange={(e) => setBusinessAddress(e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="timezone">Timezone</Label>
            <Select value={timezone} onValueChange={setTimezone}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="UTC">UTC</SelectItem>
                <SelectItem value="America/New_York">Eastern Time</SelectItem>
                <SelectItem value="America/Chicago">Central Time</SelectItem>
                <SelectItem value="America/Denver">Mountain Time</SelectItem>
                <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                <SelectItem value="Europe/London">London</SelectItem>
                <SelectItem value="Europe/Paris">Paris</SelectItem>
                <SelectItem value="Asia/Tokyo">Tokyo</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>System Preferences</CardTitle>
          <CardDescription>
            Configure system behavior and automation settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="auto-backup">Automatic Backup</Label>
              <p className="text-sm text-muted-foreground">
                Automatically backup your data daily
              </p>
            </div>
            <Switch
              id="auto-backup"
              checked={autoBackup}
              onCheckedChange={setAutoBackup}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="low-stock-alerts">Low Stock Alerts</Label>
              <p className="text-sm text-muted-foreground">
                Get notified when products are running low
              </p>
            </div>
            <Switch
              id="low-stock-alerts"
              checked={lowStockAlerts}
              onCheckedChange={setLowStockAlerts}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="email-reports">Email Reports</Label>
              <p className="text-sm text-muted-foreground">
                Receive weekly business reports via email
              </p>
            </div>
            <Switch
              id="email-reports"
              checked={emailReports}
              onCheckedChange={setEmailReports}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="barcode-scanning">Barcode Scanner</Label>
              <p className="text-sm text-muted-foreground">
                Enable camera-based barcode scanning in cashdesk
              </p>
            </div>
            <Switch
              id="barcode-scanning"
              checked={enableBarcodeScanning}
              onCheckedChange={setEnableBarcodeScanning}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="auto-scan-mode">Auto-Scan Mode</Label>
              <p className="text-sm text-muted-foreground">
                Automatically open scanner when cashdesk loads
              </p>
            </div>
            <Switch
              id="auto-scan-mode"
              checked={autoScanMode}
              onCheckedChange={setAutoScanMode}
              disabled={!enableBarcodeScanning}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Data Management</CardTitle>
          <CardDescription>
            Import, export, and manage your business data
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <Button onClick={handleExportData} variant="outline">
              Export Data
            </Button>
            <Button onClick={handleImportData} variant="outline">
              Import Data
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            Export your data as CSV or JSON files. Import data from other systems.
          </p>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSaveGeneral}>
          Save Changes
        </Button>
      </div>
    </div>
  );
};

export default GeneralSettings;
