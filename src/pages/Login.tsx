
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useAuth } from '@/contexts/AuthContext';
import { Navigate, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user, login, isLoading, session } = useAuth();
  const navigate = useNavigate();
  
  useEffect(() => {
    console.log('Login component mounted, current user:', user);
    console.log('Login component current session:', session);
  }, [user, session]);
  
  // Reset submitting state when loading changes
  useEffect(() => {
    if (!isLoading) {
      setIsSubmitting(false);
    }
  }, [isLoading]);
  
  // Effect to handle navigation after login
  useEffect(() => {
    if (user && !isLoading) {
      console.log('User authenticated in Login, redirecting to:', user.role === 'admin' ? '/dashboard' : '/user-app');
      
      // Short timeout to ensure state has settled
      setTimeout(() => {
        navigate(user.role === 'admin' ? '/dashboard' : '/user-app', { replace: true });
      }, 100);
    }
  }, [user, isLoading, navigate]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username || !password) {
      toast.error('Please enter both username and password');
      return;
    }
    
    console.log('Starting login process for:', username);
    setIsSubmitting(true);
    
    try {
      const email = username.includes('@') ? username : `${username}@horeca.app`;
      console.log('Standard user login attempt with email:', email);
      
      const success = await login(email, password);
      console.log('Login result:', success);
      
      if (success) {
        toast.success(`Welcome back!`);
        console.log('Login successful, redirecting...');
      } else {
        toast.error('Invalid credentials. Your password might be compromised or incorrect.');
        setIsSubmitting(false);
      }
    } catch (error) {
      console.error('Login error:', error);
      toast.error('An unexpected error occurred. Please ensure your password is secure.');
      setIsSubmitting(false);
    }
  };
  
  // If already logged in and not in the process of logging out, redirect immediately
  if (user && !isLoading && !isSubmitting) {
    console.log('User already logged in, redirecting from Login page');
    return <Navigate to={user.role === 'admin' ? '/dashboard' : '/user-app'} replace />;
  }
  
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
                onChange={e => setUsername(e.target.value)} 
                placeholder="Enter your username or email" 
                className="input-with-red-outline" 
                required 
                disabled={isSubmitting || isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input 
                id="password" 
                type="password" 
                value={password} 
                onChange={e => setPassword(e.target.value)} 
                placeholder="Enter your password" 
                className="input-with-red-outline" 
                required 
                disabled={isSubmitting || isLoading}
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-2">
            <Button 
              type="submit" 
              className="w-full bg-custom-red hover:bg-red-700" 
              disabled={isLoading || isSubmitting}
            >
              {isSubmitting ? "Logging in..." : "Login"}
            </Button>
            <div className="text-sm text-center mt-2">
              {(isLoading || isSubmitting) && "Please wait..."}
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default Login;
