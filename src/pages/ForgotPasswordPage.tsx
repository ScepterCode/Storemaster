import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CreditCardIcon, Loader2, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;

      setSuccess(true);
    } catch (error: any) {
      setError(error.message || "Failed to send reset email");
      console.error("Reset password error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted/30 p-4">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8">
          <div className="flex items-center">
            <CreditCardIcon className="h-10 w-10 text-primary" />
            <span className="ml-2 text-2xl font-bold">Business Manager</span>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Reset Password</CardTitle>
            <CardDescription>
              Enter your email address and we'll send you a link to reset your password
            </CardDescription>
          </CardHeader>

          {success ? (
            <CardContent className="space-y-4">
              <div className="flex flex-col items-center justify-center py-6 text-center">
                <CheckCircle2 className="h-12 w-12 text-green-500 mb-4" />
                <h3 className="text-lg font-semibold mb-2">Check your email</h3>
                <p className="text-sm text-muted-foreground">
                  We've sent a password reset link to <strong>{email}</strong>
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  Click the link in the email to reset your password.
                </p>
              </div>
            </CardContent>
          ) : (
            <form onSubmit={handleResetPassword}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                {error && (
                  <p className="text-sm text-destructive">{error}</p>
                )}
              </CardContent>
              <CardFooter className="flex flex-col space-y-4">
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Send Reset Link
                </Button>
                <Link 
                  to="/login" 
                  className="text-sm text-center text-muted-foreground hover:text-primary"
                >
                  Back to login
                </Link>
              </CardFooter>
            </form>
          )}
        </Card>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
