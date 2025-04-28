
import { useState } from 'react';
import { toast } from 'sonner';

interface UseUserActionsProps {
  onAddUser: (userData: any) => Promise<void>;
  onEditUser: (userId: string, userData: any) => Promise<boolean>;
  onDeleteUser: (userId: string, userName: string) => Promise<boolean>;
  onRefreshUsers: () => Promise<void>;
  setSelectedTab: (tab: string) => void;
}

export const useUserActions = ({
  onAddUser,
  onEditUser,
  onDeleteUser,
  onRefreshUsers,
  setSelectedTab
}: UseUserActionsProps) => {
  const [isAddingUser, setIsAddingUser] = useState<boolean>(false);
  const [isDeletingUser, setIsDeletingUser] = useState<string | null>(null);

  const handleAddUser = async (userData: any) => {
    setIsAddingUser(true);
    try {
      await onAddUser(userData);
      await onRefreshUsers();
    } finally {
      setIsAddingUser(false);
    }
  };

  const handleEditUser = async (userId: string, userData: any): Promise<boolean> => {
    try {
      const success = await onEditUser(userId, userData);
      if (success) {
        if (userData.role === 'admin') {
          setSelectedTab("all");
        }
        await onRefreshUsers();
      }
      return success; // Explicitly return the success boolean
    } catch (error) {
      console.error("Error updating user:", error);
      toast.error("Failed to update user");
      return false; // Return false on error
    }
  };
  
  const handleDeleteUser = async (userId: string, userName: string) => {
    if (confirm(`Are you sure you want to delete the user "${userName}"? This action cannot be undone.`)) {
      setIsDeletingUser(userId);
      try {
        const success = await onDeleteUser(userId, userName);
        if (success) {
          setSelectedTab("all");
        }
        await onRefreshUsers();
        return success;
      } finally {
        setIsDeletingUser(null);
      }
    }
    return false; // Return false if confirmation was canceled
  };

  return {
    isAddingUser,
    isDeletingUser,
    handleAddUser,
    handleEditUser,
    handleDeleteUser
  };
};
