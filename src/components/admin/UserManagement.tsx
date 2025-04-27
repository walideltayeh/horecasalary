
import React, { useState } from 'react';
import { User } from "@/types";
import UserManagementSection from './UserManagementSection';
import UserListSection from './UserListSection';
import EditUserDialog from './EditUserDialog';
import { useUserEditDialog } from './useUserEditDialog';
import { useUserActions } from '@/hooks/admin/useUserActions';

interface UserManagementProps {
  users: User[];
  isLoadingUsers: boolean;
  error: string | null;
  onAddUser: (userData: { name: string; email: string; password: string; role: 'admin' | 'user' }) => Promise<void>;
  onEditUser: (userId: string, userData: any) => Promise<void>;
  onDeleteUser: (userId: string, userName: string) => Promise<void>;
  onRefreshUsers: () => Promise<void>;
}

const UserManagement: React.FC<UserManagementProps> = ({
  users,
  isLoadingUsers,
  error,
  onAddUser,
  onEditUser,
  onDeleteUser,
  onRefreshUsers
}) => {
  const [selectedTab, setSelectedTab] = useState("all");
  
  const {
    editDialogOpen,
    setEditDialogOpen,
    editUser,
    openEditDialog,
    handleEditInputChange,
    handleEditRoleChange
  } = useUserEditDialog();

  const {
    isAddingUser,
    isDeletingUser,
    handleAddUser,
    handleEditUser,
    handleDeleteUser
  } = useUserActions({
    onAddUser,
    onEditUser,
    onDeleteUser,
    onRefreshUsers,
    setSelectedTab
  });

  const handleEditUserSave = async () => {
    try {
      await handleEditUser(editUser.id, editUser);
      setEditDialogOpen(false);
    } catch (error) {
      console.error("Error updating user:", error);
    }
  };

  return (
    <>
      <UserManagementSection
        onAddUser={handleAddUser}
        isAddingUser={isAddingUser}
      />
      
      <UserListSection
        users={users}
        isLoadingUsers={isLoadingUsers}
        error={error}
        isDeletingUser={isDeletingUser}
        onEditUser={openEditDialog}
        onDeleteUser={handleDeleteUser}
        onRefreshUsers={onRefreshUsers}
      />

      <EditUserDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        editUser={editUser}
        onInputChange={handleEditInputChange}
        onRoleChange={handleEditRoleChange}
        onSave={handleEditUserSave}
        isEditing={isDeletingUser === editUser.id}
      />
    </>
  );
};

export default UserManagement;
