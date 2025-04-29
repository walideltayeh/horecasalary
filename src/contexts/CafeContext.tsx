
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
  
  // Manual refresh function
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
      await fetchCafes(true);
      refreshCafeData(); // Notify other components via events
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

  // Custom cafe adding function that also triggers cross-tab notification
  const handleAddCafe = async (cafe: Omit<Cafe, 'id' | 'createdAt'>) => {
    console.log("Adding cafe:", cafe);
    const cafeId = await addCafe(cafe);
    if (cafeId) {
      // Trigger an immediate fetch in this tab
      refreshCafeData();
      await fetchCafes(true);
      toast.success("Cafe added and data refreshed");
    }
    return cafeId;
  };

  // Custom updateCafeStatus that also triggers cross-tab notification
  const handleUpdateCafeStatus = async (cafeId: string, status: 'Pending' | 'Visited' | 'Contracted') => {
    const result = await updateCafeStatus(cafeId, status);
    if (result) {
      // Trigger an immediate fetch in this tab
      refreshCafeData();
      await fetchCafes(true);
    }
    return result;
  };
  
  // Custom updateCafe that also triggers cross-tab notification
  const handleUpdateCafe = async (cafeId: string, cafeData: Partial<Cafe>) => {
    const result = await updateCafe(cafeId, cafeData);
    if (result) {
      // Trigger an immediate fetch in this tab
      refreshCafeData();
      await fetchCafes(true);
    }
    return result;
  };
  
  // Custom deleteCafe that also triggers cross-tab notification
  const handleDeleteCafe = async (cafeId: string) => {
    const result = await deleteCafe(cafeId);
    if (result) {
      // Trigger an immediate fetch in this tab
      refreshCafeData();
      await fetchCafes(true);
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
