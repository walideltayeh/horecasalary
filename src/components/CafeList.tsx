
import React, { useEffect, useState, useRef } from 'react';
import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { refreshCafeData } from '@/integrations/supabase/client';
import CafeEditDialog from './cafe/CafeEditDialog';
import { Cafe } from '@/types';
import CafeTableActions from './cafe/CafeTableActions';
import CafeTable from './cafe/CafeTable';
import DeleteConfirmationDialog from './cafe/DeleteConfirmationDialog';

interface CafeListProps {
  adminView?: boolean;
  filterByUser?: string;
}

const CafeList: React.FC<CafeListProps> = ({ adminView = false, filterByUser }) => {
  const { cafes, getCafeSize, updateCafeStatus, deleteCafe, refreshCafes, loading } = useData();
  const { user, isAdmin } = useAuth();
  const [cafeToEdit, setCafeToEdit] = useState<Cafe | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [deleteInProgress, setDeleteInProgress] = useState<string | null>(null);
  const [cafeToDelete, setCafeToDelete] = useState<{id: string, name: string} | null>(null);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [localCafes, setLocalCafes] = useState<Cafe[]>([]);
  const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const deleteTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const mounted = useRef(true);
  
  // Update local cafes when the main cafes state changes
  useEffect(() => {
    if (mounted.current) {
      setLocalCafes(cafes);
    }
  }, [cafes]);

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
      }
    } catch (error) {
      if (mounted.current) {
        setLocalCafes(cafes);
        toast.error(`Error updating status`);
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
    
    try {
      // Show loading state on button
      setDeleteInProgress(cafeToDelete.id);
      
      // Show toast - using a regular toast, not a loading toast to avoid blocking UI
      toast.info(`Deleting cafe ${cafeToDelete.name}...`);
      
      console.log(`UI: Starting deletion of cafe: ${cafeToDelete.name} (${cafeToDelete.id})`);
      
      // Optimistic UI update - remove cafe from local state immediately
      setLocalCafes(prev => prev.filter(cafe => cafe.id !== cafeToDelete.id));
      
      // Close the confirmation dialog immediately to improve responsiveness
      closeDeleteConfirmation();
      
      // Set up a watchdog timeout for ultra-stuck operations
      const watchdogTimeoutId = setTimeout(() => {
        if (mounted.current && deleteInProgress === cafeToDelete.id) {
          toast.error('Deletion operation timed out - please refresh your page');
          setDeleteInProgress(null);
        }
      }, 20000); // 20 second absolute timeout
      
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
        // Handle result
        if (result === true) {
          console.log(`UI: Cafe ${cafeToDelete.name} deleted successfully`);
          toast.success(`Cafe ${cafeToDelete.name} deleted successfully`);
          
          // Force a refresh after a small delay (but only if mounted)
          setTimeout(() => {
            if (mounted.current) {
              refreshCafes();
            }
          }, 1000);
        } else {
          console.error(`UI: Failed to delete cafe ${cafeToDelete.name}`);
          toast.error(`Failed to delete ${cafeToDelete.name}`);
          // Restore the deleted cafe in the local state
          setLocalCafes(cafes);
        }
        
        // Reset the delete in progress state
        setDeleteInProgress(null);
      }
    } catch (error: any) {
      // Only update state if component is still mounted
      if (mounted.current) {
        console.error(`UI: Error during deletion:`, error);
        toast.error(`Error: ${error.message || 'Unknown error'}`);
        setDeleteInProgress(null);
        closeDeleteConfirmation();
        // Restore the deleted cafe in the local state
        setLocalCafes(cafes);
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
  
  // Set up listener for data update events
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
      }
    };
    
    window.addEventListener('horeca_data_updated', handleDataUpdated);
    window.addEventListener('cafe_deleted', handleCafeDeleted as EventListener);
    
    return () => {
      window.removeEventListener('horeca_data_updated', handleDataUpdated);
      window.removeEventListener('cafe_deleted', handleCafeDeleted as EventListener);
    };
  }, [refreshCafes, refreshing]);
  
  let filteredCafes = localCafes;
  
  if (!adminView && filterByUser) {
    filteredCafes = localCafes.filter(cafe => cafe.createdBy === filterByUser);
  }
  
  return (
    <div className="space-y-4">
      <div className="flex justify-between mb-2">
        <div>
          {loading ? (
            <p className="text-gray-500 text-sm">Loading cafe data...</p>
          ) : (
            <p className="text-gray-500 text-sm">{filteredCafes.length} cafes found {adminView ? '(Admin view)' : ''}</p>
          )}
        </div>
        <CafeTableActions 
          loading={loading} 
          refreshing={refreshing} 
          filteredCafes={filteredCafes}
          handleRefresh={handleRefresh}
        />
      </div>
      
      <CafeTable 
        filteredCafes={filteredCafes}
        adminView={adminView}
        loading={loading}
        isAdmin={isAdmin}
        user={user}
        deleteInProgress={deleteInProgress}
        getCafeSize={getCafeSize}
        handleEdit={handleEdit}
        handleUpdateStatus={handleUpdateStatus}
        openDeleteConfirmation={openDeleteConfirmation}
      />
      
      {cafeToEdit && (
        <CafeEditDialog 
          cafe={cafeToEdit} 
          isOpen={showEditDialog}
          onClose={() => {
            setShowEditDialog(false);
            setCafeToEdit(null);
          }}
          onSave={() => {
            setShowEditDialog(false);
            setCafeToEdit(null);
            // Dispatch event to trigger refresh across components
            window.dispatchEvent(new CustomEvent('horeca_data_updated'));
          }}
        />
      )}

      <DeleteConfirmationDialog 
        cafeToDelete={cafeToDelete}
        deleteInProgress={deleteInProgress}
        handleDelete={handleDelete}
        closeDeleteConfirmation={closeDeleteConfirmation}
      />
    </div>
  );
};

export default CafeList;
