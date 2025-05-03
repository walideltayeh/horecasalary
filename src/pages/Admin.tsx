
import React, { useState } from 'react';
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

const Admin: React.FC = () => {
  const { user, isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const {
    users,
    isLoadingUsers, // Corrected from usersLoading
    error: usersError, // Corrected from usersError
    addUser,
    updateUser,
    deleteUser,
    refreshUsers,
    isAddingUser,
    isDeletingUser,
    cafes, // Add cafes to destructuring
    loadingCafes // Add loadingCafes to destructuring
  } = useAdminPage();

  if (!user || !isAdmin) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-white">
      <AdminHeader 
        onRefreshCafes={refreshUsers} // Pass appropriate props based on AdminHeader component
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
              error={usersError}
              onAddUser={addUser}
              onEditUser={updateUser}
              onDeleteUser={deleteUser}
              onRefreshUsers={refreshUsers}
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
