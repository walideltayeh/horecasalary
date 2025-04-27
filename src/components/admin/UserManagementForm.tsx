
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from 'sonner';

interface UserManagementFormProps {
  onAddUser: (userData: {
    name: string;
    email: string;
    password: string;
    role: 'admin' | 'user';
  }) => Promise<void>;
  isAddingUser: boolean;
}

const UserManagementForm: React.FC<UserManagementFormProps> = ({ onAddUser, isAddingUser }) => {
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    password: '',
    role: 'user' as 'admin' | 'user'
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewUser(prev => ({ ...prev, [name]: value }));
  };

  const handleRoleChange = (value: string) => {
    setNewUser(prev => ({ ...prev, role: value as 'admin' | 'user' }));
  };

  const handleSubmit = async () => {
    if (!newUser.name || !newUser.email || !newUser.password) {
      toast.error("Please fill in all fields");
      return;
    }

    await onAddUser(newUser);
    
    // Reset form
    setNewUser({
      name: '',
      email: '',
      password: '',
      role: 'user'
    });
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>
          <Input 
            id="name" 
            name="name"
            value={newUser.name}
            onChange={handleInputChange}
            placeholder="Enter user name" 
            className="input-with-red-outline"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input 
            id="email" 
            name="email"
            value={newUser.email}
            onChange={handleInputChange}
            placeholder="Enter user email" 
            className="input-with-red-outline"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input 
            id="password" 
            name="password"
            type="password"
            value={newUser.password}
            onChange={handleInputChange}
            placeholder="Enter user password" 
            className="input-with-red-outline"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="role">Role</Label>
          <Select
            value={newUser.role}
            onValueChange={handleRoleChange}
          >
            <SelectTrigger id="role" className="input-with-red-outline">
              <SelectValue placeholder="Select role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="user">User</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <Button
        onClick={handleSubmit}
        disabled={isAddingUser}
        className="w-full bg-custom-red hover:bg-red-700"
      >
        {isAddingUser ? 'Adding...' : 'Add User'}
      </Button>
    </div>
  );
};

export default UserManagementForm;
