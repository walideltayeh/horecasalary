
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
      // Special case for Admin user
      if (username.toLowerCase() === 'admin') {
        if (password !== 'AlFakher2025') {
          toast.error('Invalid admin password');
          setIsLoading(false);
          return;
        }

        // First check if admin user exists in Supabase
        const { data: adminUser, error: checkError } = await supabase.auth.signInWithPassword({
          email: 'admin@horeca.app',
          password: 'AlFakher2025',
        });

        // If admin doesn't exist or there was an error logging in, create the admin account
        if (checkError) {
          console.log('Admin user not found or login error, creating account', checkError);
          
          // Handle "Email not confirmed" error - attempt to create the account regardless
          // Create admin account in Supabase
          const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
            email: 'admin@horeca.app',
            password: 'AlFakher2025',
            options: {
              data: {
                name: 'Admin',
                role: 'admin'
              },
              emailRedirectTo: window.location.origin // Add redirect URL
            }
          });
          
          if (signUpError) {
            toast.error('Failed to create admin account: ' + signUpError.message);
            console.error('Admin signup error:', signUpError);
            setIsLoading(false);
            return;
          }
          
          // For development purposes, attempt to auto-confirm the email using admin sign-in
          // This works if "Confirm email" is disabled in Supabase Auth settings
          const { data: adminData, error: adminLoginError } = await supabase.auth.signInWithPassword({
            email: 'admin@horeca.app',
            password: 'AlFakher2025',
          });
          
          if (adminLoginError) {
            if (adminLoginError.message.includes('Email not confirmed')) {
              toast.warning('Admin account created but email confirmation is required. Please check Supabase Auth settings to disable email confirmation for testing.');
            } else {
              toast.error('Login failed after admin creation: ' + adminLoginError.message);
            }
            console.error('Admin login error after creation:', adminLoginError);
            setIsLoading(false);
            
            // Show helpful message
            toast.info('For testing: You may need to disable email confirmation in Supabase Auth settings');
            return;
          }
          
          toast.success('Welcome, Admin!');
        } else {
          // Admin exists and login was successful
          toast.success('Welcome back, Admin!');
        }
        
        setIsLoading(false);
        return; // Auth state change will handle redirect
      }
      
      // For all other users, use the standard login flow
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
          <CardFooter className="flex flex-col space-y-2">
            <Button 
              type="submit" 
              className="w-full bg-custom-red hover:bg-red-700"
              disabled={isLoading}
            >
              {isLoading ? "Logging in..." : "Login"}
            </Button>
            <p className="text-xs text-gray-500">
              Note: For admin login, use admin/AlFakher2025
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default Login;
