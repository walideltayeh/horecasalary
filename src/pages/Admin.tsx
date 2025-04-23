
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { Navigate } from 'react-router-dom';
import PasswordProtection from '@/components/PasswordProtection';
import { toast } from 'sonner';
import { User } from '@/types';

const Admin: React.FC = () => {
  const { isAdmin, addUser } = useAuth();
  const { cafes, getCafeSize } = useData();
  const [authenticated, setAuthenticated] = useState(false);
  
  // State for new user form
  const [newUser, setNewUser] = useState({
    email: '',
    name: '',
    password: '',
    role: 'user' as 'admin' | 'user'
  });
  const [isAddingUser, setIsAddingUser] = useState(false);

  if (!isAdmin) {
    return <Navigate to="/dashboard" />;
  }
  
  if (!authenticated) {
    return <PasswordProtection onAuthenticate={() => setAuthenticated(true)} title="Admin Panel" />;
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewUser(prev => ({ ...prev, [name]: value }));
  };

  const handleRoleChange = (value: string) => {
    setNewUser(prev => ({ ...prev, role: value as 'admin' | 'user' }));
  };

  const handleAddUser = () => {
    setIsAddingUser(true);
    
    try {
      // Validate form
      if (!newUser.email || !newUser.name || !newUser.password) {
        toast.error("Please fill in all fields");
        return;
      }
      
      // Add user
      addUser({
        email: newUser.email,
        name: newUser.name,
        password: newUser.password,
        role: newUser.role
      });
      
      // Reset form
      setNewUser({
        email: '',
        name: '',
        password: '',
        role: 'user'
      });
      
      toast.success("User added successfully");
    } finally {
      setIsAddingUser(false);
    }
  };
  
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Admin Panel</h1>
        <p className="text-gray-600">Monitor user activity and cafe data</p>
      </div>
      
      {/* User Management */}
      <Card>
        <CardHeader>
          <CardTitle>User Management</CardTitle>
          <CardDescription>Add and manage users</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
            onClick={handleAddUser}
            disabled={isAddingUser}
            className="w-full bg-custom-red hover:bg-red-700"
          >
            {isAddingUser ? 'Adding...' : 'Add User'}
          </Button>
        </CardContent>
      </Card>
      
      {/* User Activity */}
      <Card>
        <CardHeader>
          <CardTitle>User Activity</CardTitle>
          <CardDescription>Review user performance and created cafes</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Cafes Created</TableHead>
                  <TableHead>Cafe Visits</TableHead>
                  <TableHead>Contracts</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {/* This section will be populated from the database */}
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-4 text-muted-foreground">
                    User activity data will appear here when users create cafes
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      
      {/* Cafe Database */}
      <Card>
        <CardHeader>
          <CardTitle>Cafe Database</CardTitle>
          <CardDescription>All cafes in the system</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead>Created By</TableHead>
                  <TableHead>Date Added</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cafes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-4 text-muted-foreground">
                      No cafes found. Add some cafes to see them here.
                    </TableCell>
                  </TableRow>
                ) : (
                  cafes.map((cafe) => (
                    <TableRow key={cafe.id}>
                      <TableCell className="font-medium">{cafe.name}</TableCell>
                      <TableCell>
                        <span className={getCafeSize(cafe.numberOfHookahs) === 'In Negotiation' ? 'text-orange-500' : 
                                         getCafeSize(cafe.numberOfHookahs) === 'Small' ? 'text-blue-500' : 
                                         getCafeSize(cafe.numberOfHookahs) === 'Medium' ? 'text-green-500' : 
                                         'text-purple-500'}>
                          {getCafeSize(cafe.numberOfHookahs)}
                        </span>
                      </TableCell>
                      <TableCell>{cafe.governorate}, {cafe.city}</TableCell>
                      <TableCell>
                        <span className={cafe.status === 'Contracted' ? 'text-green-500' : 
                                         cafe.status === 'Visited' ? 'text-blue-500' : 
                                         'text-gray-500'}>
                          {cafe.status}
                        </span>
                      </TableCell>
                      <TableCell>{cafe.ownerName}</TableCell>
                      <TableCell>{cafe.createdBy}</TableCell>
                      <TableCell>{new Date(cafe.createdAt).toLocaleDateString()}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      
      {/* System Information */}
      <Card>
        <CardHeader>
          <CardTitle>System Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-gray-50 rounded-md">
              <div className="text-sm font-medium text-gray-500">Total Cafes</div>
              <div className="text-2xl font-bold mt-1">{cafes.length}</div>
            </div>
            <div className="p-4 bg-gray-50 rounded-md">
              <div className="text-sm font-medium text-gray-500">Visited Cafes</div>
              <div className="text-2xl font-bold mt-1">{cafes.filter(c => c.status === 'Visited' || c.status === 'Contracted').length}</div>
            </div>
            <div className="p-4 bg-gray-50 rounded-md">
              <div className="text-sm font-medium text-gray-500">Contracted Cafes</div>
              <div className="text-2xl font-bold mt-1">{cafes.filter(c => c.status === 'Contracted').length}</div>
            </div>
          </div>
          
          <div className="text-center mt-8 text-sm text-gray-500">
            <p>HoReCa Salary App - Admin Panel</p>
            <p>Version 1.0.0</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Admin;
