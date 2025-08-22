
"use client";

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, KeyRound, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useSqlAuth } from '@/components/sql-auth-provider';
import { useRouter } from 'next/navigation';

const ADMIN_EMAIL = 'admin@fbr.gov.pk';

const LoadingOverlay = () => (
    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="mt-4 text-lg font-medium text-foreground">Signing in...</p>
        <p className="text-sm text-muted-foreground">Please wait while we prepare your dashboard.</p>
    </div>
);

export default function AuthPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const { toast } = useToast();
  const auth = useSqlAuth();
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!email || !password) {
        throw new Error('Please enter both email and password.');
      }
      
      const success = await auth.login(email, password);
      
      if (success) {
        // Manually redirect after successful login for a faster user experience
        if (email === ADMIN_EMAIL) {
          router.push('/admin');
        } else {
          router.push('/');
        }
      } else {
        setLoading(false);
      }

    } catch (error: unknown) {
      const isUserNotFound = error instanceof Error && (
          error.message.includes('Invalid email or password') || 
          error.message.includes('User not found')
      );

      if (isUserNotFound && email === ADMIN_EMAIL) {
        // If the admin user does not exist, create them on the first login attempt.
        try {
          await auth.createUser(email, password);
          // Try to login again after creating the user
          const loginSuccess = await auth.login(email, password);
          if (loginSuccess) {
            router.push('/admin');
          } else {
            setLoading(false);
          }
        } catch (creationError: unknown) {
          toast({
            title: "Admin Creation Failed",
            description: creationError instanceof Error ? creationError.message : "Could not create the admin account.",
            variant: "destructive",
          });
          setLoading(false);
        }
      } else {
        let description = 'An unknown error occurred.';
        if (error instanceof Error) {
          if (error.message.includes('Invalid email or password') || 
              error.message.includes('User not found') ||
              error.message.includes('Wrong password')) {
            description = 'Invalid email or password. Please try again.';
          } else {
            description = error.message;
          }
        } else {
             description = (error as Error).message;
        }
        toast({
          title: "Authentication Failed",
          description,
          variant: "destructive",
        });
        setLoading(false);
      }
    } 
    // We don't set loading to false in the success case because the page will unmount on redirection.
  };

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-background p-4">
        {loading && <LoadingOverlay />}
        <div className="flex items-center gap-2 mb-6">
            <KeyRound className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold">InvoicePilot</h1>
        </div>
        <Card className="w-full max-w-md">
            <CardHeader className="space-y-1">
                <CardTitle className="text-2xl text-center">Sign In</CardTitle>
                <CardDescription className="text-center">
                    Enter your credentials to access your account
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                            id="email"
                            type="email"
                            placeholder="Enter your email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="password">Password</Label>
                        <div className="relative">
                            <Input
                                id="password"
                                type={isPasswordVisible ? "text" : "password"}
                                placeholder="Enter your password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                onClick={() => setIsPasswordVisible(!isPasswordVisible)}
                            >
                                {isPasswordVisible ? (
                                    <EyeOff className="h-4 w-4" />
                                ) : (
                                    <Eye className="h-4 w-4" />
                                )}
                            </Button>
                        </div>
                    </div>
                    {email === ADMIN_EMAIL && (
                        <p className="text-xs text-muted-foreground">
                            Default Admin: admin@fbr.gov.pk
                        </p>
                    )}
                    <Button type="submit" className="w-full" disabled={loading}>
                        Sign In
                    </Button>
                </form>
            </CardContent>
        </Card>
    </div>
  );
}
