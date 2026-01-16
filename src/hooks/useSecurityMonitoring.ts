/**
 * Security Monitoring Hook
 * 
 * Provides real-time security monitoring and threat detection
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useEnhancedAuth } from '@/contexts/EnhancedAuthContext';

interface SecurityAlert {
  id: string;
  type: 'suspicious_login' | 'new_device' | 'multiple_failures' | 'unusual_location';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  timestamp: Date;
  details: Record<string, any>;
  acknowledged: boolean;
}

interface SecurityMetrics {
  failedLoginAttempts: number;
  uniqueIpAddresses: number;
  newDevices: number;
  riskScore: number;
  lastLoginLocation?: string;
  accountAge: number; // in days
}

export const useSecurityMonitoring = () => {
  const { user } = useEnhancedAuth();
  const [alerts, setAlerts] = useState<SecurityAlert[]>([]);
  const [metrics, setMetrics] = useState<SecurityMetrics>({
    failedLoginAttempts: 0,
    uniqueIpAddresses: 0,
    newDevices: 0,
    riskScore: 0,
    accountAge: 0
  });
  const [loading, setLoading] = useState(true);

  // Fetch security metrics
  const fetchSecurityMetrics = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Get failed login attempts in last 24 hours
      const { data: failedLogins } = await supabase
        .from('security_events')
        .select('id')
        .eq('user_id', user.id)
        .eq('event_type', 'failed_login')
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

      // Get unique IP addresses in last 7 days
      const { data: uniqueIps } = await supabase
        .from('security_events')
        .select('ip_address')
        .eq('user_id', user.id)
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
        .not('ip_address', 'is', null);

      // Get new devices in last 30 days
      const { data: newDevices } = await supabase
        .from('trusted_devices')
        .select('id')
        .eq('user_id', user.id)
        .gte('trusted_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

      // Calculate account age
      const accountCreated = new Date(user.created_at);
      const accountAge = Math.floor((Date.now() - accountCreated.getTime()) / (1000 * 60 * 60 * 24));

      // Get risk score from database function
      const { data: riskData } = await supabase.rpc('detect_suspicious_activity', {
        check_user_id: user.id
      });

      // Get last login location
      const { data: lastLogin } = await supabase
        .from('security_events')
        .select('location')
        .eq('user_id', user.id)
        .eq('event_type', 'login')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      const uniqueIpCount = new Set(uniqueIps?.map(ip => ip.ip_address) || []).size;

      setMetrics({
        failedLoginAttempts: failedLogins?.length || 0,
        uniqueIpAddresses: uniqueIpCount,
        newDevices: newDevices?.length || 0,
        riskScore: riskData || 0,
        lastLoginLocation: lastLogin?.location?.city || 'Unknown',
        accountAge
      });

    } catch (error) {
      console.error('Error fetching security metrics:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Generate security alerts based on metrics
  const generateAlerts = useCallback(() => {
    const newAlerts: SecurityAlert[] = [];

    // High number of failed login attempts
    if (metrics.failedLoginAttempts > 5) {
      newAlerts.push({
        id: 'failed-logins',
        type: 'multiple_failures',
        severity: metrics.failedLoginAttempts > 10 ? 'critical' : 'high',
        message: `${metrics.failedLoginAttempts} failed login attempts in the last 24 hours`,
        timestamp: new Date(),
        details: { count: metrics.failedLoginAttempts },
        acknowledged: false
      });
    }

    // Multiple IP addresses
    if (metrics.uniqueIpAddresses > 3) {
      newAlerts.push({
        id: 'multiple-ips',
        type: 'suspicious_login',
        severity: 'medium',
        message: `Login attempts from ${metrics.uniqueIpAddresses} different IP addresses`,
        timestamp: new Date(),
        details: { count: metrics.uniqueIpAddresses },
        acknowledged: false
      });
    }

    // New devices
    if (metrics.newDevices > 2) {
      newAlerts.push({
        id: 'new-devices',
        type: 'new_device',
        severity: 'medium',
        message: `${metrics.newDevices} new devices detected in the last 30 days`,
        timestamp: new Date(),
        details: { count: metrics.newDevices },
        acknowledged: false
      });
    }

    // High risk score
    if (metrics.riskScore > 70) {
      newAlerts.push({
        id: 'high-risk',
        type: 'suspicious_login',
        severity: 'critical',
        message: 'High risk activity detected on your account',
        timestamp: new Date(),
        details: { riskScore: metrics.riskScore },
        acknowledged: false
      });
    }

    setAlerts(newAlerts);
  }, [metrics]);

  // Acknowledge alert
  const acknowledgeAlert = useCallback((alertId: string) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId ? { ...alert, acknowledged: true } : alert
    ));
  }, []);

  // Dismiss alert
  const dismissAlert = useCallback((alertId: string) => {
    setAlerts(prev => prev.filter(alert => alert.id !== alertId));
  }, []);

  // Check for account lockout
  const checkAccountLockout = useCallback(async () => {
    if (!user) return false;

    try {
      const { data } = await supabase.rpc('is_account_locked', {
        check_user_id: user.id
      });
      return data || false;
    } catch (error) {
      console.error('Error checking account lockout:', error);
      return false;
    }
  }, [user]);

  // Report suspicious activity
  const reportSuspiciousActivity = useCallback(async (details: Record<string, any>) => {
    if (!user) return;

    try {
      await supabase.rpc('log_security_event', {
        target_user_id: user.id,
        event_type: 'suspicious_activity',
        event_details: details,
        event_risk_score: 75
      });

      // Refresh metrics after reporting
      await fetchSecurityMetrics();
    } catch (error) {
      console.error('Error reporting suspicious activity:', error);
    }
  }, [user, fetchSecurityMetrics]);

  // Get security recommendations
  const getSecurityRecommendations = useCallback(() => {
    const recommendations: string[] = [];

    if (metrics.failedLoginAttempts > 3) {
      recommendations.push('Consider enabling MFA for additional security');
    }

    if (metrics.uniqueIpAddresses > 2) {
      recommendations.push('Review your recent login locations');
    }

    if (metrics.newDevices > 1) {
      recommendations.push('Verify all trusted devices are yours');
    }

    if (metrics.riskScore > 50) {
      recommendations.push('Change your password immediately');
    }

    if (metrics.accountAge < 7) {
      recommendations.push('Complete your security setup by enabling MFA');
    }

    return recommendations;
  }, [metrics]);

  // Real-time security event subscription
  useEffect(() => {
    if (!user) return;

    const subscription = supabase
      .channel('security_events')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'security_events',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('New security event:', payload);
          // Refresh metrics when new security event is detected
          fetchSecurityMetrics();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user, fetchSecurityMetrics]);

  // Initial load and periodic refresh
  useEffect(() => {
    fetchSecurityMetrics();
    
    // Refresh metrics every 5 minutes
    const interval = setInterval(fetchSecurityMetrics, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [fetchSecurityMetrics]);

  // Generate alerts when metrics change
  useEffect(() => {
    if (!loading) {
      generateAlerts();
    }
  }, [metrics, loading, generateAlerts]);

  return {
    alerts,
    metrics,
    loading,
    acknowledgeAlert,
    dismissAlert,
    checkAccountLockout,
    reportSuspiciousActivity,
    getSecurityRecommendations,
    refreshMetrics: fetchSecurityMetrics
  };
};