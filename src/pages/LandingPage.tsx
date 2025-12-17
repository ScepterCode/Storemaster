
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';

const LandingPage: React.FC = () => {
  const { signIn, signUp, user } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Redirect if user is already logged in
  React.useEffect(() => {
    const checkAndRedirect = async () => {
      if (!user) return;

      // Check if user has an organization first
      const { data: orgMember } = await supabase
        .from('organization_members' as any)
        .select('id')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .maybeSingle();

      if (orgMember) {
        // User has organization - go to organization dashboard
        // (They can access admin panel via link in the UI)
        navigate('/dashboard');
      } else {
        // No organization - check if admin
        const { data: adminData } = await supabase
          .from('admin_users' as any)
          .select('id')
          .eq('id', user.id)
          .maybeSingle();

        if (adminData) {
          // Admin without organization - go to admin dashboard
          navigate('/admin');
        } else {
          // No organization and not admin - go to onboarding
          navigate('/onboarding/setup');
        }
      }
    };

    checkAndRedirect();
  }, [user, navigate]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    
    try {
      await signIn(email, password);
      
      // Check if user has an organization first
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (currentUser) {
        const { data: orgMember } = await supabase
          .from('organization_members' as any)
          .select('id')
          .eq('user_id', currentUser.id)
          .eq('is_active', true)
          .maybeSingle();

        if (orgMember) {
          // User has organization - go to organization dashboard
          navigate('/dashboard');
        } else {
          // No organization - check if admin
          const { data: adminData } = await supabase
            .from('admin_users' as any)
            .select('id')
            .eq('id', currentUser.id)
            .maybeSingle();

          if (adminData) {
            // Admin without organization - go to admin dashboard
            navigate('/admin');
          } else {
            // No organization and not admin - go to onboarding
            navigate('/onboarding/setup');
          }
        }
      }
    } catch (err) {
      console.error("Login error:", err);
      setError(err instanceof Error ? err.message : 'Failed to sign in');
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    
    try {
      await signUp(email, password);
      // Don't navigate after signup as they need to confirm email
    } catch (err) {
      console.error("Registration error:", err);
      setError(err instanceof Error ? err.message : 'Failed to sign up');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-sky-50 to-indigo-50 dark:from-slate-900 dark:to-slate-800 p-4">
      <div className="absolute top-8 left-8">
        <h1 className="text-2xl font-bold text-primary">StoreMaster</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-6xl">
        <div className="space-y-6 flex flex-col justify-center">
          <div>
            <h1 className="text-4xl font-bold tracking-tight">
              Manage Your Store More Effectively
            </h1>
            <p className="mt-4 text-lg text-muted-foreground">
              StoreMaster helps small businesses track inventory, manage transactions, and generate insightful reports.
            </p>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center">
              <div className="mr-4 rounded-full bg-primary/10 p-2">
                <svg className="h-5 w-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <div>
                <h3 className="font-medium">Inventory Management</h3>
                <p className="text-muted-foreground">Track stock levels and product details</p>
              </div>
            </div>
            
            <div className="flex items-center">
              <div className="mr-4 rounded-full bg-primary/10 p-2">
                <svg className="h-5 w-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3 className="font-medium">Transaction Recording</h3>
                <p className="text-muted-foreground">Log sales, purchases, and expenses</p>
              </div>
            </div>
            
            <div className="flex items-center">
              <div className="mr-4 rounded-full bg-primary/10 p-2">
                <svg className="h-5 w-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div>
                <h3 className="font-medium">Business Insights</h3>
                <p className="text-muted-foreground">Generate reports for data-driven decisions</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-center">
          <Card className="w-full max-w-md shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl">Welcome to StoreMaster</CardTitle>
              <CardDescription>Sign in to your account or create a new one</CardDescription>
            </CardHeader>
            
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="register">Register</TabsTrigger>
              </TabsList>
              
              <TabsContent value="login">
                <form onSubmit={handleSignIn}>
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
                        <a 
                          href="/forgot-password" 
                          className="text-sm text-primary hover:underline"
                        >
                          Forgot password?
                        </a>
                      </div>
                      <Input 
                        id="password" 
                        type="password" 
                        value={password} 
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />
                    </div>
                    
                    {error && (
                      <div className="text-sm text-destructive">{error}</div>
                    )}
                  </CardContent>
                  
                  <CardFooter>
                    <Button type="submit" className="w-full" disabled={loading}>
                      {loading ? 'Signing in...' : 'Sign In'}
                    </Button>
                  </CardFooter>
                </form>
              </TabsContent>
              
              <TabsContent value="register">
                <form onSubmit={handleSignUp}>
                  <CardContent className="space-y-4 pt-4">
                    <div className="space-y-2">
                      <Label htmlFor="register-email">Email</Label>
                      <Input 
                        id="register-email" 
                        type="email" 
                        placeholder="your@email.com" 
                        value={email}
                        onChange={(e) => setEmail(e.target.value)} 
                        required 
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="register-password">Password</Label>
                      <Input 
                        id="register-password" 
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required 
                      />
                      <p className="text-xs text-muted-foreground">
                        Password must be at least 6 characters long
                      </p>
                    </div>
                    
                    {error && (
                      <div className="text-sm text-destructive">{error}</div>
                    )}
                  </CardContent>
                  
                  <CardFooter>
                    <Button type="submit" className="w-full" disabled={loading}>
                      {loading ? 'Creating Account...' : 'Create Account'}
                    </Button>
                  </CardFooter>
                </form>
              </TabsContent>
            </Tabs>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
