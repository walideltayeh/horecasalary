
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { Navigate } from 'react-router-dom';
import PasswordProtection from '@/components/PasswordProtection';
import { UserPerformance } from '@/components/admin/UserPerformance';
import { CafeDatabase } from '@/components/admin/CafeDatabase';
import SystemStats from '@/components/admin/SystemStats';
import UserManagement from '@/components/admin/UserManagement';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

const Admin: React.FC = () => {
  const { isAdmin, addUser, deleteUser, updateUser, users, fetchUsers, isLoadingUsers, error } = useAuth();
  const { cafes } = useData();
  const [authenticated, setAuthenticated] = useState(false);
  const [isDeletingUser, setIsDeletingUser] = useState<string | null>(null);
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [selectedTab, setSelectedTab] = useState("all");

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
      await fetchUsers();
    } finally {
      setIsAddingUser(false);
    }
  };

  const handleEditUser = async (userId: string, userData: any) => {
    try {
      const success = await updateUser(userId, userData);
      if (success) {
        if (selectedTab === userId && userData.role === 'admin') {
          setSelectedTab("all");
        }
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
        await fetchUsers();
      } finally {
        setIsDeletingUser(null);
      }
    }
  };

  const handleRefreshUsers = async () => {
    try {
      await fetchUsers();
      toast.success("User data refreshed");
    } catch (error) {
      console.error("Error refreshing users:", error);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Admin Panel</h1>
        <p className="text-gray-600">Monitor user activity and cafe data</p>
      </div>
      
      <UserManagement
        users={users}
        isLoadingUsers={isLoadingUsers}
        error={error}
        isAddingUser={isAddingUser}
        isDeletingUser={isDeletingUser}
        onAddUser={handleAddUser}
        onEditUser={handleEditUser}
        onDeleteUser={handleDeleteUser}
        onRefreshUsers={handleRefreshUsers}
      />
      
      <UserPerformance users={users} cafes={cafes} />
      
      <CafeDatabase cafes={cafes} />
      
      <Card>
        <CardHeader>
          <CardTitle>System Information</CardTitle>
        </CardHeader>
        <CardContent>
          <SystemStats cafes={cafes} />
        </CardContent>
      </Card>
    </div>
  );
};

export default Admin;
