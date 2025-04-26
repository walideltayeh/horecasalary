
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { toast } from 'sonner';

const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { user, login } = useAuth();
  
  // Debug: Log when component mounts and when user state changes
  useEffect(() => {
    console.log('Login component mounted, current user:', user);
  }, [user]);
  
  // If user is already authenticated, redirect
  if (user) {
    console.log('User already authenticated, redirecting to:', user.role === 'admin' ? '/dashboard' : '/user-app');
    return <Navigate to={user.role === 'admin' ? '/dashboard' : '/user-app'} />;
  }
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username || !password) {
      toast.error('Please enter both username and password');
      return;
    }
    
    setIsLoading(true);
    console.log('Starting login process for:', username);
    
    try {
      // Handle admin login
      if (username.toLowerCase() === 'admin') {
        console.log('Using admin login flow');
        if (password !== 'AlFakher2025') {
          toast.error('Invalid admin password');
          setIsLoading(false);
          return;
        }
        
        const success = await login('admin@horeca.app', 'AlFakher2025');
        console.log('Admin login result:', success);
        
        if (success) {
          toast.success('Welcome back, Admin!');
          console.log('Admin login successful');
          window.location.href = '/dashboard';
        } else {
          toast.error('Failed to login. Please try again.');
        }
      } else {
        // Handle regular user login
        const email = username.includes('@') ? username : `${username}@horeca.app`;
        console.log('Standard user login attempt with email:', email);
        
        const success = await login(email, password);
        console.log('Login result:', success);
        
        if (success) {
          toast.success(`Welcome, ${username}!`);
          console.log('Login successful, redirecting to user app');
          window.location.href = '/user-app';
        } else {
          toast.error('Invalid credentials');
        }
      }
    } catch (error) {
      console.error('Login error:', error);
      toast.error('An unexpected error occurred');
    } finally {
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
                onChange={e => setUsername(e.target.value)} 
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
                onChange={e => setPassword(e.target.value)} 
                placeholder="Enter your password" 
                className="input-with-red-outline" 
                required 
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-2">
            <Button type="submit" className="w-full bg-custom-red hover:bg-red-700" disabled={isLoading}>
              {isLoading ? "Logging in..." : "Login"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default Login;
