
import React from 'react';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Permission } from '@/hooks/usePermissions';
import { AVAILABLE_PERMISSIONS } from '@/constants/permissions';

interface PermissionsSectionProps {
  customPermissions: Record<Permission, boolean>;
  onPermissionChange: (permission: Permission, granted: boolean) => void;
}

const PermissionsSection = ({ customPermissions, onPermissionChange }: PermissionsSectionProps) => {
  return (
    <>
      <Separator />
      <div className="space-y-4">
        <div>
          <h4 className="font-medium text-sm">Additional Permissions</h4>
          <p className="text-sm text-muted-foreground">
            Grant specific permissions beyond the default role permissions
          </p>
        </div>
        
        <div className="grid gap-4">
          {AVAILABLE_PERMISSIONS.map((perm) => (
            <div key={perm.permission} className="flex items-center justify-between space-x-2">
              <div className="flex-1">
                <Label className="text-sm font-medium">{perm.label}</Label>
                <p className="text-xs text-muted-foreground">{perm.description}</p>
              </div>
              <Switch
                checked={customPermissions[perm.permission] || false}
                onCheckedChange={(checked) => onPermissionChange(perm.permission, checked)}
              />
            </div>
          ))}
        </div>
      </div>
    </>
  );
};

export default PermissionsSection;
