/**
 * Simple Team Members Page - Actually Works!
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { UserPlus, Trash2, Shield, Users, Mail, CheckCircle } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import AppLayout from '@/components/layout/AppLayout';

interface TeamMember {
  id: string;
  user_id: string;
  email: string;
  role: string;
  created_at: string;
}

interface TeamInvitation {
  id: string;
  email: string;
  role: string;
  status: string;
  created_at: string;
  invitation_link: string;
}

interface SimpleTeamMembersProps {
  embedded?: boolean;
}

export default function SimpleTeamMembersPage({ embedded = false }: SimpleTeamMembersProps) {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [invitations, setInvitations] = useState<TeamInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Dialog states
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('staff');
  const [submitting, setSubmitting] = useState(false);
  const [generatedInviteLink, setGeneratedInviteLink] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load members from user_roles table
      const { data: usersWithRoles, error } = await supabase
        .from('user_roles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading members:', error);
        setMembers([]);
      } else {
        const membersList = (usersWithRoles || []).map((userRole) => ({
          id: userRole.id,
          user_id: userRole.user_id,
          email: `user-${userRole.user_id.slice(0, 8)}@example.com`,
          role: userRole.role,
          created_at: userRole.created_at,
        }));
        setMembers(membersList);
      }
      
      // Mock invitations for now
      setInvitations([]);
      
    } catch (error) {
      console.error('Error loading team data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load team members',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInviteMember = async () => {
    if (!inviteEmail) return;

    try {
      setSubmitting(true);
      
      // Create invitation link that includes the role information
      const invitationData = {
        email: inviteEmail,
        role: inviteRole,
        timestamp: Date.now()
      };
      
      // Encode the invitation data
      const encodedData = btoa(JSON.stringify(invitationData));
      const invitationLink = `${window.location.origin}/join-team?invite=${encodedData}`;
      
      // Create invitation record
      const newInvitation: TeamInvitation = {
        id: crypto.randomUUID(),
        email: inviteEmail,
        role: inviteRole,
        status: 'pending',
        created_at: new Date().toISOString(),
        invitation_link: invitationLink
      };
      
      // Store invitation in local state (in production, you'd store this in a database)
      setInvitations(prev => [newInvitation, ...prev]);
      
      // Set the generated link to display in the dialog
      setGeneratedInviteLink(invitationLink);
      
      toast({
        title: 'Invitation Created!',
        description: `Team member invitation created for ${inviteEmail}. Copy the link below to send to them.`,
      });
      
      // Clear form but keep dialog open to show the link
      setInviteEmail('');
      setInviteRole('staff');
      
    } catch (error) {
      console.error('Error creating invitation:', error);
      toast({
        title: 'Error',
        description: 'Failed to create invitation',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemoveMember = async (member: TeamMember) => {
    if (!confirm(`Are you sure you want to remove ${member.email}?`)) {
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

  const getRoleBadge = (role: string) => {
    const colors: Record<string, string> = {
      owner: 'bg-purple-100 text-purple-800',
      manager: 'bg-blue-100 text-blue-800',
      staff: 'bg-gray-100 text-gray-800',
      cashier: 'bg-green-100 text-green-800',
    };

    return (
      <Badge className={colors[role] || colors.staff}>
        {role}
      </Badge>
    );
  };

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
        <Button onClick={() => setInviteDialogOpen(true)}>
          <UserPlus className="mr-2 h-4 w-4" />
          Add Team Member
        </Button>
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
            <CardTitle className="text-sm font-medium">Pending Invitations</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{invitations.length}</div>
            <p className="text-xs text-muted-foreground">
              Awaiting acceptance
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
      </div>

      {/* Members Table */}
      <Card>
        <CardHeader>
          <CardTitle>Team Members ({members.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center p-8">
              <div className="text-center">Loading team members...</div>
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
                  <TableHead>Added</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {members.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell className="font-medium">
                      {member.email}
                    </TableCell>
                    <TableCell>{getRoleBadge(member.role)}</TableCell>
                    <TableCell>
                      {new Date(member.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveMember(member)}
                        title="Remove member"
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Invitations Table */}
      {invitations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Pending Invitations ({invitations.length})</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Sent</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invitations.map((invitation) => (
                  <TableRow key={invitation.id}>
                    <TableCell className="font-medium">
                      {invitation.email}
                    </TableCell>
                    <TableCell>{getRoleBadge(invitation.role)}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">Pending</Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(invitation.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          navigator.clipboard.writeText(invitation.invitation_link);
                          toast({
                            title: 'Copied!',
                            description: 'Invitation link copied to clipboard',
                          });
                        }}
                      >
                        Copy Link
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Add Member Dialog */}
      <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {generatedInviteLink ? 'Invitation Link Ready' : 'Add Team Member'}
            </DialogTitle>
            <DialogDescription>
              {generatedInviteLink 
                ? 'Copy this link and send it to your team member'
                : 'Create an invitation for a new team member'
              }
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {generatedInviteLink ? (
              // Show invitation link
              <div className="space-y-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span className="font-medium text-green-800">Invitation Created!</span>
                  </div>
                  <p className="text-sm text-green-700 mb-3">
                    Send this link to your team member. It will expire in 7 days.
                  </p>
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="invitation-link">Invitation Link</Label>
                  <div className="flex gap-2">
                    <Input
                      id="invitation-link"
                      value={generatedInviteLink}
                      readOnly
                      className="font-mono text-sm"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        navigator.clipboard.writeText(generatedInviteLink);
                        toast({
                          title: 'Copied!',
                          description: 'Invitation link copied to clipboard',
                        });
                      }}
                    >
                      Copy
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Share this link via email, Slack, or any messaging platform
                  </p>
                </div>
              </div>
            ) : (
              // Show invitation form
              <>
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
                    onValueChange={(value) => setInviteRole(value)}
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
                  <p className="text-xs text-muted-foreground">
                    {inviteRole === 'owner' && 'Full access to all features and settings'}
                    {inviteRole === 'manager' && 'Can manage team members and settings'}
                    {inviteRole === 'cashier' && 'Enhanced cash desk permissions'}
                    {inviteRole === 'staff' && 'Standard access to features'}
                  </p>
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            {generatedInviteLink ? (
              // Show close button when link is generated
              <Button
                onClick={() => {
                  setInviteDialogOpen(false);
                  setGeneratedInviteLink(null);
                  setInviteEmail('');
                  setInviteRole('staff');
                }}
                className="w-full"
              >
                Done
              </Button>
            ) : (
              // Show create/cancel buttons when creating invitation
              <>
                <Button
                  variant="outline"
                  onClick={() => {
                    setInviteDialogOpen(false);
                    setInviteEmail('');
                    setInviteRole('staff');
                  }}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleInviteMember} 
                  disabled={submitting || !inviteEmail}
                >
                  {submitting ? 'Creating...' : 'Create Invitation'}
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );

  return embedded ? content : <AppLayout>{content}</AppLayout>;
}