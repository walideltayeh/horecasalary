
import React, { useState, useRef, useEffect } from 'react';
import { useData } from '@/contexts/DataContext';
import { Cafe } from '@/types';
import { toast } from 'sonner';

export const useCafeListState = (filterByUser?: string, adminView = false) => {
  const { cafes, getCafeSize, updateCafeStatus, deleteCafe, refreshCafes, loading } = useData();
  const [cafeToEdit, setCafeToEdit] = useState<Cafe | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [deleteInProgress, setDeleteInProgress] = useState<string | null>(null);
  const [cafeToDelete, setCafeToDelete] = useState<{id: string, name: string} | null>(null);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [localCafes, setLocalCafes] = useState<Cafe[]>([]);
  const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const deleteTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const mounted = useRef(true);
  const lastDeleteAttemptRef = useRef<string | null>(null);
  
  // Update local cafes when the main cafes state changes
  useEffect(() => {
    if (mounted.current) {
      setLocalCafes(cafes);
      console.log("CafeList render - all cafes:", cafes);
      if (filterByUser) {
        console.log("Filtering cafes by user ID:", filterByUser);
        const filtered = cafes.filter(cafe => cafe.createdBy === filterByUser);
        console.log("Filtered cafes:", filtered);
      }
    }
  }, [cafes, filterByUser]);

  // Cleanup function to prevent state updates after unmount
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      // Clear any pending timeouts
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
        refreshTimeoutRef.current = null;
      }
      if (deleteTimeoutRef.current) {
        clearTimeout(deleteTimeoutRef.current);
        deleteTimeoutRef.current = null;
      }
    };
  }, []);
  
  const handleUpdateStatus = async (cafeId: string, newStatus: 'Pending' | 'Visited' | 'Contracted') => {
    // Optimistic update
    setLocalCafes(prev => 
      prev.map(cafe => cafe.id === cafeId ? {...cafe, status: newStatus} : cafe)
    );
    
    try {
      const success = await updateCafeStatus(cafeId, newStatus);
      if (!success && mounted.current) {
        // Revert on failure
        setLocalCafes(cafes);
        toast.error(`Failed to update cafe status`);
      } else {
        toast.success(`Cafe status updated to ${newStatus}`);
        // Force a refresh to ensure synchronized state
        refreshCafes();
      }
    } catch (error) {
      if (mounted.current) {
        setLocalCafes(cafes);
        toast.error(`Error updating status`);
        // Force a refresh to ensure synchronized state
        refreshCafes();
      }
    }
  };

  const openDeleteConfirmation = (cafeId: string, cafeName: string) => {
    // If a deletion is already in progress, don't allow starting another
    if (deleteInProgress) {
      toast.error("A deletion is already in progress, please wait");
      return;
    }
    setCafeToDelete({ id: cafeId, name: cafeName });
  };

  const closeDeleteConfirmation = () => {
    setCafeToDelete(null);
  };

  const handleDelete = async () => {
    if (!cafeToDelete || deleteInProgress) return;
    
    // Circuit breaker - prevent repeated delete attempts for the same cafe
    if (lastDeleteAttemptRef.current === cafeToDelete.id) {
      const confirmRepeatedDelete = window.confirm(
        "You've already attempted to delete this cafe. Are you sure you want to try again?"
      );
      if (!confirmRepeatedDelete) {
        closeDeleteConfirmation();
        return;
      }
    }
    
    lastDeleteAttemptRef.current = cafeToDelete.id;
    
    try {
      // Show loading state on button
      setDeleteInProgress(cafeToDelete.id);
      
      // Show toast notification
      toast.info(`Deleting cafe ${cafeToDelete.name}...`, {
        id: `delete-init-${cafeToDelete.id}`,
        duration: 3000
      });
      
      console.log(`UI: Starting deletion of cafe: ${cafeToDelete.name} (${cafeToDelete.id})`);
      
      // Optimistic UI update - remove cafe from local state immediately
      setLocalCafes(prev => prev.filter(cafe => cafe.id !== cafeToDelete.id));
      
      // Close the dialog immediately to improve UI responsiveness
      closeDeleteConfirmation();
      
      // Set up a watchdog timeout
      const watchdogTimeoutId = setTimeout(() => {
        if (mounted.current && deleteInProgress === cafeToDelete.id) {
          console.log("UI: Deletion watchdog timeout triggered - forcing state reset");
          toast.error('Deletion operation timed out - please refresh your page', {
            id: `delete-timeout-${cafeToDelete.id}`
          });
          setDeleteInProgress(null);
        }
      }, 15000); // 15 second absolute timeout
      
      deleteTimeoutRef.current = watchdogTimeoutId;
      
      // Perform deletion in the background
      const result = await deleteCafe(cafeToDelete.id);
      
      // Clear the watchdog timeout
      if (deleteTimeoutRef.current) {
        clearTimeout(deleteTimeoutRef.current);
        deleteTimeoutRef.current = null;
      }
      
      // Only update state if component is still mounted
      if (mounted.current) {
        console.log(`UI: Delete operation completed with result: ${result}`);
        
        // CRITICAL: Always reset deletion progress state
        setDeleteInProgress(null);
        
        // Handle result
        if (result === true) {
          console.log(`UI: Cafe ${cafeToDelete.name} deleted successfully`);
          toast.success(`Successfully deleted ${cafeToDelete.name}`, {
            id: `delete-success-${cafeToDelete.id}`
          });
          
          // Force a refresh after a small delay (but only if mounted)
          setTimeout(() => {
            if (mounted.current) {
              refreshCafes();
            }
          }, 1000);
        } else {
          console.error(`UI: Failed to delete cafe ${cafeToDelete.name}`);
          toast.error(`Failed to delete ${cafeToDelete.name}`, {
            id: `delete-error-${cafeToDelete.id}`
          });
          
          // Restore the deleted cafe in the local state by refreshing
          refreshCafes();
        }
      }
    } catch (error: any) {
      // Only update state if component is still mounted
      if (mounted.current) {
        console.error(`UI: Error during deletion:`, error);
        toast.error(`Error: ${error.message || 'Unknown error'}`, {
          id: `delete-error-${cafeToDelete.id}`
        });
        
        // CRITICAL FIX: Make sure state is reset even in case of errors
        setDeleteInProgress(null);
        
        // Restore the cafe list
        refreshCafes();
      }
    } finally {
      // Belt-and-suspenders approach: ensure state is always cleaned up
      if (mounted.current) {
        setDeleteInProgress(null);
      }
      
      if (deleteTimeoutRef.current) {
        clearTimeout(deleteTimeoutRef.current);
        deleteTimeoutRef.current = null;
      }
    }
  };
  
  const handleEdit = (cafe: Cafe) => {
    setCafeToEdit(cafe);
    setShowEditDialog(true);
  };
  
  const handleRefresh = async () => {
    if (refreshing) return; // Prevent multiple refreshes
    
    setRefreshing(true);
    toast.info("Refreshing cafe data from server...");
    
    try {
      await refreshCafes();
      if (mounted.current) {
        toast.success("Data refreshed successfully");
      }
    } catch (error) {
      if (mounted.current) {
        console.error("Error during refresh:", error);
        toast.error("Failed to refresh data");
      }
    } finally {
      if (mounted.current) {
        setRefreshing(false);
      }
    }
  };

  // Set up listeners for data update events
  useEffect(() => {
    const handleDataUpdated = () => {
      console.log("CafeList detected data update event");
      if (mounted.current && !refreshing) {
        setRefreshing(true);
        refreshCafes().finally(() => {
          if (mounted.current) {
            setRefreshing(false);
          }
        });
      }
    };
    
    const handleCafeDeleted = (event: CustomEvent) => {
      const { cafeId } = event.detail;
      console.log(`CafeList detected cafe deletion event for ID: ${cafeId}`);
      
      // Update local state immediately for better responsiveness
      if (mounted.current) {
        setLocalCafes(prev => prev.filter(cafe => cafe.id !== cafeId));
        
        // Clear the deleteInProgress state if this was the cafe being deleted
        if (deleteInProgress === cafeId) {
          setDeleteInProgress(null);
        }
      }
    };
    
    window.addEventListener('horeca_data_updated', handleDataUpdated);
    window.addEventListener('cafe_deleted', handleCafeDeleted as EventListener);
    
    return () => {
      window.removeEventListener('horeca_data_updated', handleDataUpdated);
      window.removeEventListener('cafe_deleted', handleCafeDeleted as EventListener);
    };
  }, [refreshCafes, refreshing, deleteInProgress]);
  
  // Filter cafes by user if needed
  let filteredCafes = localCafes;
  if (!adminView && filterByUser) {
    filteredCafes = localCafes.filter(cafe => cafe.createdBy === filterByUser);
  }

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
