
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { Navigate } from 'react-router-dom';
import PasswordProtection from '@/components/PasswordProtection';
import { toast } from 'sonner';
import { User } from '@/types';
import { Download } from 'lucide-react';
import UserDashboard from '@/components/UserDashboard';
import CafeList from '@/components/CafeList';

const Admin: React.FC = () => {
  const { isAdmin, addUser, users } = useAuth();
  const { cafes, getCafeSize } = useData();
  const [authenticated, setAuthenticated] = useState(false);
  
  // State for new user form
  const [newUser, setNewUser] = useState({
    name: '',
    password: '',
    role: 'user' as 'admin' | 'user'
  });
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [selectedTab, setSelectedTab] = useState<string>("all");

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
      if (!newUser.name || !newUser.password) {
        toast.error("Please fill in all fields");
        return;
      }
      
      // Add user
      addUser({
        name: newUser.name,
        password: newUser.password,
        role: newUser.role
      });
      
      // Reset form
      setNewUser({
        name: '',
        password: '',
        role: 'user'
      });
      
      toast.success("User added successfully");
    } finally {
      setIsAddingUser(false);
    }
  };

  const exportToExcel = () => {
    // Prepare cafe data for export
    const cafesData = cafes.map(cafe => ({
      "Name": cafe.name,
      "Size": getCafeSize(cafe.numberOfHookahs),
      "Location": `${cafe.governorate}, ${cafe.city}`,
      "Status": cafe.status,
      "Owner": cafe.ownerName,
      "Owner Number": cafe.ownerNumber,
      "Tables": cafe.numberOfTables,
      "Hookahs": cafe.numberOfHookahs,
      "Created By": cafe.createdBy,
      "Date Added": new Date(cafe.createdAt).toLocaleDateString()
    }));

    // Create worksheet
    const worksheet = window.XLSX.utils.json_to_sheet(cafesData);
    const workbook = window.XLSX.utils.book_new();
    window.XLSX.utils.book_append_sheet(workbook, worksheet, "Cafes");
    
    // Generate Excel file and download
    window.XLSX.writeFile(workbook, "HoReCa_Cafes_Export.xlsx");
    toast.success("Cafes data exported successfully");
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
      
      {/* User List */}
      <Card>
        <CardHeader>
          <CardTitle>User List</CardTitle>
          <CardDescription>Users registered in the system</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Role</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={2} className="text-center py-4 text-muted-foreground">
                      No users found. Add some users to see them here.
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.name}</TableCell>
                      <TableCell>
                        <span className={user.role === 'admin' ? 'text-custom-red' : 'text-gray-600'}>
                          {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      
      {/* User Dashboard Tabs */}
      <Card>
        <CardHeader>
          <CardTitle>User Performance Dashboard</CardTitle>
          <CardDescription>View performance metrics by user</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all" value={selectedTab} onValueChange={setSelectedTab} className="space-y-4">
            <TabsList className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
              <TabsTrigger value="all">All Users</TabsTrigger>
              {users.filter(u => u.role === 'user').map((user) => (
                <TabsTrigger key={user.id} value={user.id}>{user.name}</TabsTrigger>
              ))}
            </TabsList>
            <TabsContent value="all" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Total Cafes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{cafes.length}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Visited Cafes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{cafes.filter(c => c.status === 'Visited' || c.status === 'Contracted').length}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Contracted Cafes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{cafes.filter(c => c.status === 'Contracted').length}</div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            
            {users.filter(u => u.role === 'user').map((user) => (
              <TabsContent key={user.id} value={user.id}>
                <UserDashboard userId={user.id} userName={user.name} />
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>
      
      {/* Cafe Management */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Cafe Database</CardTitle>
            <CardDescription>All cafes in the system</CardDescription>
          </div>
          <Button 
            variant="outline" 
            className="flex items-center gap-2 border-custom-red text-custom-red hover:bg-red-50"
            onClick={exportToExcel}
          >
            <Download className="h-4 w-4" /> Export to Excel
          </Button>
        </CardHeader>
        <CardContent>
          <CafeList adminView={true} />
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
