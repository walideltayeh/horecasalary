
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from 'sonner';

interface PasswordProtectionProps {
  onAuthenticate: () => void;
  title: string;
}

const PasswordProtection: React.FC<PasswordProtectionProps> = ({ onAuthenticate, title }) => {
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("[PasswordProtection] Attempting authentication");
    setIsSubmitting(true);
    
    try {
      // Check if password matches
      if (password === 'AlFakher2025') {
        console.log("[PasswordProtection] Authentication successful");
        toast.success('Access granted');
        onAuthenticate();
      } else {
        console.log("[PasswordProtection] Authentication failed - incorrect password");
        toast.error('Incorrect password');
      }
    } catch (error) {
      console.error("[PasswordProtection] Authentication error:", error);
      toast.error('An error occurred during authentication');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card>
          <CardHeader>
            <CardTitle>Password Required</CardTitle>
            <CardDescription>
              Please enter the password to access the {title}
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input 
                  id="password"
                  type="password" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  className="input-with-red-outline"
                  required
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                type="submit" 
                className="w-full bg-custom-red hover:bg-red-700"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Verifying...' : 'Submit'}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default PasswordProtection;
