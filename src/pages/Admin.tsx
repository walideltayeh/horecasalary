import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { Navigate } from 'react-router-dom';
import PasswordProtection from '@/components/PasswordProtection';
import { Download } from 'lucide-react';
import UserDashboard from '@/components/UserDashboard';
import CafeList from '@/components/CafeList';
import UserManagementForm from '@/components/admin/UserManagementForm';
import UserList from '@/components/admin/UserList';
import SystemStats from '@/components/admin/SystemStats';
import EditUserDialog from '@/components/admin/EditUserDialog';
import { User } from '@/types';

const Admin: React.FC = () => {
  const { isAdmin, addUser, deleteUser, updateUser, users } = useAuth();
  const { cafes } = useData();
  const [authenticated, setAuthenticated] = useState(false);
  const [isDeletingUser, setIsDeletingUser] = useState<string | null>(null);
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [selectedTab, setSelectedTab] = useState<string>("all");
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editUser, setEditUser] = useState({
    id: '',
    name: '',
    password: '',
    role: 'user' as 'admin' | 'user'
  });
  
  if (!isAdmin) {
    return <Navigate to="/dashboard" />;
  }
  
  if (!authenticated) {
    return <PasswordProtection onAuthenticate={() => setAuthenticated(true)} title="Admin Panel" />;
  }

  const handleAddUser = async (userData: { name: string; email: string; password: string; role: 'admin' | 'user' }) => {
    setIsAddingUser(true);
    try {
      await addUser(userData);
    } finally {
      setIsAddingUser(false);
    }
  };

  const handleEditUser = async () => {
    try {
      const success = await updateUser(editUser.id, editUser);
      if (success) {
        setEditDialogOpen(false);
        if (selectedTab === editUser.id && editUser.role === 'admin') {
          setSelectedTab("all");
        }
      }
    } catch (error) {
      console.error("Error updating user:", error);
    }
  };

  const handleDeleteUser = async (userId: string, userName: string) => {
    if (confirm(`Are you sure you want to delete the user "${userName}"? This action cannot be undone.`)) {
      setIsDeletingUser(userId);
      try {
        const success = await deleteUser(userId);
        if (success && selectedTab === userId) {
          setSelectedTab("all");
        }
      } finally {
        setIsDeletingUser(null);
      }
    }
  };

  const openEditDialog = (user: User) => {
    setEditUser({
      id: user.id,
      name: user.name,
      password: '',
      role: user.role
    });
    setEditDialogOpen(true);
  };

  const handleEditInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditUser(prev => ({ ...prev, [name]: value }));
  };

  const handleEditRoleChange = (value: string) => {
    setEditUser(prev => ({ ...prev, role: value as 'admin' | 'user' }));
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
      
      {/* User Management Form */}
      <Card>
        <CardHeader>
          <CardTitle>User Management</CardTitle>
          <CardDescription>Add and manage users</CardDescription>
        </CardHeader>
        <CardContent>
          <UserManagementForm
            onAddUser={handleAddUser}
            isAddingUser={isAddingUser}
          />
        </CardContent>
      </Card>
      
      {/* User List */}
      <Card>
        <CardHeader>
          <CardTitle>User List</CardTitle>
          <CardDescription>Users registered in the system</CardDescription>
        </CardHeader>
        <CardContent>
          <UserList
            users={users}
            onEditUser={openEditDialog}
            onDeleteUser={handleDeleteUser}
            isDeletingUser={isDeletingUser}
          />
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
                    <div className="text-2xl font-bold">
                      {cafes.filter(c => c.status === 'Visited' || c.status === 'Contracted').length}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Contracted Cafes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {cafes.filter(c => c.status === 'Contracted').length}
                    </div>
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
      
      {/* Cafe Database */}
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
        <CardContent>
          <SystemStats cafes={cafes} />
        </CardContent>
      </Card>

      {/* Edit User Dialog */}
      <EditUserDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        editUser={editUser}
        onInputChange={handleEditInputChange}
        onRoleChange={handleEditRoleChange}
        onSave={handleEditUser}
        isEditing={isDeletingUser === editUser.id}
      />
    </div>
  );
};

export default Admin;
