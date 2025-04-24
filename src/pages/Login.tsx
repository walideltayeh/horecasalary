
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useAuth } from '@/contexts/AuthContext';
import { Navigate, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { user, login } = useAuth();
  const navigate = useNavigate();
  
  // Redirect authenticated users
  if (user) {
    if (user.role === 'admin') {
      return <Navigate to="/dashboard" />;
    } else {
      return <Navigate to="/user-app" />;
    }
  }
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // For Admin user, we need to handle it differently
      if (username.toLowerCase() === 'admin') {
        if (password === 'AlFakher2025') {
          // Try to sign in with admin@horeca.app
          const { data, error } = await supabase.auth.signInWithPassword({
            email: 'admin@horeca.app',
            password: 'AlFakher2025',
          });
          
          if (error) {
            // If admin user doesn't exist in Supabase yet, create it
            const { error: signUpError } = await supabase.auth.signUp({
              email: 'admin@horeca.app',
              password: 'AlFakher2025',
              options: {
                data: {
                  name: 'Admin',
                  role: 'admin'
                }
              }
            });
            
            if (signUpError) {
              toast.error('Failed to create admin account: ' + signUpError.message);
              setIsLoading(false);
              return;
            }
            
            // Login again with newly created account
            const { error: loginError } = await supabase.auth.signInWithPassword({
              email: 'admin@horeca.app',
              password: 'AlFakher2025',
            });
            
            if (loginError) {
              toast.error('Login failed after admin creation: ' + loginError.message);
              setIsLoading(false);
              return;
            }
            
            toast.success('Welcome, Admin!');
          } else {
            toast.success('Welcome back, Admin!');
          }
          return; // Auth state change will handle redirect
        } else {
          toast.error('Invalid admin password');
          setIsLoading(false);
          return;
        }
      }
      
      // For regular users, use the standard login flow
      const success = await login(username, password);
      
      if (!success) {
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Login error:', error);
      toast.error('An unexpected error occurred');
      setIsLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-custom-red">HoReCa Salary App</CardTitle>
          <CardDescription>Login to access your dashboard</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username or Email</Label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username or email"
                className="input-with-red-outline"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="input-with-red-outline"
                required
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              type="submit" 
              className="w-full bg-custom-red hover:bg-red-700"
              disabled={isLoading}
            >
              {isLoading ? "Logging in..." : "Login"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default Login;
