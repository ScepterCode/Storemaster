/**
 * Security Alerts Component
 * 
 * Displays real-time security alerts and recommendations
 */

import React from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  AlertTriangle, 
  Shield, 
  X, 
  Check, 
  Eye,
  Smartphone,
  MapPin,
  Clock
} from 'lucide-react';
import { useSecurityMonitoring } from '@/hooks/useSecurityMonitoring';

const SecurityAlerts: React.FC = () => {
  const {
    alerts,
    metrics,
    loading,
    acknowledgeAlert,
    dismissAlert,
    getSecurityRecommendations
  } = useSecurityMonitoring();

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'border-red-500 bg-red-50';
      case 'high': return 'border-orange-500 bg-orange-50';
      case 'medium': return 'border-yellow-500 bg-yellow-50';
      case 'low': return 'border-blue-500 bg-blue-50';
      default: return 'border-gray-500 bg-gray-50';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
      case 'high':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'medium':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'low':
        return <Shield className="h-4 w-4 text-blue-500" />;
      default:
        return <Eye className="h-4 w-4 text-gray-500" />;
    }
  };

  const recommendations = getSecurityRecommendations();

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Security Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-2">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Security Metrics Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Security Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-red-500">
                {metrics.failedLoginAttempts}
              </div>
              <div className="text-xs text-muted-foreground">
                Failed Logins (24h)
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-500">
                {metrics.uniqueIpAddresses}
              </div>
              <div className="text-xs text-muted-foreground">
                Unique IPs (7d)
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-500">
                {metrics.newDevices}
              </div>
              <div className="text-xs text-muted-foreground">
                New Devices (30d)
              </div>
            </div>
            <div className="text-center">
              <div className={`text-2xl font-bold ${
                metrics.riskScore > 70 ? 'text-red-500' :
                metrics.riskScore > 40 ? 'text-yellow-500' : 'text-green-500'
              }`}>
                {metrics.riskScore}
              </div>
              <div className="text-xs text-muted-foreground">
                Risk Score
              </div>
            </div>
          </div>

          {metrics.lastLoginLocation && (
            <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4" />
              Last login from: {metrics.lastLoginLocation}
            </div>
          )}

          <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            Account age: {metrics.accountAge} days
          </div>
        </CardContent>
      </Card>

      {/* Active Security Alerts */}
      {alerts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Security Alerts
              <Badge variant="destructive">{alerts.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {alerts.map((alert) => (
              <Alert 
                key={alert.id} 
                className={`${getSeverityColor(alert.severity)} ${
                  alert.acknowledged ? 'opacity-60' : ''
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-2">
                    {getSeverityIcon(alert.severity)}
                    <div className="flex-1">
                      <AlertTitle className="flex items-center gap-2">
                        {alert.message}
                        <Badge variant="outline" className="text-xs">
                          {alert.severity}
                        </Badge>
                      </AlertTitle>
                      <AlertDescription className="text-xs text-muted-foreground">
                        {alert.timestamp.toLocaleString()}
                      </AlertDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {!alert.acknowledged && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => acknowledgeAlert(alert.id)}
                        className="h-6 w-6 p-0"
                      >
                        <Check className="h-3 w-3" />
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => dismissAlert(alert.id)}
                      className="h-6 w-6 p-0"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </Alert>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Security Recommendations */}
      {recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Smartphone className="h-5 w-5" />
              Security Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {recommendations.map((recommendation, index) => (
                <div key={index} className="flex items-center gap-2 text-sm">
                  <Shield className="h-4 w-4 text-blue-500" />
                  {recommendation}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* All Clear Status */}
      {alerts.length === 0 && recommendations.length === 0 && (
        <Alert className="border-green-500 bg-green-50">
          <Shield className="h-4 w-4 text-green-500" />
          <AlertTitle>Security Status: All Clear</AlertTitle>
          <AlertDescription>
            No security issues detected. Your account is secure.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default SecurityAlerts;