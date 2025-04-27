
import { useState } from 'react';
import { User } from '@/types';

export const useUserEditDialog = () => {
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editUser, setEditUser] = useState({
    id: '',
    name: '',
    password: '',
    role: 'user' as 'admin' | 'user'
  });

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

  return {
    editDialogOpen,
    setEditDialogOpen,
    editUser,
    setEditUser,
    openEditDialog,
    handleEditInputChange,
    handleEditRoleChange
  };
};
