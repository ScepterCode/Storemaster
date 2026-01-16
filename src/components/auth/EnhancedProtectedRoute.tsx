/**
 * Enhanced Protected Route Component
 * 
 * Provides comprehensive route protection with:
 * - Authentication verification
 * - Permission-based access control
 * - Device trust verification
 * - Security monitoring
 * - Session management
 */

import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useEnhancedAuth } from '@/contexts/EnhancedAuthContext';
import { usePermissions, Permission } from '@/hooks/usePermissions';
import { useSecurityMonitoring } from '@/hooks/useSecurityMonitoring';
import { authSecurityService } from '@/services/authSecurityService';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Shield, 
  AlertTriangle, 
  Clock, 
  Smartphone,
  RefreshCw,
  Lock
} from 'lucide-react';

interface EnhancedProtectedRouteProps {
  children: React.ReactNode;
  requiredPermission?: Permission;
  skipOrganizationCheck?: boolean;
  requireMFA?: boolean;
  requireTrustedDevice?: boolean;
  adminOnly?: boolean;
}

const EnhancedProtectedRoute: React.FC<EnhancedProtectedRouteProps> = ({
  children,
  requiredPermission,
  skipOrganizationCheck = false,
  requireMFA = false,
  requireTrustedDevice = false,
  adminOnly = false
}) => {
  const { 
    user, 
    session,
    loading: authLoading, 
    mfaEnabled,
    getSessionTimeRemaining,
    extendSession
  } = useEnhancedAuth();
  
  const { hasPermission, loading: permissionsLoading } = usePermissions();
  const { checkAccountLockout, metrics } = useSecurityMonitoring();
  
  const location = useLocation();
  const [isAccountLocked, setIsAccountLocked] = useState(false);
  const [deviceTrusted, setDeviceTrusted] = useState(false);
  const [securityChecksComplete, setSecurityChecksComplete] = useState(false);
  const [sessionWarning, setSessionWarning] = useState(false);

  // Perform security checks
  useEffect(() => {
    const performSecurityChecks = async () => {
      if (!user) {
        setSecurityChecksComplete(true);
        return;
      }

      try {
        // Check account lockout
        const locked = await checkAccountLockout();
        setIsAccountLocked(locked);

        // Check device trust if required
        if (requireTrustedDevice) {
          const deviceFingerprint = authSecurityService.generateDeviceFingerprint();
          const trusted = await authSecurityService.isDeviceTrusted(user.id, deviceFingerprint.id);
          setDeviceTrusted(trusted);
        } else {
          setDeviceTrusted(true);
        }

        // Log security event for route access
        await authSecurityService.logSecurityEvent(
          user.id,
          'route_access',
          { 
            route: location.pathname,
            requiredPermission,
            requireMFA,
            requireTrustedDevice
          },
          metrics.riskScore
        );

      } catch (error) {
        console.error('Security check failed:', error);
      } finally {
        setSecurityChecksComplete(true);
      }
    };

    performSecurityChecks();
  }, [user, location.pathname, requireTrustedDevice, requiredPermission, requireMFA, checkAccountLockout, metrics.riskScore]);

  // Session timeout warning
  useEffect(() => {
    if (!session) return;

    const checkSessionTimeout = () => {
      const timeRemaining = getSessionTimeRemaining();
      const fiveMinutes = 5 * 60 * 1000;
      
      if (timeRemaining <= fiveMinutes && timeRemaining > 0) {
        setSessionWarning(true);
      } else {
        setSessionWarning(false);
      }
    };

    checkSessionTimeout();
    const interval = setInterval(checkSessionTimeout, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [session, getSessionTimeRemaining]);

  // Loading state
  if (authLoading || permissionsLoading || !securityChecksComplete) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-96">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 animate-pulse" />
              Security Check
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="animate-pulse h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="animate-pulse h-4 bg-gray-200 rounded w-1/2"></div>
              <p className="text-sm text-muted-foreground">
                Verifying authentication and permissions...
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // No user - redirect to login
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Account locked
  if (isAccountLocked) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <Card className="w-96">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <Lock className="h-5 w-5" />
              Account Locked
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Your account has been temporarily locked due to suspicious activity. 
                Please contact support or try again later.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    );
  }

  // MFA required but not enabled
  if (requireMFA && !mfaEnabled) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <Card className="w-96">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Smartphone className="h-5 w-5" />
              MFA Required
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Alert>
              <Shield className="h-4 w-4" />
              <AlertDescription>
                Multi-factor authentication is required to access this area. 
                Please enable MFA in your security settings.
              </AlertDescription>
            </Alert>
            <Button 
              className="w-full mt-4" 
              onClick={() => window.location.href = '/security'}
            >
              Enable MFA
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Device not trusted
  if (requireTrustedDevice && !deviceTrusted) {
    const handleTrustDevice = async () => {
      const deviceFingerprint = authSecurityService.generateDeviceFingerprint();
      await authSecurityService.trustDevice(user.id, deviceFingerprint);
      setDeviceTrusted(true);
    };

    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <Card className="w-96">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Device Verification
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                This device is not recognized. For security, please verify this device 
                to continue accessing sensitive areas.
              </AlertDescription>
            </Alert>
            <Button className="w-full mt-4" onClick={handleTrustDevice}>
              Trust This Device
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Permission check
  if (requiredPermission && !hasPermission(requiredPermission)) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <Card className="w-96">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Access Denied
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                You don't have permission to access this area. 
                Contact your administrator if you believe this is an error.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Session timeout warning
  const SessionWarningBanner = () => {
    if (!sessionWarning) return null;

    const timeRemaining = Math.floor(getSessionTimeRemaining() / (1000 * 60));

    return (
      <div className="fixed top-0 left-0 right-0 z-50 bg-yellow-500 text-white p-2">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            <span className="text-sm font-medium">
              Session expires in {timeRemaining} minutes
            </span>
          </div>
          <Button
            size="sm"
            variant="secondary"
            onClick={extendSession}
            className="text-yellow-800 hover:text-yellow-900"
          >
            <RefreshCw className="h-3 w-3 mr-1" />
            Extend
          </Button>
        </div>
      </div>
    );
  };

  return (
    <>
      <SessionWarningBanner />
      <div className={sessionWarning ? 'pt-12' : ''}>
        {children}
      </div>
    </>
  );
};

export default EnhancedProtectedRoute;