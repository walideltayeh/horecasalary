
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
import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase, refreshCafeData } from '@/integrations/supabase/client';

const Admin: React.FC = () => {
  const { isAdmin, addUser, deleteUser, updateUser, users, fetchUsers, isLoadingUsers, error } = useAuth();
  const { cafes, refreshCafes, loading: loadingCafes } = useData();
  const [authenticated, setAuthenticated] = useState(false);
  const [isDeletingUser, setIsDeletingUser] = useState<string | null>(null);
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [selectedTab, setSelectedTab] = useState("all");

  useEffect(() => {
    if (isAdmin && authenticated) {
      console.log("Admin page mounted, refreshing ALL data");
      fetchUsers();
      
      // Force enable realtime for tables
      const enableRealtime = async () => {
        try {
          // Try to enable realtime for important tables via edge function
          const tables = ['cafes', 'cafe_surveys', 'brand_sales'];
          
          for (const table of tables) {
            const { error } = await supabase.functions.invoke('enable-realtime', {
              body: { table_name: table }
            });
            
            if (error) {
              console.error(`Admin: Error enabling realtime for ${table}:`, error);
            } else {
              console.log(`Admin: Successfully enabled realtime for ${table}`);
            }
          }
        } catch (err) {
          console.error("Admin: Error enabling realtime:", err);
        }
      };
      
      // Call refresh cafes immediately and force data reload
      refreshCafes();
      refreshCafeData();
      
      // Then enable realtime
      enableRealtime();
    }
  }, [isAdmin, authenticated, fetchUsers, refreshCafes]);

  // Additional periodic refreshes for cafes when on Admin page
  useEffect(() => {
    if (isAdmin && authenticated) {
      console.log("Setting up Admin page refresh intervals");
      
      // Immediate refresh
      refreshCafes();
      
      // Then periodic refresh
      const cafeRefreshInterval = setInterval(() => {
        console.log("Admin periodic cafe refresh");
        refreshCafes();
      }, 10000); // Refresh every 10 seconds while on Admin page
      
      return () => {
        console.log("Clearing Admin page refresh intervals");
        clearInterval(cafeRefreshInterval);
      };
    }
  }, [isAdmin, authenticated, refreshCafes]);

  if (!isAdmin) {
    return <Navigate to="/dashboard" />;
  }
  
  if (!authenticated) {
    return <PasswordProtection onAuthenticate={() => {
      setAuthenticated(true);
      // Force refresh after authentication
      setTimeout(() => {
        refreshCafes();
        refreshCafeData();
      }, 500);
    }} title="Admin Panel" />;
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
  
  const handleRefreshCafes = async () => {
    try {
      toast.info("Refreshing cafe data...");
      await refreshCafes();
      // Also trigger the global refresh event
      refreshCafeData();
      toast.success("Cafe data refreshed");
    } catch (error) {
      console.error("Error refreshing cafes:", error);
      toast.error("Failed to refresh cafe data");
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold mb-2">Admin Panel</h1>
          <p className="text-gray-600">Monitor user activity and cafe data</p>
        </div>
        
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            className="flex items-center gap-2"
            onClick={handleRefreshCafes}
            disabled={loadingCafes}
          >
            <RefreshCw className={`h-4 w-4 ${loadingCafes ? 'animate-spin' : ''}`} />
            {loadingCafes ? 'Refreshing...' : 'Refresh Data'}
          </Button>
        </div>
      </div>
      
      {/* Show cafe stats/count */}
      <Card className="bg-green-50 border-green-200">
        <CardHeader className="pb-2">
          <CardTitle className="text-green-800">Cafe Database Status</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-green-700">
            {loadingCafes ? (
              "Loading cafe data..."
            ) : (
              `Total cafes in system: ${cafes.length}`
            )}
          </p>
        </CardContent>
      </Card>
      
      <UserManagement
        users={users}
        isLoadingUsers={isLoadingUsers}
        error={error}
        isAddingUser={isAddingUser}
        isDeletingUser={isDeletingUser}
        onAddUser={async (userData) => {
          setIsAddingUser(true);
          try {
            await addUser(userData);
            await fetchUsers();
          } finally {
            setIsAddingUser(false);
          }
        }}
        onEditUser={async (userId, userData) => {
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
        }}
        onDeleteUser={async (userId, userName) => {
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
        }}
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
