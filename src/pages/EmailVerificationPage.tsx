/**
 * Email Verification Status Page
 * 
 * Helps users understand their email verification status
 * and provides options to resend verification emails
 */

import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Mail, 
  CheckCircle, 
  AlertTriangle, 
  RefreshCw, 
  ArrowLeft,
  Clock,
  Shield,
  XCircle
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

const EmailVerificationPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [verificationStatus, setVerificationStatus] = useState<'pending' | 'verified' | 'expired' | 'error'>('pending');
  const [email, setEmail] = useState('');
  const [resendLoading, setResendLoading] = useState(false);
  const { toast } = useToast();

  // Check if this is a verification callback
  const token = searchParams.get('token');
  const type = searchParams.get('type');

  useEffect(() => {
    checkVerificationStatus();
  }, []);

  const checkVerificationStatus = async () => {
    try {
      setLoading(true);
      
      // If we have a token, this is a verification attempt
      if (token && type === 'signup') {
        const { data, error } = await supabase.auth.verifyOtp({
          token_hash: token,
          type: 'signup'
        });

        if (error) {
          if (error.message.includes('expired')) {
            setVerificationStatus('expired');
          } else {
            setVerificationStatus('error');
          }
        } else if (data.user) {
          setVerificationStatus('verified');
          setEmail(data.user.email || '');
          
          // Redirect to dashboard after a short delay
          setTimeout(() => {
            window.location.href = '/dashboard';
          }, 3000);
        }
      } else {
        // Check current user status
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
          if (user.email_confirmed_at) {
            setVerificationStatus('verified');
          } else {
            setVerificationStatus('pending');
          }
          setEmail(user.email || '');
        } else {
          setVerificationStatus('error');
        }
      }
    } catch (error) {
      console.error('Error checking verification status:', error);
      setVerificationStatus('error');
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    if (!email) {
      toast({
        title: "Error",
        description: "No email address found. Please try registering again.",
        variant: "destructive",
      });
      return;
    }

    try {
      setResendLoading(true);
      
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
        options: {
          emailRedirectTo: `${window.location.origin}/verify-email`
        }
      });

      if (error) throw error;

      toast({
        title: "Verification Email Sent!",
        description: "We've sent a new verification email to your inbox.",
        duration: 5000,
      });

    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to resend verification email.",
        variant: "destructive",
      });
    } finally {
      setResendLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted/30 p-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex items-center justify-center py-8">
            <div className="text-center">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
              <p>Verifying your email...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const renderContent = () => {
    switch (verificationStatus) {
      case 'verified':
        return (
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <CardTitle className="text-2xl text-green-700">Email Verified!</CardTitle>
              <CardDescription>
                Your email has been successfully verified
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-700">
                  <strong>Welcome to Business Manager!</strong><br />
                  Your account is now active and ready to use. You'll be redirected to your dashboard shortly.
                </AlertDescription>
              </Alert>
              
              <div className="text-center">
                <Button asChild className="w-full">
                  <Link to="/dashboard">
                    Go to Dashboard
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        );

      case 'expired':
        return (
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center">
                <Clock className="h-8 w-8 text-yellow-600" />
              </div>
              <CardTitle className="text-2xl text-yellow-700">Link Expired</CardTitle>
              <CardDescription>
                Your verification link has expired
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert className="border-yellow-200 bg-yellow-50">
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                <AlertDescription className="text-yellow-700">
                  Verification links expire after 24 hours for security reasons. 
                  Don't worry - we can send you a new one!
                </AlertDescription>
              </Alert>

              {email && (
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-3">
                    Send new verification email to:
                  </p>
                  <div className="inline-flex items-center gap-2 px-3 py-2 bg-muted rounded-lg mb-4">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{email}</span>
                  </div>
                </div>
              )}

              <Button 
                onClick={handleResendVerification}
                disabled={resendLoading}
                className="w-full"
              >
                {resendLoading ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Mail className="h-4 w-4 mr-2" />
                    Send New Verification Email
                  </>
                )}
              </Button>

              <div className="text-center pt-4 border-t">
                <Button variant="ghost" asChild>
                  <Link to="/login">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Login
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        );

      case 'pending':
        return (
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                <Mail className="h-8 w-8 text-blue-600" />
              </div>
              <CardTitle className="text-2xl">Verification Pending</CardTitle>
              <CardDescription>
                Please check your email to verify your account
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <Shield className="h-4 w-4" />
                <AlertDescription>
                  We've sent a verification email to <strong>{email}</strong>. 
                  Click the link in the email to activate your account.
                </AlertDescription>
              </Alert>

              <div className="space-y-3">
                <p className="text-sm text-muted-foreground text-center">
                  Didn't receive the email?
                </p>
                <Button 
                  onClick={handleResendVerification}
                  disabled={resendLoading}
                  variant="outline"
                  className="w-full"
                >
                  {resendLoading ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Resend Verification Email
                    </>
                  )}
                </Button>
              </div>

              <Alert variant="default" className="border-yellow-200 bg-yellow-50">
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                <AlertDescription className="text-yellow-700">
                  <strong>Check your spam folder</strong> if you don't see the email in your inbox.
                </AlertDescription>
              </Alert>

              <div className="text-center pt-4 border-t">
                <Button variant="ghost" asChild>
                  <Link to="/login">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Login
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        );

      case 'error':
      default:
        return (
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                <XCircle className="h-8 w-8 text-red-600" />
              </div>
              <CardTitle className="text-2xl text-red-700">Verification Error</CardTitle>
              <CardDescription>
                There was a problem verifying your email
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertDescription>
                  We couldn't verify your email address. This could be due to an invalid 
                  or expired verification link.
                </AlertDescription>
              </Alert>

              <div className="space-y-3">
                <p className="text-sm text-center text-muted-foreground">
                  Try one of these options:
                </p>
                
                <div className="space-y-2">
                  <Button variant="outline" className="w-full" asChild>
                    <Link to="/login">
                      Try Logging In
                    </Link>
                  </Button>
                  
                  <Button variant="outline" className="w-full" asChild>
                    <Link to="/register">
                      Create New Account
                    </Link>
                  </Button>
                </div>
              </div>

              <div className="text-center text-xs text-muted-foreground pt-4 border-t">
                <p>
                  Need help? Contact us at{' '}
                  <a 
                    href="mailto:support@businessmanager.com" 
                    className="text-primary hover:underline"
                  >
                    support@businessmanager.com
                  </a>
                </p>
              </div>
            </CardContent>
          </Card>
        );
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted/30 p-4">
      {renderContent()}
    </div>
  );
};

export default EmailVerificationPage;