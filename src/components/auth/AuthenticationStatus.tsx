/**
 * Authentication Status Component
 * 
 * Displays current authentication status and security metrics
 */

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { 
  Shield, 
  CheckCircle, 
  AlertTriangle, 
  Clock, 
  Smartphone,
  Monitor,
  Activity
} from 'lucide-react';
import { useEnhancedAuth } from '@/contexts/EnhancedAuthContext';
import { useSecurityMonitoring } from '@/hooks/useSecurityMonitoring';

const AuthenticationStatus: React.FC = () => {
  const { 
    user, 
    mfaEnabled, 
    trustedDevices, 
    getSessionTimeRemaining 
  } = useEnhancedAuth();
  
  const { metrics, alerts } = useSecurityMonitoring();

  const sessionTimeRemaining = getSessionTimeRemaining();
  const sessionMinutesRemaining = Math.floor(sessionTimeRemaining / (1000 * 60));
  
  const getSecurityScore = () => {
    let score = 50; // Base score
    
    if (mfaEnabled) score += 25;
    if (trustedDevices.length > 0) score += 10;
    if (metrics.failedLoginAttempts === 0) score += 10;
    if (metrics.riskScore < 30) score += 5;
    
    return Math.min(100, score);
  };

  const securityScore = getSecurityScore();
  
  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 90) return 'Excellent';
    if (score >= 70) return 'Good';
    if (score >= 50) return 'Fair';
    return 'Poor';
  };

  if (!user) return null;

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Authentication Status
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Security Score */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Security Score</span>
            <span className={`text-sm font-bold ${getScoreColor(securityScore)}`}>
              {securityScore}/100 - {getScoreLabel(securityScore)}
            </span>
          </div>
          <Progress value={securityScore} className="h-2" />
        </div>

        {/* Authentication Details */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-sm">Authenticated</span>
            </div>
            <div className="flex items-center gap-2">
              {mfaEnabled ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-yellow-500" />
              )}
              <span className="text-sm">
                MFA {mfaEnabled ? 'Enabled' : 'Disabled'}
              </span>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-blue-500" />
              <span className="text-sm">
                Session: {sessionMinutesRemaining}m
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Monitor className="h-4 w-4 text-blue-500" />
              <span className="text-sm">
                {trustedDevices.length} Trusted Device{trustedDevices.length !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
        </div>

        {/* Security Metrics */}
        <div className="pt-2 border-t">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className={`text-lg font-bold ${
                metrics.failedLoginAttempts > 0 ? 'text-red-500' : 'text-green-500'
              }`}>
                {metrics.failedLoginAttempts}
              </div>
              <div className="text-xs text-muted-foreground">
                Failed Logins
              </div>
            </div>
            <div>
              <div className={`text-lg font-bold ${
                metrics.riskScore > 50 ? 'text-red-500' : 
                metrics.riskScore > 25 ? 'text-yellow-500' : 'text-green-500'
              }`}>
                {metrics.riskScore}
              </div>
              <div className="text-xs text-muted-foreground">
                Risk Score
              </div>
            </div>
            <div>
              <div className={`text-lg font-bold ${
                alerts.length > 0 ? 'text-red-500' : 'text-green-500'
              }`}>
                {alerts.length}
              </div>
              <div className="text-xs text-muted-foreground">
                Active Alerts
              </div>
            </div>
          </div>
        </div>

        {/* Active Alerts */}
        {alerts.length > 0 && (
          <div className="pt-2 border-t">
            <div className="flex items-center gap-2 mb-2">
              <Activity className="h-4 w-4 text-red-500" />
              <span className="text-sm font-medium">Active Security Alerts</span>
            </div>
            <div className="space-y-1">
              {alerts.slice(0, 3).map((alert) => (
                <div key={alert.id} className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground truncate">
                    {alert.message}
                  </span>
                  <Badge 
                    variant={alert.severity === 'critical' ? 'destructive' : 'secondary'}
                    className="text-xs"
                  >
                    {alert.severity}
                  </Badge>
                </div>
              ))}
              {alerts.length > 3 && (
                <div className="text-xs text-muted-foreground">
                  +{alerts.length - 3} more alerts
                </div>
              )}
            </div>
          </div>
        )}

        {/* User Info */}
        <div className="pt-2 border-t text-xs text-muted-foreground">
          <div>Logged in as: {user.email}</div>
          <div>Account age: {metrics.accountAge} days</div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AuthenticationStatus;