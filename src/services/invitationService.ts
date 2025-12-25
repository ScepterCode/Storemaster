/**
 * Team Invitation Service
 * 
 * Service for managing team member invitations with email workflow
 */

import { supabase } from '@/integrations/supabase/client';

export interface TeamInvitation {
  id: string;
  email: string;
  role: 'staff' | 'manager' | 'owner';
  organization_id: string;
  invited_by: string;
  status: 'pending' | 'accepted' | 'expired' | 'cancelled';
  token: string;
  expires_at: string;
  accepted_at?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Team Invitation Service
 */
export const teamInvitationService = {
  /**
   * Create a team invitation
   */
  async createInvitation(
    organizationId: string,
    email: string,
    role: 'staff' | 'manager' | 'owner' = 'staff'
  ): Promise<TeamInvitation> {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Check if there's already a pending invitation
    const { data: existingInvitation } = await supabase
      .from('team_invitations')
      .select('id, status')
      .eq('email', email.toLowerCase())
      .eq('status', 'pending')
      .single();

    if (existingInvitation) {
      throw new Error('An invitation has already been sent to this email');
    }

    // Create invitation
    const { data, error } = await supabase
      .from('team_invitations')
      .insert({
        email: email.toLowerCase(),
        role,
        invited_by: user.id,
        status: 'pending'
      })
      .select()
      .single();

    if (error) throw error;

    // Send invitation email
    await this.sendInvitationEmail(email, data.token, organizationId);

    return data as TeamInvitation;
  },

  /**
   * Send invitation email
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

    const invitationUrl = `${window.location.origin}/accept-invitation?token=${token}`;

    // For now, log the invitation details
    // In production, you'd integrate with an email service
    console.log('Team Invitation Details:');
    console.log(`To: ${email}`);
    console.log(`Organization: ${org?.name || 'Unknown'}`);
    console.log(`Invitation URL: ${invitationUrl}`);
    
    // TODO: Integrate with email service (SendGrid, Mailgun, etc.)
    // Example:
    // await emailService.send({
    //   to: email,
    //   subject: `You're invited to join ${org?.name}`,
    //   template: 'team-invitation',
    //   data: { organizationName: org?.name, invitationUrl }
    // });
  },

  /**
   * Get invitation by token
   */
  async getInvitationByToken(token: string): Promise<any> {
    const { data, error } = await supabase.rpc('get_invitation_details', {
      invitation_token: token
    });

    if (error) throw error;
    
    if (!data.success) {
      throw new Error(data.error || 'Invitation not found');
    }

    return data.invitation;
  },

  /**
   * Accept invitation
   */
  async acceptInvitation(token: string): Promise<any> {
    const { data, error } = await supabase.rpc('accept_team_invitation', {
      invitation_token: token
    });

    if (error) throw error;
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to accept invitation');
    }

    return data;
  },

  /**
   * Get all invitations for an organization
   */
  async getOrganizationInvitations(organizationId: string): Promise<TeamInvitation[]> {
    const { data, error } = await supabase
      .from('team_invitations')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as TeamInvitation[];
  },

  /**
   * Cancel an invitation
   */
  async cancelInvitation(invitationId: string): Promise<void> {
    const { error } = await supabase
      .from('team_invitations')
      .update({ status: 'cancelled' })
      .eq('id', invitationId);

    if (error) throw error;
  },

  /**
   * Resend an invitation
   */
  async resendInvitation(invitationId: string): Promise<void> {
    const { data: invitation, error } = await supabase
      .from('team_invitations')
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
      .from('team_invitations')
      .update({ expires_at: expiresAt.toISOString() })
      .eq('id', invitationId);

    // Resend email
    await this.sendInvitationEmail(
      invitation.email,
      invitation.token,
      invitation.organization_id
    );
  },
};
