
import { useState, useEffect } from 'react';
import { useData } from '@/contexts/DataContext';
import { Cafe } from '@/types';
import { useCafeRefresh } from './useCafeRefresh';
import { useCafeEdit } from './useCafeEdit';
import { useCafeStatusUpdate } from './useCafeStatusUpdate';
import { useCafeDelete } from './useCafeDelete';
import { useEventListeners } from './useEventListeners';

export const useCafeListState = (filterByUser?: string, adminView = false) => {
  const { cafes, getCafeSize, loading, refreshCafes, deleteCafe } = useData();
  const [localCafes, setLocalCafes] = useState<Cafe[]>([]);
  const [filteredCafes, setFilteredCafes] = useState<Cafe[]>([]);

  // Use extracted hook for refresh functionality
  const { refreshing, handleRefresh } = useCafeRefresh();
  
  // Use extracted hook for edit functionality
  const { cafeToEdit, showEditDialog, handleEdit, setShowEditDialog, setCafeToEdit } = useCafeEdit();
  
  // Use extracted hook for status updates
  const { handleUpdateStatus } = useCafeStatusUpdate(setLocalCafes, cafes);
  
  // Use extracted hook for delete functionality
  // Pass in the deleteCafe and refreshCafes functions from context to avoid circular dependencies
  const { deleteInProgress, cafeToDelete, openDeleteConfirmation, closeDeleteConfirmation, handleDelete } = 
    useCafeDelete(deleteCafe, refreshCafes);
  
  // Set up event listeners
  useEventListeners(setLocalCafes, refreshing, deleteInProgress);
  
  // Update local cafes when the main cafes state changes
  useEffect(() => {
    setLocalCafes(cafes);
    console.log("CafeList render - all cafes:", cafes);
    if (filterByUser) {
      console.log("Filtering cafes by user ID:", filterByUser);
    }
  }, [cafes, filterByUser]);
  
  // Filter cafes by user if needed
  useEffect(() => {
    let result = localCafes;
    if (!adminView && filterByUser) {
      result = localCafes.filter(cafe => cafe.createdBy === filterByUser);
    }
    setFilteredCafes(result);
  }, [localCafes, adminView, filterByUser]);

  return {
    loading,
    refreshing,
    filteredCafes,
    cafeToEdit,
    showEditDialog,
    deleteInProgress,
    cafeToDelete,
    getCafeSize,
    handleEdit,
    handleUpdateStatus,
    handleRefresh,
    openDeleteConfirmation,
    closeDeleteConfirmation,
    handleDelete,
    setShowEditDialog,
    setCafeToEdit
  };
};
