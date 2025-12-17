/**
 * Invitation Service
 * 
 * Service for managing organization invitations
 */

import { supabase } from '@/integrations/supabase/client';
import { OrganizationInvitation, OrganizationRole } from '@/types/admin';
import { adminService } from './adminService';
import { canAddUser } from '@/lib/limitChecker';

/**
 * Generate a secure random token for invitations
 */
function generateInvitationToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Invitation Service
 */
export const invitationService = {
  /**
   * Create an invitation for a user to join an organization
   */
  async createInvitation(
    organizationId: string,
    email: string,
    role: OrganizationRole = 'member'
  ): Promise<OrganizationInvitation> {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Check user limit before creating invitation
    const canAdd = await canAddUser(organizationId);
    if (!canAdd) {
      throw new Error('User limit reached. Please upgrade your plan to invite more users.');
    }

    // Check if user is already a member
    const { data: existingMember } = await supabase
      .from('organization_members')
      .select('id')
      .eq('organization_id', organizationId)
      .eq('user_id', user.id)
      .single();

    if (existingMember) {
      throw new Error('User is already a member of this organization');
    }

    // Check if there's already a pending invitation
    const { data: existingInvitation } = await supabase
      .from('organization_invitations')
      .select('id, status')
      .eq('organization_id', organizationId)
      .eq('email', email.toLowerCase())
      .eq('status', 'pending')
      .single();

    if (existingInvitation) {
      throw new Error('An invitation has already been sent to this email');
    }

    // Generate token and expiration (7 days from now)
    const token = generateInvitationToken();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // Create invitation
    const { data, error } = await supabase
      .from('organization_invitations')
      .insert({
        organization_id: organizationId,
        email: email.toLowerCase(),
        role,
        token,
        invited_by: user.id,
        status: 'pending',
        expires_at: expiresAt.toISOString(),
      })
      .select()
      .single();

    if (error) throw error;

    // Send invitation email via Supabase
    await this.sendInvitationEmail(email, token, organizationId);

    // Log the action
    await adminService.logAuditAction(
      'invitation_created',
      'organization_invitation',
      data.id,
      { organization_id: organizationId, email, role }
    );

    return data as OrganizationInvitation;
  },

  /**
   * Send invitation email using Supabase
   */
  async sendInvitationEmail(
    email: string,
    token: string,
    organizationId: string
  ): Promise<void> {
    // Get organization details
    const { data: org } = await supabase
      .from('organizations')
      .select('name')
      .eq('id', organizationId)
      .single();

    const invitationUrl = `${window.location.origin}/invitation/accept?token=${token}`;

    // Use Supabase's built-in email functionality
    // Note: This requires setting up email templates in Supabase dashboard
    // For now, we'll use a simple approach with auth.resetPasswordForEmail as a template
    // In production, you'd want to set up proper transactional emails
    
    // TODO: Implement proper email sending via Supabase Edge Function or third-party service
    console.log(`Invitation email would be sent to ${email}`);
    console.log(`Organization: ${org?.name}`);
    console.log(`Invitation URL: ${invitationUrl}`);
  },

  /**
   * Get invitation by token
   */
  async getInvitationByToken(token: string): Promise<OrganizationInvitation | null> {
    const { data, error } = await supabase
      .from('organization_invitations')
      .select(`
        *,
        organization:organization_id (
          id,
          name,
          slug
        )
      `)
      .eq('token', token)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }

    return data as any;
  },

  /**
   * Validate invitation token
   */
  async validateInvitation(token: string): Promise<{
    valid: boolean;
    invitation?: OrganizationInvitation;
    error?: string;
  }> {
    const invitation = await this.getInvitationByToken(token);

    if (!invitation) {
      return { valid: false, error: 'Invitation not found' };
    }

    if (invitation.status !== 'pending') {
      return { valid: false, error: 'Invitation has already been used or cancelled' };
    }

    const now = new Date();
    const expiresAt = new Date(invitation.expires_at);

    if (now > expiresAt) {
      // Mark as expired
      await supabase
        .from('organization_invitations')
        .update({ status: 'expired' })
        .eq('id', invitation.id);

      return { valid: false, error: 'Invitation has expired' };
    }

    return { valid: true, invitation };
  },

  /**
   * Accept an invitation and create organization membership
   */
  async acceptInvitation(token: string, userId: string): Promise<void> {
    const validation = await this.validateInvitation(token);

    if (!validation.valid || !validation.invitation) {
      throw new Error(validation.error || 'Invalid invitation');
    }

    const invitation = validation.invitation;

    // Check if user is already a member
    const { data: existingMember } = await supabase
      .from('organization_members')
      .select('id')
      .eq('organization_id', invitation.organization_id)
      .eq('user_id', userId)
      .single();

    if (existingMember) {
      throw new Error('You are already a member of this organization');
    }

    // Create organization membership
    await adminService.addOrganizationMember(
      invitation.organization_id,
      userId,
      invitation.role
    );

    // Mark invitation as accepted
    await supabase
      .from('organization_invitations')
      .update({
        status: 'accepted',
        accepted_at: new Date().toISOString(),
      })
      .eq('id', invitation.id);

    // Log the action
    await adminService.logAuditAction(
      'invitation_accepted',
      'organization_invitation',
      invitation.id,
      { organization_id: invitation.organization_id, user_id: userId }
    );
  },

  /**
   * Cancel an invitation
   */
  async cancelInvitation(invitationId: string): Promise<void> {
    const { error } = await supabase
      .from('organization_invitations')
      .update({ status: 'cancelled' })
      .eq('id', invitationId);

    if (error) throw error;

    await adminService.logAuditAction(
      'invitation_cancelled',
      'organization_invitation',
      invitationId
    );
  },

  /**
   * Get all invitations for an organization
   */
  async getOrganizationInvitations(organizationId: string): Promise<OrganizationInvitation[]> {
    const { data, error } = await supabase
      .from('organization_invitations')
      .select(`
        *,
        inviter:invited_by (
          email
        )
      `)
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as any;
  },

  /**
   * Resend an invitation
   */
  async resendInvitation(invitationId: string): Promise<void> {
    const { data: invitation, error } = await supabase
      .from('organization_invitations')
      .select('*')
      .eq('id', invitationId)
      .single();

    if (error) throw error;

    if (invitation.status !== 'pending') {
      throw new Error('Can only resend pending invitations');
    }

    // Extend expiration by 7 days
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await supabase
      .from('organization_invitations')
      .update({ expires_at: expiresAt.toISOString() })
      .eq('id', invitationId);

    // Resend email
    await this.sendInvitationEmail(
      invitation.email,
      invitation.token,
      invitation.organization_id
    );

    await adminService.logAuditAction(
      'invitation_resent',
      'organization_invitation',
      invitationId
    );
  },
};
