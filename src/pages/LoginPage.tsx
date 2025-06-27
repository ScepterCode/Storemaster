import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CreditCardIcon, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authType, setAuthType] = useState<"login" | "register">("login");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (authType === "login") {
        await signIn(email, password);
        navigate("/");
      } else {
        await signUp(email, password);
        // Stay on login screen after registration for them to sign in
        setAuthType("login");
      }
    } catch (error) {
      setError(error.message || "Authentication failed");
      console.error("Auth error:", error);
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
            <CardTitle className="text-2xl">
              {authType === "login" ? "Welcome back" : "Create an account"}
            </CardTitle>
            <CardDescription>
              {authType === "login"
                ? "Sign in to your account to continue"
                : "Enter your details to create an account"}
            </CardDescription>
          </CardHeader>
          <Tabs
            value={authType}
            onValueChange={(v) => setAuthType(v as "login" | "register")}
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
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password">Password</Label>
                    </div>
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>
                </CardContent>
                <CardFooter className="flex flex-col">
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Sign in
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
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="rpassword">Password</Label>
                    <Input
                      id="rpassword"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={6}
                    />
                    <p className="text-xs text-muted-foreground">
                      Password must be at least 6 characters long
                    </p>
                  </div>
                </CardContent>
                <CardFooter className="flex flex-col">
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Create account
                  </Button>
                </CardFooter>
              </TabsContent>
            </form>

            {error && (
              <div className="px-6 pb-4">
                <p className="text-sm text-destructive">{error}</p>
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

export default LoginPage;
