
import { useState } from 'react';
import { Cafe } from '@/types';

export const useCafeEdit = () => {
  const [cafeToEdit, setCafeToEdit] = useState<Cafe | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  
  const handleEdit = (cafe: Cafe) => {
    setCafeToEdit(cafe);
    setShowEditDialog(true);
  };
  
  return {
    cafeToEdit,
    showEditDialog,
    handleEdit,
    setShowEditDialog,
    setCafeToEdit
  };
};
