
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { Navigate } from 'react-router-dom';
import PasswordProtection from '@/components/PasswordProtection';
import UserManagementForm from '@/components/admin/UserManagementForm';
import UserList from '@/components/admin/UserList';
import SystemStats from '@/components/admin/SystemStats';
import EditUserDialog from '@/components/admin/EditUserDialog';
import { UserPerformance } from '@/components/admin/UserPerformance';
import { CafeDatabase } from '@/components/admin/CafeDatabase';
import { User } from '@/types';
import { toast } from '@/hooks/use-toast';
import { getCafeSize } from '@/utils/cafeUtils';

const Admin: React.FC = () => {
  const { isAdmin, addUser, deleteUser, updateUser, users, fetchUsers } = useAuth();
  const { cafes } = useData();
  const [authenticated, setAuthenticated] = useState(false);
  const [isDeletingUser, setIsDeletingUser] = useState<string | null>(null);
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedTab, setSelectedTab] = useState("all");
  const [editUser, setEditUser] = useState({
    id: '',
    name: '',
    password: '',
    role: 'user' as 'admin' | 'user'
  });
  
  // Ensure users are loaded when admin page is mounted
  useEffect(() => {
    if (isAdmin && authenticated) {
      console.log("Admin page mounted, refreshing user data");
      fetchUsers();
    }
  }, [isAdmin, authenticated, fetchUsers]);
  
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
      // Refresh users list after adding a user
      await fetchUsers();
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
        // Refresh users list after editing
        await fetchUsers();
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
        // Refresh users list after deleting
        await fetchUsers();
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
    
    toast({
      title: "Export Successful",
      description: "Cafes data exported successfully",
      variant: "default"
    });
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Admin Panel</h1>
        <p className="text-gray-600">Monitor user activity and cafe data</p>
      </div>
      
      {/* User Management Section */}
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
      
      {/* User List Section */}
      <Card>
        <CardHeader>
          <CardTitle>User List</CardTitle>
          <CardDescription>Users registered in the system ({users.length})</CardDescription>
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
      
      {/* User Performance Dashboard */}
      <UserPerformance users={users} cafes={cafes} />
      
      {/* Cafe Database Section */}
      <CafeDatabase cafes={cafes} />
      
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
