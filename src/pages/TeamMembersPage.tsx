/**
 * Team Members Page
 * 
 * Display and manage organization team members
 * Requirements: 2.1, 2.2, 2.3, 2.4
 */

import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import AppLayout from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  UserPlus, 
  Mail, 
  Trash2, 
  Loader2,
  Users,
  Clock,
  CheckCircle,
  XCircle,
  RefreshCw,
  Shield
} from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { UserRole } from '@/hooks/usePermissions';
import { supabase } from '@/integrations/supabase/client';

interface TeamMembersProps {
  embedded?: boolean;
}

export default function TeamMembersPage({ embedded = false }: TeamMembersProps) {
  const { organization, canManageUsers } = useOrganization();
  
  const [members, setMembers] = useState<OrganizationMember[]>([]);
  const [invitations, setInvitations] = useState<TeamInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Dialog states
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<OrganizationRole>('member');
  const [submitting, setSubmitting] = useState(false);
  
  // Employee role management states
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<OrganizationMember | null>(null);
  const [newEmployeeRole, setNewEmployeeRole] = useState<UserRole>('staff');
  const [updatingRole, setUpdatingRole] = useState(false);

  useEffect(() => {
    if (organization) {
      loadData();
    }
  }, [organization]);

  const loadData = async () => {
    if (!organization) return;

    try {
      setLoading(true);
      
      // Load invitations (simplified for now)
      const invitationsData = await teamInvitationService.getOrganizationInvitations(organization?.id || 'default-org');
      
      // Load members from user_roles table
      const { data: usersWithRoles } = await supabase
        .from('user_roles')
        .select('*')
        .order('created_at', { ascending: false });

      const membersList = (usersWithRoles || []).map((userRole, index) => ({
        id: userRole.id || `member-${index}`,
        user_id: userRole.user_id,
        organization_id: organization?.id || 'default-org',
        role: userRole.role as any,
        is_active: true,
        joined_at: userRole.created_at,
        user: { email: `user-${userRole.user_id.slice(0, 8)}@example.com` }
      }));
      
      setMembers(membersList as any);
      setInvitations(invitationsData);
      
    } catch (error) {
      console.error('Error loading team data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load team members',
        variant: 'destructive',
      });
      setMembers([]);
      setInvitations([]);
    } finally {
      setLoading(false);
    }
  };

  const handleInviteMember = async () => {
    if (!organization || !inviteEmail) return;

    try {
      setSubmitting(true);
      
      // Map organization role to team role
      const teamRole = inviteRole === 'owner' ? 'owner' : inviteRole === 'admin' ? 'manager' : 'staff';
      
      await teamInvitationService.createInvitation(
        organization?.id || 'default-org',
        inviteEmail,
        teamRole
      );
      
      toast({
        title: 'Invitation Sent!',
        description: `Team member invitation sent to ${inviteEmail}. They will receive an email with a registration link.`,
      });
      
      setInviteDialogOpen(false);
      setInviteEmail('');
      setInviteRole('member');
      loadData();
      
    } catch (error) {
      console.error('Error sending invitation:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to send invitation',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemoveMember = async (member: any) => {
    if (!confirm(`Are you sure you want to remove ${member.user?.email || 'this member'}?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', member.user_id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Member removed successfully',
      });
      loadData();
    } catch (error) {
      console.error('Error removing member:', error);
      toast({
        title: 'Error',
        description: 'Failed to remove member',
        variant: 'destructive',
      });
    }
  };

  const handleCancelInvitation = async (invitation: TeamInvitation) => {
    try {
      await teamInvitationService.cancelInvitation(invitation.id);
      toast({
        title: 'Success',
        description: 'Invitation cancelled',
      });
      loadData();
    } catch (error) {
      console.error('Error cancelling invitation:', error);
      toast({
        title: 'Error',
        description: 'Failed to cancel invitation',
        variant: 'destructive',
      });
    }
  };

  const handleResendInvitation = async (invitation: TeamInvitation) => {
    try {
      await teamInvitationService.resendInvitation(invitation.id);
      toast({
        title: 'Success',
        description: 'Invitation resent',
      });
      loadData();
    } catch (error) {
      console.error('Error resending invitation:', error);
      toast({
        title: 'Error',
        description: 'Failed to resend invitation',
        variant: 'destructive',
      });
    }
  };

  const handleOpenRoleDialog = (member: any) => {
    setSelectedMember(member);
    setNewEmployeeRole(member.role || 'staff');
    setRoleDialogOpen(true);
  };

  const handleUpdateEmployeeRole = async () => {
    if (!selectedMember) return;

    try {
      setUpdatingRole(true);
      
      // Update user role in the database
      const { error } = await supabase
        .from('user_roles')
        .upsert({
          user_id: selectedMember.user_id,
          role: newEmployeeRole
        });

      if (error) throw error;

      toast({
        title: 'Success',
        description: `Employee role updated to ${newEmployeeRole}`,
      });
      
      setRoleDialogOpen(false);
      setSelectedMember(null);
      loadData();
    } catch (error) {
      console.error('Error updating employee role:', error);
      toast({
        title: 'Error',
        description: 'Failed to update employee role',
        variant: 'destructive',
      });
    } finally {
      setUpdatingRole(false);
    }
  };

  const getRoleBadge = (role: OrganizationRole) => {
    const colors: Record<OrganizationRole, string> = {
      owner: 'bg-purple-100 text-purple-800',
      admin: 'bg-blue-100 text-blue-800',
      member: 'bg-gray-100 text-gray-800',
    };

    return (
      <Badge className={colors[role]}>
        {role}
      </Badge>
    );
  };

  const getInvitationStatusBadge = (status: string) => {
    const variants: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline', icon: React.ReactNode }> = {
      pending: { variant: 'secondary', icon: <Clock className="h-3 w-3 mr-1" /> },
      accepted: { variant: 'default', icon: <CheckCircle className="h-3 w-3 mr-1" /> },
      expired: { variant: 'destructive', icon: <XCircle className="h-3 w-3 mr-1" /> },
      cancelled: { variant: 'outline', icon: <XCircle className="h-3 w-3 mr-1" /> },
    };

    const config = variants[status] || variants.pending;

    return (
      <Badge variant={config.variant} className="flex items-center w-fit">
        {config.icon}
        {status}
      </Badge>
    );
  };

  if (!organization) {
    const content = (
      <div className="flex items-center justify-center h-96">
        <p className="text-muted-foreground">No organization selected</p>
      </div>
    );
    
    return embedded ? content : <AppLayout>{content}</AppLayout>;
  }

  const content = (
    <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Team Members</h2>
          <p className="text-muted-foreground">
            Manage your team members and their roles
          </p>
        </div>
        {canManageUsers && (
          <Button onClick={() => setInviteDialogOpen(true)}>
            <UserPlus className="mr-2 h-4 w-4" />
            Add Team Member
          </Button>
        )}
      </div>



      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{members.length}</div>
            <p className="text-xs text-muted-foreground">
              Team members with roles
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Roles</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Set(members.map(m => m.role)).size}
            </div>
            <p className="text-xs text-muted-foreground">
              Different role types
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Management</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {members.filter(m => ['owner', 'manager'].includes(m.role)).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Managers and owners
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="members" className="space-y-4">
        <TabsList>
          <TabsTrigger value="members">
            Members ({members.length})
          </TabsTrigger>
          <TabsTrigger value="invitations">
            Invitations ({invitations.length})
          </TabsTrigger>
        </TabsList>

        {/* Members Tab */}
        <TabsContent value="members" className="space-y-4">
          <Card>
            <CardContent className="p-0">
              {loading ? (
                <div className="flex items-center justify-center p-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : members.length === 0 ? (
                <div className="p-8 text-center">
                  <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">No team members yet</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead>Status</TableHead>
                      {canManageUsers && <TableHead className="text-right">Actions</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {members.map((member) => (
                      <TableRow key={member.id}>
                        <TableCell className="font-medium">
                          {member.user?.email || 'Unknown'}
                        </TableCell>
                        <TableCell>{getRoleBadge(member.role)}</TableCell>
                        <TableCell>
                          {new Date(member.joined_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Badge variant={member.is_active ? 'default' : 'secondary'}>
                            {member.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        {canManageUsers && (
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              {member.role !== 'owner' && (
                                <>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleOpenRoleDialog(member)}
                                    title="Manage employee role"
                                  >
                                    <Shield className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleRemoveMember(member)}
                                    title="Remove member"
                                  >
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                  </Button>
                                </>
                              )}
                            </div>
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Invitations Tab */}
        <TabsContent value="invitations" className="space-y-4">
          <Card>
            <CardContent className="p-0">
              {loading ? (
                <div className="flex items-center justify-center p-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : invitations.length === 0 ? (
                <div className="p-8 text-center">
                  <Mail className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">No invitations sent</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Sent</TableHead>
                      <TableHead>Expires</TableHead>
                      {canManageUsers && <TableHead className="text-right">Actions</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invitations.map((invitation) => (
                      <TableRow key={invitation.id}>
                        <TableCell className="font-medium">
                          {invitation.email}
                        </TableCell>
                        <TableCell>{getRoleBadge(invitation.role)}</TableCell>
                        <TableCell>{getInvitationStatusBadge(invitation.status)}</TableCell>
                        <TableCell>
                          {new Date(invitation.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          {new Date(invitation.expires_at).toLocaleDateString()}
                        </TableCell>
                        {canManageUsers && (
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              {invitation.status === 'pending' && (
                                <>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleResendInvitation(invitation)}
                                    title="Resend invitation"
                                  >
                                    <RefreshCw className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleCancelInvitation(invitation)}
                                    title="Cancel invitation"
                                  >
                                    <XCircle className="h-4 w-4 text-destructive" />
                                  </Button>
                                </>
                              )}
                            </div>
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Invite Member Dialog */}
      <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Team Member</DialogTitle>
            <DialogDescription>
              Create a role for a team member. Ask them to sign up with this email.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="colleague@example.com"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="role">Role</Label>
              <Select
                value={inviteRole}
                onValueChange={(value: OrganizationRole) => setInviteRole(value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="member">Staff</SelectItem>
                  <SelectItem value="admin">Manager</SelectItem>
                  <SelectItem value="owner">Owner</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {inviteRole === 'owner' && 'Full access to all features and settings'}
                {inviteRole === 'admin' && 'Can manage team members and settings'}
                {inviteRole === 'member' && 'Standard access to features'}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setInviteDialogOpen(false);
                setInviteEmail('');
                setInviteRole('member');
              }}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleInviteMember} 
              disabled={submitting || !inviteEmail}
            >
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Add Team Member
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Employee Role Management Dialog */}
      <Dialog open={roleDialogOpen} onOpenChange={setRoleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Manage Employee Role</DialogTitle>
            <DialogDescription>
              Set the employee role for {selectedMember?.user?.email}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="employee-role">Employee Role</Label>
              <Select
                value={newEmployeeRole}
                onValueChange={(value: UserRole) => setNewEmployeeRole(value)}
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
              <div className="text-xs text-muted-foreground space-y-1">
                <p><strong>Staff:</strong> Basic access to dashboard, cash desk, transactions, inventory, and reports</p>
                <p><strong>Cashier:</strong> Same as staff with enhanced cash desk permissions</p>
                <p><strong>Manager:</strong> Can edit transactions, inventory, and reports</p>
                <p><strong>Owner:</strong> Full access including settings and user management</p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setRoleDialogOpen(false);
                setSelectedMember(null);
              }}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleUpdateEmployeeRole} 
              disabled={updatingRole}
            >
              {updatingRole && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Update Role
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );

  return embedded ? content : <AppLayout>{content}</AppLayout>;
}
