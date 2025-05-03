
import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useAdminPage } from '@/hooks/admin/useAdminPage';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AdminHeader from '@/components/admin/AdminHeader';
import StatsOverview from '@/components/admin/StatsOverview';
import UserManagement from '@/components/admin/UserManagement';
import SystemStats from '@/components/admin/SystemStats';
import CafeDatabase from '@/components/admin/CafeDatabase';
import DeletionLogs from '@/components/admin/DeletionLogs';
import { toast } from '@/components/ui/use-toast';

const Admin: React.FC = () => {
  const { user, isAdmin, addUser: authAddUser, deleteUser, updateUser, users, fetchUsers } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const {
    isLoadingUsers,
    cafes,
    loadingCafes,
    refreshCafes,
    isAddingUser,
    isDeletingUser
  } = useAdminPage();

  // Explicit check for user data on component mount
  useEffect(() => {
    if (user && isAdmin) {
      console.log("Admin component mounted - forcing user data refresh");
      // Try to force fetch users data with explicit error handling
      try {
        fetchUsers(true);
      } catch (error) {
        console.error("Error fetching users on Admin mount:", error);
        toast.error("Error loading user data. Please try refreshing the page.");
      }
    }
  }, [user, isAdmin, fetchUsers]);

  // Display debug info about authentication state
  useEffect(() => {
    console.log("Admin authentication state:", { 
      user: user?.id, 
      isAdmin, 
      usersLoaded: users.length,
      authenticatedAndAdmin: !!(user && isAdmin)
    });
  }, [user, isAdmin, users]);

  // Create a wrapper function to convert Promise<boolean> to Promise<void>
  const addUser = async (userData: { name: string; email: string; password: string; role: 'admin' | 'user' }) => {
    try {
      const result = await authAddUser(userData);
      if (result) {
        toast.success(`User ${userData.name} added successfully`);
        // Force refresh users list
        fetchUsers(true);
      }
    } catch (error) {
      console.error("Error adding user:", error);
      toast.error("Failed to add user. Please try again.");
    }
  };

  // If not admin or not logged in, redirect to login
  if (!user || !isAdmin) {
    console.log("Not admin or not logged in, redirecting to login", { user: !!user, isAdmin });
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-white">
      <AdminHeader 
        onRefreshCafes={refreshCafes} 
        loadingCafes={loadingCafes} 
      />

      <div className="container mx-auto py-8">
        <Tabs 
          defaultValue="dashboard" 
          value={activeTab}
          onValueChange={setActiveTab} 
          className="space-y-4"
        >
          <TabsList className="grid md:grid-cols-5 grid-cols-3 md:max-w-lg mb-4">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="kpi">KPI</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="cafes">Cafes</TabsTrigger>
            <TabsTrigger value="logs">Logs</TabsTrigger>
          </TabsList>
          
          <TabsContent value="dashboard">
            <StatsOverview cafes={cafes} />
          </TabsContent>
          
          <TabsContent value="kpi">
            <SystemStats cafes={cafes} />
          </TabsContent>
          
          <TabsContent value="users">
            <UserManagement
              users={users}
              isLoadingUsers={isLoadingUsers}
              error={null}
              onAddUser={addUser}
              onEditUser={updateUser}
              onDeleteUser={deleteUser}
              onRefreshUsers={() => fetchUsers(true)}
              isAddingUser={isAddingUser}
              isDeletingUser={isDeletingUser}
            />
          </TabsContent>
          
          <TabsContent value="cafes">
            <CafeDatabase cafes={cafes} />
          </TabsContent>
          
          <TabsContent value="logs">
            <DeletionLogs />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Admin;
