import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { Cafe, CafeSize } from '@/types';
import { useAuth } from './AuthContext';
import { getCafeSize } from '@/utils/cafeUtils';
import { useCafeOperations } from '@/hooks/useCafeOperations';
import { useCafeSubscription } from '@/hooks/useCafeSubscription';
import { refreshCafeData } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface CafeContextType {
  cafes: Cafe[];
  addCafe: (cafe: Omit<Cafe, 'id' | 'createdAt'>) => Promise<string | null>;
  updateCafe: (cafeId: string, cafeData: Partial<Cafe>) => Promise<boolean>;
  updateCafeStatus: (cafeId: string, status: 'Pending' | 'Visited' | 'Contracted') => Promise<boolean>;
  getCafeSize: (numberOfHookahs: number) => CafeSize;
  deleteCafe: (cafeId: string) => Promise<boolean>;
  loading: boolean;
  refreshCafes: () => Promise<void>;
}

const CafeContext = createContext<CafeContextType | undefined>(undefined);

export const CafeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [cafes, setCafes] = useState<Cafe[]>([]);
  const [lastRefreshTime, setLastRefreshTime] = useState<number>(0);
  const { loading, setLoading, addCafe, updateCafe, updateCafeStatus, deleteCafe } = useCafeOperations();
  
  // Set up real-time subscriptions and fetch initial data
  const { fetchCafes } = useCafeSubscription(user, setCafes, setLoading);
  
  // Keep track of cafes that are being deleted
  const pendingDeletions = useRef<Set<string>>(new Set());
  
  // Manual refresh function with improved reliability but no automatic refreshes
  const refreshCafes = useCallback(async () => {
    console.log("Manual refresh triggered via context");
    const now = Date.now();
    
    // Prevent excessive refreshes (once per second max)
    if (now - lastRefreshTime < 1000) {
      console.log("Refresh throttled");
      return;
    }
    
    setLastRefreshTime(now);
    toast.info("Refreshing cafe data...");
    
    try {
      // Force refresh with strong cache invalidation
      await fetchCafes(true);
      
      // Notify other components via events for cross-component synchronization
      refreshCafeData();
      
      toast.success("Cafe data refreshed successfully");
    } catch (error) {
      console.error("Error during manual refresh:", error);
      toast.error("Failed to refresh cafe data");
    }
  }, [fetchCafes, lastRefreshTime]);

  // Force an initial data fetch on mount but NO periodic refreshes
  useEffect(() => {
    console.log("CafeProvider mounted, forcing initial data fetch");
    fetchCafes(true);
  }, [fetchCafes]);
  
  // Listen for deletion events (both from within the app and from other tabs)
  useEffect(() => {
    const handleCafeDeleted = (event: CustomEvent) => {
      const { cafeId } = event.detail;
      console.log(`Deletion event received for cafe ${cafeId}`);
      
      // Update local state immediately without waiting for server refresh
      setCafes(prevCafes => prevCafes.filter(cafe => cafe.id !== cafeId));
      
      // Force a refresh to ensure consistency
      setTimeout(() => {
        fetchCafes(true);
      }, 500);
    };
    
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'last_deleted_cafe') {
        const deletedCafeId = event.newValue;
        if (deletedCafeId) {
          console.log(`Storage event: cafe ${deletedCafeId} deleted in another tab`);
          setCafes(prevCafes => prevCafes.filter(cafe => cafe.id !== deletedCafeId));
          fetchCafes(true);
        }
      }
    };
    
    // Add event listeners
    window.addEventListener('cafe_deleted' as any, handleCafeDeleted as any);
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('cafe_deleted' as any, handleCafeDeleted as any);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [fetchCafes]);

  // Custom cafe adding function
  const handleAddCafe = async (cafe: Omit<Cafe, 'id' | 'createdAt'>) => {
    console.log("Adding cafe:", cafe);
    const cafeId = await addCafe(cafe);
    if (cafeId) {
      // Immediate fetch to update state
      await fetchCafes(true);
      
      // Dispatch event to notify all components
      window.dispatchEvent(new CustomEvent('horeca_data_updated'));
      
      toast.success("Cafe added successfully");
    }
    return cafeId;
  };

  // Custom updateCafeStatus with event-based notification
  const handleUpdateCafeStatus = async (cafeId: string, status: 'Pending' | 'Visited' | 'Contracted') => {
    const result = await updateCafeStatus(cafeId, status);
    if (result) {
      // Dispatch event to trigger refresh across components
      window.dispatchEvent(new CustomEvent('horeca_data_updated'));
    }
    return result;
  };
  
  // Custom updateCafe with event-based notification
  const handleUpdateCafe = async (cafeId: string, cafeData: Partial<Cafe>) => {
    const result = await updateCafe(cafeId, cafeData);
    if (result) {
      // Dispatch event to trigger refresh across components
      window.dispatchEvent(new CustomEvent('horeca_data_updated'));
    }
    return result;
  };
  
  // Custom deleteCafe with improved state management
  const handleDeleteCafe = async (cafeId: string) => {
    try {
      // First check if this cafe is currently being deleted
      if (pendingDeletions.current.has(cafeId)) {
        console.log(`Deletion already in progress for cafe ${cafeId}`);
        toast.info("Deletion already in progress");
        return false;
      }
      
      // Mark this cafe as being deleted
      pendingDeletions.current.add(cafeId);
      
      // Update local state immediately for better UI responsiveness
      // This is optimistic UI update
      setCafes(prev => prev.filter(cafe => cafe.id !== cafeId));
      
      // Perform the actual deletion
      const result = await deleteCafe(cafeId);
      
      if (result) {
        console.log(`Cafe ${cafeId} successfully deleted`);
        
        // Dispatch event to trigger refresh across components
        window.dispatchEvent(new CustomEvent('horeca_data_updated'));
      } else {
        // If deletion failed, restore the cafe in local state
        console.log(`Deletion failed for cafe ${cafeId}, restoring in local state`);
        fetchCafes(true);
      }
      
      // Remove from pending deletions
      pendingDeletions.current.delete(cafeId);
      return result;
    } catch (error) {
      console.error(`Error in handleDeleteCafe for ${cafeId}:`, error);
      pendingDeletions.current.delete(cafeId);
      return false;
    }
  };

  return (
    <CafeContext.Provider
      value={{
        cafes,
        addCafe: handleAddCafe,
        updateCafe: handleUpdateCafe,
        updateCafeStatus: handleUpdateCafeStatus,
        getCafeSize,
        deleteCafe: handleDeleteCafe,
        loading,
        refreshCafes
      }}
    >
      {children}
    </CafeContext.Provider>
  );
};

export const useCafes = () => {
  const context = useContext(CafeContext);
  if (context === undefined) {
    throw new Error('useCafes must be used within a CafeProvider');
  }
  return context;
};
