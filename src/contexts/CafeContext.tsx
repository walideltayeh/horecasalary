
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
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
  
  // Manual refresh function with improved reliability
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
      
      // Additional delay to ensure data propagation
      setTimeout(() => {
        console.log("Follow-up verification refresh");
        fetchCafes(true);
      }, 1000);
      
      toast.success("Cafe data refreshed successfully");
    } catch (error) {
      console.error("Error during manual refresh:", error);
      toast.error("Failed to refresh cafe data");
    }
  }, [fetchCafes, lastRefreshTime]);

  // Force an initial data fetch on mount
  useEffect(() => {
    console.log("CafeProvider mounted, forcing initial data fetch");
    fetchCafes(true);
    
    // Set up a periodic refresh every 2 minutes as a fallback
    const intervalId = setInterval(() => {
      console.log("Periodic cafe refresh triggered");
      fetchCafes();
    }, 120000); // Every 2 minutes
    
    return () => clearInterval(intervalId);
  }, [fetchCafes]);

  // Custom cafe adding function with improved refresh handling
  const handleAddCafe = async (cafe: Omit<Cafe, 'id' | 'createdAt'>) => {
    console.log("Adding cafe:", cafe);
    const cafeId = await addCafe(cafe);
    if (cafeId) {
      // Immediate fetch to update state
      await fetchCafes(true);
      
      // Global notification to update other components
      refreshCafeData();
      
      // Additional delayed refresh for consistency
      setTimeout(() => {
        fetchCafes(true);
      }, 500);
      
      toast.success("Cafe added and data refreshed");
    }
    return cafeId;
  };

  // Custom updateCafeStatus with improved refresh handling
  const handleUpdateCafeStatus = async (cafeId: string, status: 'Pending' | 'Visited' | 'Contracted') => {
    const result = await updateCafeStatus(cafeId, status);
    if (result) {
      // Multiple refresh patterns to ensure data consistency
      refreshCafeData();
      await fetchCafes(true);
      
      // Additional refresh after a short delay
      setTimeout(() => {
        fetchCafes(true);
      }, 500);
    }
    return result;
  };
  
  // Custom updateCafe with improved refresh handling
  const handleUpdateCafe = async (cafeId: string, cafeData: Partial<Cafe>) => {
    const result = await updateCafe(cafeId, cafeData);
    if (result) {
      // Multiple refresh patterns to ensure data consistency
      refreshCafeData();
      await fetchCafes(true);
      
      // Additional refresh after a short delay
      setTimeout(() => {
        fetchCafes(true);
      }, 500);
    }
    return result;
  };
  
  // Custom deleteCafe with improved refresh handling
  const handleDeleteCafe = async (cafeId: string) => {
    const result = await deleteCafe(cafeId);
    if (result) {
      // Enhanced refresh pattern with multiple approaches
      console.log("Cafe deleted, performing thorough refresh");
      
      // Global notification
      refreshCafeData();
      
      // Immediate fetch
      await fetchCafes(true);
      
      // Follow-up fetch to ensure consistency
      setTimeout(async () => {
        console.log("Follow-up refresh after deletion");
        await fetchCafes(true);
        
        // Update local state directly as backup strategy
        setCafes(prevCafes => prevCafes.filter(cafe => cafe.id !== cafeId));
      }, 1000);
    }
    return result;
  };
  
  // Ensure Admin page sees updated data
  useEffect(() => {
    const adminPageCheck = () => {
      const isAdminPage = window.location.pathname.includes('/admin');
      if (isAdminPage) {
        console.log("Admin page detected, forcing data refresh");
        fetchCafes(true);
      }
    };
    
    // Check on initial render
    adminPageCheck();
    
    // Setup listener for route changes
    const handleRouteChange = () => {
      adminPageCheck();
    };
    
    window.addEventListener('popstate', handleRouteChange);
    
    return () => {
      window.removeEventListener('popstate', handleRouteChange);
    };
  }, [fetchCafes]);

  // Set up listener for deletion events
  useEffect(() => {
    const handleDataUpdate = (event: CustomEvent) => {
      console.log("Received data update event:", event.detail);
      // If it's a deletion event, force refresh
      if (event.detail?.payload?.eventType === 'DELETE') {
        console.log("DELETE event detected, forcing refresh");
        fetchCafes(true);
      }
    };
    
    window.addEventListener('horeca_data_updated' as any, handleDataUpdate as any);
    
    return () => {
      window.removeEventListener('horeca_data_updated' as any, handleDataUpdate as any);
    };
  }, [fetchCafes]);

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
