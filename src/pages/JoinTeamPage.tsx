/**
 * Join Team Page - Handles team member invitations
 */

import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle, XCircle, Users } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface InvitationData {
  email: string;
  role: string;
  timestamp: number;
}

export default function JoinTeamPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, signIn } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [invitation, setInvitation] = useState<InvitationData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const inviteParam = searchParams.get('invite');

  useEffect(() => {
    if (!inviteParam) {
      setError('Invalid invitation link');
      setLoading(false);
      return;
    }

    try {
      const decodedData = atob(inviteParam);
      const invitationData: InvitationData = JSON.parse(decodedData);
      
      // Check if invitation is not too old (7 days)
      const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
      if (invitationData.timestamp < sevenDaysAgo) {
        setError('This invitation has expired');
        setLoading(false);
        return;
      }
      
      setInvitation(invitationData);
      setLoading(false);
    } catch (err) {
      setError('Invalid invitation link');
      setLoading(false);
    }
  }, [inviteParam]);

  const handleAcceptInvitation = async () => {
    if (!invitation || !user) return;

    try {
      setAccepting(true);
      setError(null);

      // Set the user's role
      const { error: roleError } = await supabase
        .from('user_roles')
        .upsert({
          user_id: user.id,
          role: invitation.role as any
        });

      if (roleError) {
        console.error('Error setting role:', roleError);
        toast({
          title: 'Error',
          description: 'Failed to assign role. Please contact your administrator.',
          variant: 'destructive',
        });
        return;
      }

      setSuccess(true);
      
      toast({
        title: 'Welcome to the team!',
        description: `You've been added as a ${invitation.role}. Redirecting to dashboard...`,
      });

      // Redirect to dashboard after 2 seconds
      setTimeout(() => {
        navigate('/dashboard');
        window.location.reload(); // Refresh to update permissions
      }, 2000);
      
    } catch (err) {
      console.error('Error accepting invitation:', err);
      setError('Failed to join team. Please try again.');
    } finally {
      setAccepting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-gray-600">Validating invitation...</p>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <CardTitle>Welcome to the Team!</CardTitle>
            <CardDescription>
              You've successfully joined as a {invitation?.role}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-sm text-gray-600 mb-4">
              Redirecting you to the dashboard...
            </p>
            <Loader2 className="h-5 w-5 animate-spin mx-auto text-primary" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !invitation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
              <XCircle className="h-6 w-6 text-red-600" />
            </div>
            <CardTitle>Invalid Invitation</CardTitle>
            <CardDescription>
              {error || 'This invitation link is not valid'}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button onClick={() => navigate('/login')} className="w-full">
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
            <CardTitle>Join Our Team</CardTitle>
            <CardDescription>
              You've been invited to join as a {invitation.role}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-sm font-medium text-gray-600">Email:</span>
                <span className="text-sm font-semibold">{invitation.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium text-gray-600">Role:</span>
                <span className="text-sm font-semibold capitalize">{invitation.role}</span>
              </div>
            </div>

            <Alert>
              <AlertDescription>
                Please sign in or create an account with the email {invitation.email} to accept this invitation.
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Button 
                onClick={() => navigate(`/login?email=${encodeURIComponent(invitation.email)}`)} 
                className="w-full"
              >
                Sign In
              </Button>
              <Button 
                onClick={() => navigate(`/signup?email=${encodeURIComponent(invitation.email)}`)} 
                variant="outline" 
                className="w-full"
              >
                Create Account
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // User is logged in, show acceptance interface
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
            <Users className="h-6 w-6 text-blue-600" />
          </div>
          <CardTitle>Team Invitation</CardTitle>
          <CardDescription>
            You've been invited to join our team
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-gray-50 rounded-lg p-4 space-y-2">
            <div className="flex justify-between">
              <span className="text-sm font-medium text-gray-600">Your Email:</span>
              <span className="text-sm font-semibold">{user.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm font-medium text-gray-600">Role:</span>
              <span className="text-sm font-semibold capitalize">{invitation.role}</span>
            </div>
          </div>

          {user.email?.toLowerCase() !== invitation.email.toLowerCase() && (
            <Alert>
              <AlertDescription>
                This invitation was sent to {invitation.email}, but you're signed in as {user.email}.
                You can still accept this invitation.
              </AlertDescription>
            </Alert>
          )}

          <div className="flex gap-3">
            <Button
              onClick={() => navigate('/dashboard')}
              variant="outline"
              className="flex-1"
              disabled={accepting}
            >
              Decline
            </Button>
            <Button
              onClick={handleAcceptInvitation}
              className="flex-1"
              disabled={accepting}
            >
              {accepting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Joining...
                </>
              ) : (
                'Accept & Join Team'
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}