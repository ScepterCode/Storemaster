/**
 * Admin Users Management Page
 * 
 * Page for super admins to manage other admin users
 */

import React, { useState, useEffect } from 'react';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Shield, ShieldCheck, Trash2, Plus, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface AdminUser {
  id: string;
  email: string;
  is_super_admin: boolean;
  permissions: string[];
  last_login_at?: string;
  created_at: string;
}

const AdminUsersPage = () => {
  const { isSuperAdmin, loading: authLoading } = useAdminAuth();
  const { toast } = useToast();
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [isSuperAdminFlag, setIsSuperAdminFlag] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!authLoading && isSuperAdmin) {
      loadAdmins();
    }
  }, [authLoading, isSuperAdmin]);

  const loadAdmins = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.rpc('list_admin_users' as any);

      if (error) throw error;

      setAdmins((data as any) || []);
    } catch (error: any) {
      console.error('Error loading admins:', error);
      toast({
        title: 'Error',
        description: 'Failed to load admin users',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newAdminEmail) {
      toast({
        title: 'Error',
        description: 'Please enter an email address',
        variant: 'destructive',
      });
      return;
    }

    try {
      setSubmitting(true);

      const permissions = isSuperAdminFlag
        ? ['manage_organizations', 'view_analytics', 'manage_subscriptions', 'manage_admins', 'view_audit_logs', 'manage_users']
        : ['manage_organizations', 'view_analytics'];

      const { data, error } = await supabase.rpc('make_user_admin' as any, {
        user_email: newAdminEmail,
        is_super_admin_flag: isSuperAdminFlag,
        admin_permissions: permissions,
      });

      if (error) throw error;

      toast({
        title: 'Success',
        description: `${newAdminEmail} is now an admin`,
      });

      setNewAdminEmail('');
      setIsSuperAdminFlag(false);
      setShowAddForm(false);
      loadAdmins();
    } catch (error: any) {
      console.error('Error adding admin:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to add admin user',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemoveAdmin = async (email: string) => {
    if (!confirm(`Are you sure you want to remove admin privileges from ${email}?`)) {
      return;
    }

    try {
      const { error } = await supabase.rpc('remove_admin_privileges' as any, {
        user_email: email,
      });

      if (error) throw error;

      toast({
        title: 'Success',
        description: `Removed admin privileges from ${email}`,
      });

      loadAdmins();
    } catch (error: any) {
      console.error('Error removing admin:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to remove admin privileges',
        variant: 'destructive',
      });
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isSuperAdmin) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-muted-foreground">
            <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Only super admins can manage admin users.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Admin Users</h2>
          <p className="text-muted-foreground">
            Manage platform administrators
          </p>
        </div>
        <Button onClick={() => setShowAddForm(!showAddForm)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Admin
        </Button>
      </div>

      {/* Add Admin Form */}
      {showAddForm && (
        <Card>
          <CardHeader>
            <CardTitle>Add New Admin</CardTitle>
            <CardDescription>
              Grant admin privileges to an existing user
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddAdmin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">User Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="user@example.com"
                  value={newAdminEmail}
                  onChange={(e) => setNewAdminEmail(e.target.value)}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  The user must already have an account
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="superadmin"
                  checked={isSuperAdminFlag}
                  onChange={(e) => setIsSuperAdminFlag(e.target.checked)}
                  className="rounded"
                />
                <Label htmlFor="superadmin" className="cursor-pointer">
                  Make Super Admin (can manage other admins)
                </Label>
              </div>

              <div className="flex gap-2">
                <Button type="submit" disabled={submitting}>
                  {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Add Admin
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowAddForm(false);
                    setNewAdminEmail('');
                    setIsSuperAdminFlag(false);
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Admin List */}
      <Card>
        <CardHeader>
          <CardTitle>Current Admins ({admins.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {admins.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No admin users found
              </p>
            ) : (
              admins.map((admin) => (
                <div
                  key={admin.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center gap-4">
                    {admin.is_super_admin ? (
                      <ShieldCheck className="h-8 w-8 text-primary" />
                    ) : (
                      <Shield className="h-8 w-8 text-muted-foreground" />
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{admin.email}</p>
                        {admin.is_super_admin && (
                          <Badge variant="default">Super Admin</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Added {new Date(admin.created_at).toLocaleDateString()}
                        {admin.last_login_at && (
                          <> • Last login {new Date(admin.last_login_at).toLocaleDateString()}</>
                        )}
                      </p>
                      <div className="flex gap-1 mt-1">
                        {admin.permissions.map((perm) => (
                          <Badge key={perm} variant="outline" className="text-xs">
                            {perm}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveAdmin(admin.email)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminUsersPage;
