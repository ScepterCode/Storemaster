/**
 * Registration Success Page
 * 
 * User-friendly page shown after successful registration
 * with clear instructions and email resend functionality
 */

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Mail, 
  CheckCircle, 
  Clock, 
  RefreshCw, 
  AlertTriangle,
  ArrowLeft,
  Inbox,
  Shield
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

interface RegistrationSuccessPageProps {
  email: string;
  onBackToLogin: () => void;
}

const RegistrationSuccessPage: React.FC<RegistrationSuccessPageProps> = ({
  email,
  onBackToLogin
}) => {
  const [resendLoading, setResendLoading] = useState(false);
  const [resendCount, setResendCount] = useState(0);
  const [canResend, setCanResend] = useState(true);
  const [countdown, setCountdown] = useState(0);
  const { toast } = useToast();

  // Countdown timer for resend button
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0 && !canResend) {
      setCanResend(true);
    }
  }, [countdown, canResend]);

  const handleResendEmail = async () => {
    try {
      setResendLoading(true);
      
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`
        }
      });

      if (error) throw error;

      setResendCount(prev => prev + 1);
      setCanResend(false);
      setCountdown(60); // 60 second cooldown

      toast({
        title: "Email Sent!",
        description: "We've sent another confirmation email to your inbox.",
        duration: 5000,
      });

    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to resend email. Please try again.",
        variant: "destructive",
      });
    } finally {
      setResendLoading(false);
    }
  };

  const getEmailProvider = (email: string) => {
    const domain = email.split('@')[1]?.toLowerCase();
    
    const providers = {
      'gmail.com': { name: 'Gmail', url: 'https://mail.google.com' },
      'yahoo.com': { name: 'Yahoo Mail', url: 'https://mail.yahoo.com' },
      'outlook.com': { name: 'Outlook', url: 'https://outlook.live.com' },
      'hotmail.com': { name: 'Outlook', url: 'https://outlook.live.com' },
      'icloud.com': { name: 'iCloud Mail', url: 'https://www.icloud.com/mail' },
      'aol.com': { name: 'AOL Mail', url: 'https://mail.aol.com' }
    };

    return providers[domain] || null;
  };

  const emailProvider = getEmailProvider(email);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted/30 p-4">
      <div className="w-full max-w-md">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <CardTitle className="text-2xl">Check Your Email</CardTitle>
            <CardDescription>
              We've sent a confirmation link to verify your account
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Email Address Display */}
            <div className="text-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-muted rounded-lg">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{email}</span>
              </div>
            </div>

            {/* Instructions */}
            <Alert>
              <Inbox className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-2">
                  <p className="font-medium">What to do next:</p>
                  <ol className="list-decimal list-inside space-y-1 text-sm">
                    <li>Check your email inbox for a message from Business Manager</li>
                    <li>Click the "Confirm your account" button in the email</li>
                    <li>You'll be automatically signed in and redirected to your dashboard</li>
                  </ol>
                </div>
              </AlertDescription>
            </Alert>

            {/* Quick Access to Email Provider */}
            {emailProvider && (
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-2">
                  Quick access to your email:
                </p>
                <Button
                  variant="outline"
                  onClick={() => window.open(emailProvider.url, '_blank')}
                  className="w-full"
                >
                  <Mail className="h-4 w-4 mr-2" />
                  Open {emailProvider.name}
                </Button>
              </div>
            )}

            {/* Troubleshooting */}
            <Alert variant="default" className="border-yellow-200 bg-yellow-50">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <AlertDescription>
                <div className="space-y-2">
                  <p className="font-medium text-yellow-800">Don't see the email?</p>
                  <ul className="text-sm text-yellow-700 space-y-1">
                    <li>• Check your spam/junk folder</li>
                    <li>• Make sure {email} is correct</li>
                    <li>• Wait a few minutes - emails can be delayed</li>
                    <li>• Add noreply@businessmanager.com to your contacts</li>
                  </ul>
                </div>
              </AlertDescription>
            </Alert>

            {/* Resend Email */}
            <div className="space-y-3">
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-3">
                  Still haven't received the email?
                </p>
                <Button
                  onClick={handleResendEmail}
                  disabled={!canResend || resendLoading}
                  variant="outline"
                  className="w-full"
                >
                  {resendLoading ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : !canResend ? (
                    <>
                      <Clock className="h-4 w-4 mr-2" />
                      Resend in {countdown}s
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Resend Email {resendCount > 0 ? `(${resendCount + 1})` : ''}
                    </>
                  )}
                </Button>
              </div>

              {resendCount > 0 && (
                <p className="text-xs text-center text-muted-foreground">
                  Email sent {resendCount + 1} time{resendCount > 0 ? 's' : ''}
                </p>
              )}
            </div>

            {/* Security Note */}
            <Alert>
              <Shield className="h-4 w-4" />
              <AlertDescription className="text-sm">
                <strong>Security Note:</strong> The confirmation link will expire in 24 hours. 
                If it expires, you can request a new one using the resend button above.
              </AlertDescription>
            </Alert>

            {/* Back to Login */}
            <div className="text-center pt-4 border-t">
              <Button
                variant="ghost"
                onClick={onBackToLogin}
                className="text-sm"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Login
              </Button>
            </div>

            {/* Support Contact */}
            <div className="text-center text-xs text-muted-foreground">
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
      </div>
    </div>
  );
};

export default RegistrationSuccessPage;