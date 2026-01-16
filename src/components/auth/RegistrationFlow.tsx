/**
 * Registration Flow Component
 * 
 * Complete registration workflow with:
 * - Step-by-step guidance
 * - Email verification status
 * - Clear user feedback
 * - Helpful troubleshooting
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle, 
  Mail, 
  User, 
  Building, 
  ArrowRight, 
  Clock,
  AlertTriangle,
  RefreshCw
} from 'lucide-react';

interface RegistrationStep {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'current' | 'completed';
  icon: React.ReactNode;
}

interface RegistrationFlowProps {
  currentStep: 'registration' | 'email-sent' | 'email-verified' | 'onboarding';
  email?: string;
  onResendEmail?: () => void;
  onContinue?: () => void;
  resendLoading?: boolean;
}

const RegistrationFlow: React.FC<RegistrationFlowProps> = ({
  currentStep,
  email,
  onResendEmail,
  onContinue,
  resendLoading = false
}) => {
  const steps: RegistrationStep[] = [
    {
      id: 'registration',
      title: 'Create Account',
      description: 'Enter your details and create your account',
      status: currentStep === 'registration' ? 'current' : 'completed',
      icon: <User className="h-4 w-4" />
    },
    {
      id: 'email-verification',
      title: 'Verify Email',
      description: 'Check your email and click the verification link',
      status: currentStep === 'email-sent' ? 'current' : 
              currentStep === 'email-verified' || currentStep === 'onboarding' ? 'completed' : 'pending',
      icon: <Mail className="h-4 w-4" />
    },
    {
      id: 'onboarding',
      title: 'Setup Organization',
      description: 'Complete your business profile and preferences',
      status: currentStep === 'onboarding' ? 'current' : 
              currentStep === 'onboarding' ? 'completed' : 'pending',
      icon: <Building className="h-4 w-4" />
    }
  ];

  const getStepStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500 text-white';
      case 'current': return 'bg-blue-500 text-white';
      case 'pending': return 'bg-gray-200 text-gray-600';
      default: return 'bg-gray-200 text-gray-600';
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 'email-sent':
        return (
          <div className="space-y-6">
            <Alert>
              <Mail className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-2">
                  <p className="font-medium">Verification email sent!</p>
                  <p>We've sent a verification link to <strong>{email}</strong></p>
                  <p className="text-sm">Click the link in the email to continue with your registration.</p>
                </div>
              </AlertDescription>
            </Alert>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2">What happens next?</h4>
              <ol className="list-decimal list-inside space-y-1 text-sm text-blue-800">
                <li>Check your email inbox (and spam folder)</li>
                <li>Click "Verify Email Address" in the email</li>
                <li>You'll be automatically logged in</li>
                <li>Complete your organization setup</li>
              </ol>
            </div>

            <div className="space-y-3">
              <p className="text-sm text-center text-muted-foreground">
                Didn't receive the email?
              </p>
              <Button 
                onClick={onResendEmail}
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
                <strong>Troubleshooting tips:</strong>
                <ul className="mt-2 space-y-1 text-sm">
                  <li>• Check your spam/junk folder</li>
                  <li>• Make sure {email} is spelled correctly</li>
                  <li>• Wait a few minutes - emails can be delayed</li>
                  <li>• Add noreply@businessmanager.com to your contacts</li>
                </ul>
              </AlertDescription>
            </Alert>
          </div>
        );

      case 'email-verified':
        return (
          <div className="space-y-6">
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-700">
                <div className="space-y-2">
                  <p className="font-medium">Email verified successfully!</p>
                  <p>Your account is now active. Let's complete your setup.</p>
                </div>
              </AlertDescription>
            </Alert>

            <div className="text-center">
              <Button onClick={onContinue} className="w-full">
                <ArrowRight className="h-4 w-4 mr-2" />
                Continue to Organization Setup
              </Button>
            </div>
          </div>
        );

      case 'onboarding':
        return (
          <div className="space-y-6">
            <Alert>
              <Building className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-2">
                  <p className="font-medium">Almost there!</p>
                  <p>Complete your organization setup to start using Business Manager.</p>
                </div>
              </AlertDescription>
            </Alert>

            <div className="text-center">
              <Button onClick={onContinue} className="w-full">
                <ArrowRight className="h-4 w-4 mr-2" />
                Setup My Organization
              </Button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="text-center">Account Registration</CardTitle>
        <CardDescription className="text-center">
          Follow these steps to get your Business Manager account ready
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-8">
        {/* Progress Steps */}
        <div className="flex items-center justify-between">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div className="flex flex-col items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${getStepStatusColor(step.status)}`}>
                  {step.status === 'completed' ? (
                    <CheckCircle className="h-5 w-5" />
                  ) : (
                    step.icon
                  )}
                </div>
                <div className="mt-2 text-center">
                  <p className="text-sm font-medium">{step.title}</p>
                  <p className="text-xs text-muted-foreground max-w-24">
                    {step.description}
                  </p>
                  <Badge 
                    variant={step.status === 'completed' ? 'default' : 
                            step.status === 'current' ? 'secondary' : 'outline'}
                    className="mt-1 text-xs"
                  >
                    {step.status === 'completed' ? 'Done' :
                     step.status === 'current' ? 'Active' : 'Pending'}
                  </Badge>
                </div>
              </div>
              
              {index < steps.length - 1 && (
                <div className="flex-1 h-px bg-gray-300 mx-4 mt-[-2rem]" />
              )}
            </div>
          ))}
        </div>

        {/* Step Content */}
        {renderStepContent()}

        {/* Help Section */}
        <div className="pt-6 border-t">
          <div className="text-center text-sm text-muted-foreground">
            <p className="mb-2">Need help with registration?</p>
            <div className="space-x-4">
              <a 
                href="mailto:support@businessmanager.com" 
                className="text-primary hover:underline"
              >
                Contact Support
              </a>
              <span>•</span>
              <a 
                href="/help/registration" 
                className="text-primary hover:underline"
              >
                Registration Guide
              </a>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default RegistrationFlow;