
import { useState, useEffect, useCallback } from 'react';
import { useData } from '@/contexts/DataContext';
import { Cafe } from '@/types';
import { useCafeRefresh } from './useCafeRefresh';
import { useCafeEdit } from './useCafeEdit';
import { useCafeStatusUpdate } from './useCafeStatusUpdate';
import { useCafeDelete } from './useCafeDelete';

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
  const { deleteInProgress, cafeToDelete, openDeleteConfirmation, closeDeleteConfirmation, handleDelete } = 
    useCafeDelete(deleteCafe, refreshCafes);
  
  // Memoized refresh handler that forces data refresh
  const memoizedRefresh = useCallback(async () => {
    console.log("useCafeListState - forcing refresh");
    await refreshCafes(true);
  }, [refreshCafes]);
  
  // Set up event listeners for data refresh
  useEffect(() => {
    const handleDataUpdated = () => {
      console.log("CafeList detected data update event - refreshing");
      memoizedRefresh();
    };
    
    window.addEventListener('cafe_data_force_refresh', handleDataUpdated);
    window.addEventListener('cafe_added', handleDataUpdated);
    window.addEventListener('cafe_deleted', handleDataUpdated);
    
    // Clean up listeners on unmount
    return () => {
      window.removeEventListener('cafe_data_force_refresh', handleDataUpdated);
      window.removeEventListener('cafe_added', handleDataUpdated);
      window.removeEventListener('cafe_deleted', handleDataUpdated);
    };
  }, [memoizedRefresh]);
  
  // Update local cafes when the main cafes state changes
  useEffect(() => {
    setLocalCafes(cafes);
    console.log("CafeList - cafes updated:", cafes.length);
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
    console.log("Setting filtered cafes:", result.length, "from total:", localCafes.length);
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
    handleRefresh: memoizedRefresh, // Use the memoized function that forces refresh
    openDeleteConfirmation,
    closeDeleteConfirmation,
    handleDelete,
    setShowEditDialog,
    setCafeToEdit
  };
};
