
import React, { useState, useEffect, useCallback } from 'react';
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
import { toast } from 'sonner';

const Admin: React.FC = () => {
  const { user, isAdmin, addUser: authAddUser, deleteUser, updateUser, users, fetchUsers } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [lastRefreshTime, setLastRefreshTime] = useState(0);
  const refreshInProgressRef = React.useRef<boolean>(false);
  
  const {
    isLoadingUsers,
    cafes,
    loadingCafes,
    refreshCafes,
    isAddingUser,
    isDeletingUser
  } = useAdminPage();

  // Throttled refresh function for cafe data
  const handleRefreshCafes = useCallback(async (force = false) => {
    // Prevent concurrent refreshes
    if (refreshInProgressRef.current) {
      console.log("Admin: Cafe refresh already in progress");
      return;
    }
    
    const now = Date.now();
    // Only allow forced refreshes or time-based refreshes (2 minutes)
    if (!force && now - lastRefreshTime < 120000) {
      console.log("Admin: Throttling cafe refresh - too recent");
      return;
    }
    
    try {
      console.log("Admin: Refreshing cafe data");
      refreshInProgressRef.current = true;
      setLastRefreshTime(now);
      await refreshCafes();
    } catch (error) {
      console.error("Admin: Error refreshing cafes:", error);
    } finally {
      refreshInProgressRef.current = false;
    }
  }, [refreshCafes, lastRefreshTime]);

  // Explicit check for user data on component mount with limited retries
  useEffect(() => {
    if (user && isAdmin) {
      console.log("Admin component mounted - forcing user data refresh");
      try {
        // Use a timeout to avoid race conditions on component mount
        const timer = setTimeout(() => {
          fetchUsers(true).catch(err => {
            console.error("Error fetching users on Admin mount:", err);
            // If error persists, show a toast with help information
            toast.error("Error loading user data. The users database might need to be synced with authentication.");
          });
        }, 1000);
        
        return () => clearTimeout(timer);
      } catch (error) {
        console.error("Error fetching users on Admin mount:", error);
        toast.error("Error loading user data. Please try refreshing the page.");
      }
    }
  }, [user, isAdmin, fetchUsers]);

  // Force cafe refresh on mount and whenever the active tab changes to 'cafes'
  useEffect(() => {
    if (user && isAdmin) {
      // Force refresh only when mounting or switching to cafes tab
      if (activeTab === 'cafes') {
        handleRefreshCafes(true);
      } else if (activeTab === 'users') {
        // Only refresh users when switching to users tab
        fetchUsers(true).catch(err => {
          console.error("Error fetching users when switching tabs:", err);
          // Don't show too many error toasts
        });
      }
    }
  }, [user, isAdmin, activeTab, handleRefreshCafes, fetchUsers]);

  // Create a wrapper function to handle user addition
  const addUser = async (userData: { name: string; email: string; password: string; role: 'admin' | 'user' }) => {
    try {
      console.log("Admin: Adding user:", userData.name);
      const result = await authAddUser(userData);
      
      if (result) {
        toast.success(`User ${userData.name} added successfully`);
        // Force refresh users list after a delay
        setTimeout(() => {
          fetchUsers(true);
        }, 2000);
      } else {
        toast.error("Failed to add user. Please check the details and try again.");
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
        onRefreshCafes={() => handleRefreshCafes(true)} 
        loadingCafes={loadingCafes || refreshInProgressRef.current} 
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
