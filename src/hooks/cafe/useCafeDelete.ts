
import { useState, useRef, useEffect } from 'react';
import { toast } from 'sonner';

// Accept the deleteCafe and refreshCafes functions as parameters instead of using useData
export const useCafeDelete = (
  deleteCafe: (cafeId: string) => Promise<boolean>,
  refreshCafes: () => Promise<void>
) => {
  const [deleteInProgress, setDeleteInProgress] = useState<string | null>(null);
  const [cafeToDelete, setCafeToDelete] = useState<{id: string, name: string} | null>(null);
  const deleteTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastDeleteAttemptRef = useRef<string | null>(null);
  const mounted = useRef(true);
  
  // Cleanup function to prevent state updates after unmount
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      if (deleteTimeoutRef.current) {
        clearTimeout(deleteTimeoutRef.current);
        deleteTimeoutRef.current = null;
      }
    };
  }, []);
  
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
  
  return {
    deleteInProgress,
    cafeToDelete,
    openDeleteConfirmation,
    closeDeleteConfirmation,
    handleDelete
  };
};
