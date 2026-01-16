/**
 * Authentication Security Service
 * 
 * Provides enterprise-grade security features for authentication
 */

import { supabase } from '@/integrations/supabase/client';
import * as crypto from 'crypto';

export interface LoginAttempt {
  email: string;
  ip: string;
  userAgent: string;
  timestamp: Date;
  success: boolean;
  riskScore: number;
}

export interface DeviceFingerprint {
  id: string;
  userAgent: string;
  screen: string;
  timezone: number;
  language: string;
  platform: string;
  canvas: string;
}

export interface SecurityPolicy {
  maxFailedAttempts: number;
  lockoutDurationMinutes: number;
  passwordMinLength: number;
  passwordRequireUppercase: boolean;
  passwordRequireLowercase: boolean;
  passwordRequireNumbers: boolean;
  passwordRequireSpecialChars: boolean;
  passwordHistoryCount: number;
  sessionTimeoutMinutes: number;
  mfaRequired: boolean;
  trustedDeviceExpireDays: number;
}

class AuthSecurityService {
  private static instance: AuthSecurityService;
  private rateLimitCache = new Map<string, { count: number; resetTime: number }>();
  
  // Default security policy
  private defaultPolicy: SecurityPolicy = {
    maxFailedAttempts: 5,
    lockoutDurationMinutes: 15,
    passwordMinLength: 8,
    passwordRequireUppercase: true,
    passwordRequireLowercase: true,
    passwordRequireNumbers: true,
    passwordRequireSpecialChars: true,
    passwordHistoryCount: 5,
    sessionTimeoutMinutes: 30,
    mfaRequired: false,
    trustedDeviceExpireDays: 30
  };

  public static getInstance(): AuthSecurityService {
    if (!AuthSecurityService.instance) {
      AuthSecurityService.instance = new AuthSecurityService();
    }
    return AuthSecurityService.instance;
  }

  /**
   * Generate device fingerprint for device tracking
   */
  generateDeviceFingerprint(): DeviceFingerprint {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    ctx?.fillText('Device fingerprint test', 10, 10);
    
    const fingerprint: DeviceFingerprint = {
      id: '',
      userAgent: navigator.userAgent,
      screen: `${screen.width}x${screen.height}x${screen.colorDepth}`,
      timezone: new Date().getTimezoneOffset(),
      language: navigator.language,
      platform: navigator.platform,
      canvas: canvas.toDataURL()
    };
    
    // Generate hash of all fingerprint data
    const fingerprintString = Object.values(fingerprint).join('|');
    fingerprint.id = this.hashString(fingerprintString);
    
    return fingerprint;
  }

  /**
   * Check if login attempt should be rate limited
   */
  checkRateLimit(identifier: string, maxAttempts: number = 5, windowMinutes: number = 15): boolean {
    const now = Date.now();
    const windowMs = windowMinutes * 60 * 1000;
    
    const record = this.rateLimitCache.get(identifier);
    
    if (!record || now > record.resetTime) {
      // Reset or create new record
      this.rateLimitCache.set(identifier, {
        count: 1,
        resetTime: now + windowMs
      });
      return true;
    }
    
    if (record.count >= maxAttempts) {
      return false;
    }
    
    record.count++;
    return true;
  }

  /**
   * Validate password strength against policy
   */
  validatePasswordStrength(password: string, policy: SecurityPolicy = this.defaultPolicy): {
    isValid: boolean;
    score: number;
    feedback: string[];
  } {
    const feedback: string[] = [];
    let score = 0;
    
    // Length check
    if (password.length >= policy.passwordMinLength) {
      score += 20;
    } else {
      feedback.push(`Password must be at least ${policy.passwordMinLength} characters long`);
    }
    
    // Uppercase check
    if (policy.passwordRequireUppercase) {
      if (/[A-Z]/.test(password)) {
        score += 15;
      } else {
        feedback.push('Password must contain at least one uppercase letter');
      }
    }
    
    // Lowercase check
    if (policy.passwordRequireLowercase) {
      if (/[a-z]/.test(password)) {
        score += 15;
      } else {
        feedback.push('Password must contain at least one lowercase letter');
      }
    }
    
    // Numbers check
    if (policy.passwordRequireNumbers) {
      if (/\d/.test(password)) {
        score += 15;
      } else {
        feedback.push('Password must contain at least one number');
      }
    }
    
    // Special characters check
    if (policy.passwordRequireSpecialChars) {
      if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
        score += 15;
      } else {
        feedback.push('Password must contain at least one special character');
      }
    }
    
