
import React, { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import PasswordProtection from '@/components/PasswordProtection';
import { UserPerformance } from '@/components/admin/UserPerformance';
import { CafeDatabase } from '@/components/admin/CafeDatabase';
import UserManagement from '@/components/admin/UserManagement';
import AdminHeader from '@/components/admin/AdminHeader';
import { AdminCafeStats } from '@/components/admin/CafeStatsCard';
import AdminSystemInfo from '@/components/admin/AdminSystemInfo';
import { useAdminPage } from '@/hooks/admin/useAdminPage';

const Admin: React.FC = () => {
  const {
    isAdmin,
    users,
    isLoadingUsers,
    cafes,
    loadingCafes,
    authenticated,
    setAuthenticated,
    isDeletingUser,
    isAddingUser,
    handleRefreshCafes,
    handleAddUser,
    handleEditUser,
    handleDeleteUser,
    fetchUsers,
    refreshCafes
  } = useAdminPage();

  // Reset refresh and force update when authenticated
  const handleAuthenticated = () => {
    setAuthenticated(true);
  };
  
  // Force refresh data when the admin page is mounted
  useEffect(() => {
    if (authenticated) {
      console.log("Admin page mounted, forcing data refresh");
      
      // Force immediate data refresh
      handleRefreshCafes();
      fetchUsers(true);
      refreshCafes();
      
      // Dispatch a global refresh event
      window.dispatchEvent(new CustomEvent('global_data_refresh'));
    }
  }, [authenticated, handleRefreshCafes, fetchUsers, refreshCafes]);

  if (!isAdmin) {
    return <Navigate to="/dashboard" />;
  }
  
  if (!authenticated) {
    return <PasswordProtection 
      onAuthenticate={handleAuthenticated} 
      title="Admin Panel" 
    />;
  }

  console.log("Admin render with users:", users);
  console.log("Admin render with cafes:", cafes);

  return (
    <div className="space-y-8">
      <AdminHeader onRefreshCafes={handleRefreshCafes} loadingCafes={loadingCafes} />
      <AdminCafeStats cafes={cafes} loadingCafes={loadingCafes} />
      
      <UserManagement
        users={users}
        isLoadingUsers={isLoadingUsers}
        error={null}
        onAddUser={handleAddUser}
        onEditUser={handleEditUser}
        onDeleteUser={handleDeleteUser}
        onRefreshUsers={() => fetchUsers(true)}
        isAddingUser={isAddingUser}
        isDeletingUser={isDeletingUser}
      />
      
      <UserPerformance users={users} cafes={cafes} />
      <CafeDatabase cafes={cafes} />
      <AdminSystemInfo cafes={cafes} />
    </div>
  );
};

export default Admin;
