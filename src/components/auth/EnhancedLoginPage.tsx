/**
 * Enhanced Login Page
 * 
 * Secure login with:
 * - Password strength validation
 * - Rate limiting protection
 * - MFA support
 * - Device trust management
 * - Security monitoring
 * - User-friendly registration workflow
 */

import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  CreditCardIcon, 
  Loader2, 
  Shield, 
  Eye, 
  EyeOff, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  Mail
} from "lucide-react";
import { useEnhancedAuth } from "@/contexts/EnhancedAuthContext";
import RegistrationSuccessPage from "./RegistrationSuccessPage";

interface PasswordStrengthIndicatorProps {
  password: string;
  onStrengthChange: (score: number, feedback: string[]) => void;
}

const PasswordStrengthIndicator: React.FC<PasswordStrengthIndicatorProps> = ({ 
  password, 
  onStrengthChange 
}) => {
  const { validatePasswordStrength } = useEnhancedAuth();
  const [strength, setStrength] = useState({ score: 0, feedback: [] });

  useEffect(() => {
    if (password) {
      const result = validatePasswordStrength(password);
      setStrength(result);
      onStrengthChange(result.score, result.feedback);
    } else {
      setStrength({ score: 0, feedback: [] });
      onStrengthChange(0, []);
    }
  }, [password, validatePasswordStrength, onStrengthChange]);

  const getStrengthColor = (score: number) => {
    if (score < 30) return "bg-red-500";
    if (score < 60) return "bg-yellow-500";
    if (score < 80) return "bg-blue-500";
    return "bg-green-500";
  };

  const getStrengthText = (score: number) => {
    if (score < 30) return "Weak";
    if (score < 60) return "Fair";
    if (score < 80) return "Good";
    return "Strong";
  };

  if (!password) return null;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span>Password Strength</span>
        <span className={`font-medium ${
          strength.score < 30 ? 'text-red-500' : 
          strength.score < 60 ? 'text-yellow-500' : 
          strength.score < 80 ? 'text-blue-500' : 'text-green-500'
        }`}>
          {getStrengthText(strength.score)}
        </span>
      </div>
      <Progress 
        value={strength.score} 
        className={`h-2 ${getStrengthColor(strength.score)}`}
      />
      {strength.feedback.length > 0 && (
        <div className="text-xs text-muted-foreground space-y-1">
          {strength.feedback.map((item, index) => (
            <div key={index} className="flex items-center gap-1">
              <XCircle className="h-3 w-3 text-red-500" />
              {item}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const EnhancedLoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [organizationName, setOrganizationName] = useState("");
  const [mfaCode, setMfaCode] = useState("");
  const [authType, setAuthType] = useState<"login" | "register">("login");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showMfaInput, setShowMfaInput] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState({ score: 0, feedback: [] });
  const [rateLimitWarning, setRateLimitWarning] = useState(false);
  const [showRegistrationSuccess, setShowRegistrationSuccess] = useState(false);
  const [registrationEmail, setRegistrationEmail] = useState("");
  
  const { signIn, signUp, checkSuspiciousActivity } = useEnhancedAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Check for suspicious activity on component mount
    checkSuspiciousActivity().then(suspicious => {
      if (suspicious) {
        setRateLimitWarning(true);
      }
    });
  }, [checkSuspiciousActivity]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (authType === "login") {
        await signIn(email, password, mfaCode);
        const from = (location.state as any)?.from?.pathname || "/dashboard";
        navigate(from);
      } else {
        // Registration validation
        if (password !== confirmPassword) {
          throw new Error("Passwords do not match");
        }
        
        if (passwordStrength.score < 60) {
          throw new Error("Password does not meet security requirements");
        }
        
        await signUp(email, password, organizationName);
        
        // Show registration success page instead of switching to login
        setRegistrationEmail(email);
        setShowRegistrationSuccess(true);
      }
    } catch (error: any) {
      if (error.message === 'MFA_REQUIRED') {
        setShowMfaInput(true);
        setError("Please enter your MFA code");
      } else {
        setError(error.message || "Authentication failed");
      }
      console.error("Auth error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleBackToLogin = () => {
    setShowRegistrationSuccess(false);
    setAuthType("login");
    setPassword("");
    setConfirmPassword("");
    setOrganizationName("");
    setError(null);
  };

  const handlePasswordStrengthChange = (score: number, feedback: string[]) => {
    setPasswordStrength({ score, feedback });
  };

  // Show registration success page if user just registered
  if (showRegistrationSuccess) {
    return (
      <RegistrationSuccessPage 
        email={registrationEmail}
        onBackToLogin={handleBackToLogin}
      />
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted/30 p-4">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8">
          <div className="flex items-center">
            <CreditCardIcon className="h-10 w-10 text-primary" />
            <span className="ml-2 text-2xl font-bold">Business Manager</span>
          </div>
        </div>

        {rateLimitWarning && (
          <Alert className="mb-4 border-yellow-500">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Suspicious activity detected. Enhanced security measures are active.
            </AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              {authType === "login" ? "Secure Login" : "Create Account"}
            </CardTitle>
            <CardDescription>
              {authType === "login"
                ? "Sign in to your account with enhanced security"
                : "Create a new account with enterprise-grade security"}
            </CardDescription>
          </CardHeader>
          
          <Tabs
            value={authType}
            onValueChange={(v) => {
              setAuthType(v as "login" | "register");
              setError(null);
              setShowMfaInput(false);
              setMfaCode("");
            }}
          >
            <div className="px-6">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="register">Register</TabsTrigger>
              </TabsList>
            </div>

            <form onSubmit={handleAuth}>
              <TabsContent value="login" className="space-y-4">
                <CardContent className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="your@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      autoComplete="email"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password">Password</Label>
                      <Link 
                        to="/forgot-password" 
                        className="text-sm text-primary hover:underline"
                      >
                        Forgot password?
                      </Link>
                    </div>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        autoComplete="current-password"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                  {showMfaInput && (
                    <div className="space-y-2">
                      <Label htmlFor="mfaCode">MFA Code</Label>
                      <Input
                        id="mfaCode"
                        type="text"
                        placeholder="123456"
                        value={mfaCode}
                        onChange={(e) => setMfaCode(e.target.value)}
                        maxLength={6}
                        required
                      />
                      <p className="text-xs text-muted-foreground">
                        Enter the 6-digit code from your authenticator app
                      </p>
                    </div>
                  )}
                </CardContent>
                
                <CardFooter className="flex flex-col">
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Sign in securely
                  </Button>
                </CardFooter>
              </TabsContent>

              <TabsContent value="register" className="space-y-4">
                <CardContent className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label htmlFor="remail">Email</Label>
                    <Input
                      id="remail"
                      type="email"
                      placeholder="your@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      autoComplete="email"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="orgName">Organization Name</Label>
                    <Input
                      id="orgName"
                      type="text"
                      placeholder="Your Company Name"
                      value={organizationName}
                      onChange={(e) => setOrganizationName(e.target.value)}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="rpassword">Password</Label>
                    <div className="relative">
                      <Input
                        id="rpassword"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        autoComplete="new-password"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    <PasswordStrengthIndicator 
                      password={password}
                      onStrengthChange={handlePasswordStrengthChange}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      autoComplete="new-password"
                    />
                    {confirmPassword && password !== confirmPassword && (
                      <p className="text-xs text-red-500 flex items-center gap-1">
                        <XCircle className="h-3 w-3" />
                        Passwords do not match
                      </p>
                    )}
                    {confirmPassword && password === confirmPassword && (
                      <p className="text-xs text-green-500 flex items-center gap-1">
                        <CheckCircle className="h-3 w-3" />
                        Passwords match
                      </p>
                    )}
                  </div>
                </CardContent>
                
                <CardFooter className="flex flex-col">
                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={loading || passwordStrength.score < 60 || password !== confirmPassword}
                  >
                    {loading && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Create secure account
                  </Button>
                </CardFooter>
              </TabsContent>
            </form>

            {error && (
              <div className="px-6 pb-4">
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              </div>
            )}
          </Tabs>
        </Card>

        <div className="mt-4 text-center text-sm text-muted-foreground">
          <Link to="/" className="hover:underline">
            Back to landing page
          </Link>
        </div>
      </div>
    </div>
  );
};

export default EnhancedLoginPage;