    // Additional complexity checks
    if (password.length >= 12) score += 10;
    if (/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])/.test(password)) score += 10;
    
    // Penalty for common patterns
    if (/(.)\1{2,}/.test(password)) {
      score -= 10;
      feedback.push('Avoid repeating characters');
    }
    
    if (/123|abc|qwe|password|admin/i.test(password)) {
      score -= 20;
      feedback.push('Avoid common patterns and words');
    }
    
    score = Math.max(0, Math.min(100, score));
    
    return {
      isValid: score >= 70 && feedback.length === 0,
      score,
      feedback
    };
  }

  /**
   * Check if password was used recently
   */
  async checkPasswordHistory(userId: string, newPasswordHash: string): Promise<boolean> {
    try {
      const { data } = await supabase
        .from('password_history')
        .select('password_hash')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(this.defaultPolicy.passwordHistoryCount);
      
      return data?.some(record => record.password_hash === newPasswordHash) || false;
    } catch (error) {
      console.error('Error checking password history:', error);
      return false;
    }
  }

  /**
   * Log security event
   */
  async logSecurityEvent(
    userId: string,
    eventType: string,
    details: Record<string, any> = {},
    riskScore: number = 0
  ): Promise<void> {
    try {
      const ip = await this.getCurrentIP();
      
      await supabase.rpc('log_security_event', {
        target_user_id: userId,
        event_type: eventType,
        event_ip: ip,
        event_user_agent: navigator.userAgent,
        event_details: details,
        event_risk_score: riskScore
      });
    } catch (error) {
      console.error('Error logging security event:', error);
    }
  }

  /**
   * Calculate risk score for login attempt
   */
  calculateRiskScore(attempt: Partial<LoginAttempt>): number {
    let riskScore = 0;
    
    // Time-based risk (unusual hours)
    const hour = new Date().getHours();
    if (hour < 6 || hour > 22) {
      riskScore += 10;
    }
    
    // Frequency-based risk would require checking recent attempts
    // This would be implemented with database queries
    
    // Geographic risk would require IP geolocation
    // This would be implemented with a geolocation service
    
    // Device risk (new device)
    // This would be checked against trusted devices
    
    return Math.min(100, riskScore);
  }

  /**
   * Check if account is locked
   */
  async isAccountLocked(userId?: string, email?: string): Promise<boolean> {
    try {
      const { data } = await supabase.rpc('is_account_locked', {
        check_user_id: userId || null,
        check_email: email || null
      });
      
      return data || false;
    } catch (error) {
      console.error('Error checking account lockout:', error);
      return false;
    }
  }

  /**
   * Lock account due to suspicious activity
   */
  async lockAccount(
    userId?: string, 
    email?: string, 
    reason: string = 'Multiple failed login attempts',
    durationMinutes: number = 15
  ): Promise<void> {
    try {
      await supabase.rpc('lock_account', {
        target_user_id: userId || null,
        target_email: email || null,
        lock_reason: reason,
        lock_duration_minutes: durationMinutes
      });
      
      if (userId) {
        await this.logSecurityEvent(userId, 'account_locked', { reason, durationMinutes }, 90);
      }
    } catch (error) {
      console.error('Error locking account:', error);
    }
  }

  /**
   * Verify device trust status
   */
  async isDeviceTrusted(userId: string, deviceId: string): Promise<boolean> {
    try {
      const { data } = await supabase
        .from('trusted_devices')
        .select('id')
        .eq('user_id', userId)
        .eq('device_id', deviceId)
        .eq('is_active', true)
        .single();
      
      return !!data;
    } catch (error) {
      return false;
    }
  }

  /**
   * Add device to trusted list
   */
  async trustDevice(userId: string, deviceFingerprint: DeviceFingerprint): Promise<void> {
    try {
      await supabase.from('trusted_devices').upsert({
        user_id: userId,
        device_id: deviceFingerprint.id,
        device_name: this.getDeviceName(deviceFingerprint),
        device_type: this.getDeviceType(deviceFingerprint.userAgent),
        user_agent: deviceFingerprint.userAgent,
        ip_address: await this.getCurrentIP(),
        is_active: true,
        last_seen_at: new Date().toISOString()
      });
      
      await this.logSecurityEvent(userId, 'device_trusted', { deviceId: deviceFingerprint.id });
    } catch (error) {
      console.error('Error trusting device:', error);
    }
  }

  /**
   * Generate secure random token
   */
  generateSecureToken(length: number = 32): string {
    const array = new Uint8Array(length);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Hash string using SHA-256
   */
  private hashString(input: string): string {
    const encoder = new TextEncoder();
    const data = encoder.encode(input);
    return crypto.subtle.digest('SHA-256', data).then(hash => {
      return Array.from(new Uint8Array(hash))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
    }).toString();
  }

  /**
   * Get current IP address
   */
  private async getCurrentIP(): Promise<string> {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip;
    } catch (error) {
      return 'unknown';
    }
  }

  /**
   * Get device name from fingerprint
   */
  private getDeviceName(fingerprint: DeviceFingerprint): string {
    const ua = fingerprint.userAgent;
    
    if (ua.includes('Windows')) return 'Windows Device';
    if (ua.includes('Mac')) return 'Mac Device';
    if (ua.includes('Linux')) return 'Linux Device';
    if (ua.includes('Android')) return 'Android Device';
    if (ua.includes('iPhone') || ua.includes('iPad')) return 'iOS Device';
    
    return 'Unknown Device';
  }

  /**
   * Get device type from user agent
   */
  private getDeviceType(userAgent: string): string {
    if (/Mobile|Android|iPhone|iPad/.test(userAgent)) return 'mobile';
    if (/Tablet|iPad/.test(userAgent)) return 'tablet';
    return 'desktop';
  }

  /**
   * Clean up expired security data
   */
  async cleanupExpiredData(): Promise<void> {
    try {
      // Clean up old security events
      await supabase.rpc('cleanup_security_events');
      
      // Clean up expired trusted devices
      const expireDate = new Date();
      expireDate.setDate(expireDate.getDate() - this.defaultPolicy.trustedDeviceExpireDays);
      
      await supabase
        .from('trusted_devices')
        .update({ is_active: false })
        .lt('last_seen_at', expireDate.toISOString());
        
    } catch (error) {
      console.error('Error cleaning up expired data:', error);
    }
  }
}

export const authSecurityService = AuthSecurityService.getInstance();