
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
import { Download, Edit, Trash2 } from 'lucide-react';
import UserDashboard from '@/components/UserDashboard';
import CafeList from '@/components/CafeList';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

// This is needed to fix the TypeScript error with the XLSX library
declare global {
  interface Window {
    XLSX: any;
  }
}

const Admin: React.FC = () => {
  const { isAdmin, addUser, deleteUser, updateUser, users } = useAuth();
  const { cafes, getCafeSize } = useData();
  const [authenticated, setAuthenticated] = useState(false);
  const [isDeletingUser, setIsDeletingUser] = useState<string | null>(null);
  const [isEditingUser, setIsEditingUser] = useState<string | null>(null);
  
  // State for new user form
  const [newUser, setNewUser] = useState({
    name: '',
    password: '',
    role: 'user' as 'admin' | 'user'
  });
  
  // State for editing user
  const [editUser, setEditUser] = useState({
    id: '',
    name: '',
    password: '',
    role: 'user' as 'admin' | 'user'
  });
  
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [selectedTab, setSelectedTab] = useState<string>("all");
  const [editDialogOpen, setEditDialogOpen] = useState(false);

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

  const handleEditInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditUser(prev => ({ ...prev, [name]: value }));
  };

  const handleRoleChange = (value: string) => {
    setNewUser(prev => ({ ...prev, role: value as 'admin' | 'user' }));
  };

  const handleEditRoleChange = (value: string) => {
    setEditUser(prev => ({ ...prev, role: value as 'admin' | 'user' }));
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

  const handleEditUser = async () => {
    try {
      // Validate form
      if (!editUser.name) {
        toast.error("Username is required");
        return;
      }
      
      const updateData: {
        name: string;
        role: 'admin' | 'user';
        password?: string;
      } = {
        name: editUser.name,
        role: editUser.role
      };
      
      // Only include password if it was changed (not empty)
      if (editUser.password) {
        updateData.password = editUser.password;
      }
      
      const success = await updateUser(editUser.id, updateData);
      
      if (success) {
        setEditDialogOpen(false);
        // If we're on the edited user's tab and the user's role changed to admin, switch to "all" tab
        if (selectedTab === editUser.id && editUser.role === 'admin') {
          setSelectedTab("all");
        }
      }
    } catch (error) {
      console.error("Error updating user:", error);
      toast.error("Failed to update user");
    }
  };

  const openEditDialog = (user: User) => {
    setEditUser({
      id: user.id,
      name: user.name,
      password: '',  // Don't fill in existing password for security
      role: user.role
    });
    setIsEditingUser(user.id);
    setEditDialogOpen(true);
  };

  const handleDeleteUser = async (userId: string, userName: string) => {
    if (confirm(`Are you sure you want to delete the user "${userName}"? This action cannot be undone.`)) {
      setIsDeletingUser(userId);
      try {
        const success = await deleteUser(userId);
        if (success && selectedTab === userId) {
          // If we're on the deleted user's tab, switch to "all"
          setSelectedTab("all");
        }
      } finally {
        setIsDeletingUser(null);
      }
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
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center py-4 text-muted-foreground">
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
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          <Button
                            variant="ghost" 
                            size="sm"
                            onClick={() => openEditDialog(user)}
                            className="text-blue-600 hover:text-blue-800 hover:bg-blue-100"
                          >
                            <Edit className="h-4 w-4" />
                            <span className="sr-only">Edit</span>
                          </Button>
                          
                          {/* Don't allow deleting the main admin account */}
                          {!(user.name === 'Admin' && user.role === 'admin') && (
                            <Button
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleDeleteUser(user.id, user.name)}
                              disabled={isDeletingUser === user.id}
                              className="text-red-600 hover:text-red-800 hover:bg-red-100"
                            >
                              <Trash2 className="h-4 w-4" />
                              <span className="sr-only">Delete</span>
                            </Button>
                          )}
                        </div>
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
      
      {/* Edit User Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Update user information. Leave password blank to keep the current password.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Name</Label>
              <Input 
                id="edit-name" 
                name="name"
                value={editUser.name}
                onChange={handleEditInputChange}
                placeholder="Enter user name" 
                className="input-with-red-outline"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-password">Password</Label>
              <Input 
                id="edit-password" 
                name="password"
                type="password"
                value={editUser.password}
                onChange={handleEditInputChange}
                placeholder="Enter new password (or leave blank)" 
                className="input-with-red-outline"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-role">Role</Label>
              <Select
                value={editUser.role}
                onValueChange={handleEditRoleChange}
                disabled={editUser.id === 'admin'} // Don't allow changing admin role
              >
                <SelectTrigger id="edit-role" className="input-with-red-outline">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="user">User</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              className="bg-custom-red hover:bg-red-700"
              onClick={handleEditUser}
              disabled={isEditingUser !== null && isEditingUser === editUser.id}
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Admin;
