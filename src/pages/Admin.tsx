
import React, { useState, useEffect, useCallback, useMemo } from 'react';
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

  // Memoize admin check to prevent unnecessary re-renders
  const isAuthenticated = useMemo(() => !!(user && isAdmin), [user, isAdmin]);

  // Reduce fetch frequency with debounced fetch
  const fetchUsersWithDebounce = useCallback(() => {
    console.log("Admin component - fetching users");
    fetchUsers(true);
  }, [fetchUsers]);
  
  // Refresh cafes with debounce 
  const handleRefreshCafes = useCallback(() => {
    console.log("Admin component - refreshing cafes");
    refreshCafes();
  }, [refreshCafes]);

  // Load initial data only once
  useEffect(() => {
    if (isAuthenticated) {
      console.log("Admin component mounted - loading initial data");
      fetchUsersWithDebounce();
      handleRefreshCafes();
    }
  }, [isAuthenticated, fetchUsersWithDebounce, handleRefreshCafes]);

  // Handle cafe update events with debounce
  useEffect(() => {
    if (!isAuthenticated) return;
    
    let debounceTimer: NodeJS.Timeout | null = null;
    const lastUpdateTime = { current: Date.now() };
    
    const handleCafeDataUpdated = () => {
      // Throttle updates to prevent excessive refreshes
      const now = Date.now();
      if (now - lastUpdateTime.current < 5000) {
        return;
      }
      
      lastUpdateTime.current = now;
      
      // Debounce updates
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
      
      debounceTimer = setTimeout(() => {
        console.log("Admin detected cafe data update event - refreshing");
        handleRefreshCafes();
      }, 1000);
    };
    
    window.addEventListener('horeca_data_updated', handleCafeDataUpdated);
    window.addEventListener('cafe_added', handleCafeDataUpdated);
    
    return () => {
      window.removeEventListener('horeca_data_updated', handleCafeDataUpdated);
      window.removeEventListener('cafe_added', handleCafeDataUpdated);
      if (debounceTimer) clearTimeout(debounceTimer);
    };
  }, [isAuthenticated, handleRefreshCafes]);

  // Create a wrapper function to convert Promise<boolean> to Promise<void>
  const addUser = useCallback(async (userData: { name: string; email: string; password: string; role: 'admin' | 'user' }) => {
    try {
      const result = await authAddUser(userData);
      if (result) {
        toast.success(`User ${userData.name} added successfully`);
        // Force refresh users list
        fetchUsersWithDebounce();
      }
    } catch (error) {
      console.error("Error adding user:", error);
      toast.error("Failed to add user. Please try again.");
    }
  }, [authAddUser, fetchUsersWithDebounce]);

  // If not admin or not logged in, redirect to login
  if (!isAuthenticated) {
    console.log("Not admin or not logged in, redirecting to login");
    return <Navigate to="/login" replace />;
  }

  // Memoize tab contents to prevent unnecessary re-renders
  const renderTabContent = () => {
    switch(activeTab) {
      case 'dashboard':
        return <StatsOverview cafes={cafes} />;
      case 'kpi':
        return <SystemStats cafes={cafes} />;
      case 'users':
        return (
          <UserManagement
            users={users}
            isLoadingUsers={isLoadingUsers}
            error={null}
            onAddUser={addUser}
            onEditUser={updateUser}
            onDeleteUser={deleteUser}
            onRefreshUsers={fetchUsersWithDebounce}
            isAddingUser={isAddingUser}
            isDeletingUser={isDeletingUser}
          />
        );
      case 'cafes':
        return <CafeDatabase cafes={cafes} />;
      case 'logs':
        return <DeletionLogs />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <AdminHeader 
        onRefreshCafes={handleRefreshCafes} 
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
          
          {renderTabContent()}
        </Tabs>
      </div>
    </div>
  );
};

export default React.memo(Admin);
