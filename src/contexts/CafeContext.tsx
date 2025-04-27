
import React, { createContext, useContext, useState, useEffect } from 'react';
import { Cafe, CafeSize } from '@/types';
import { useAuth } from './AuthContext';
import { getCafeSize } from '@/utils/cafeUtils';
import { useCafeOperations } from '@/hooks/useCafeOperations';
import { useCafeSubscription } from '@/hooks/useCafeSubscription';

interface CafeContextType {
  cafes: Cafe[];
  addCafe: (cafe: Omit<Cafe, 'id' | 'createdAt'>) => Promise<string | null>;
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
  const { loading, setLoading, addCafe, updateCafeStatus, deleteCafe } = useCafeOperations();
  
  // Set up real-time subscriptions and fetch initial data
  const { fetchCafes } = useCafeSubscription(user, setCafes, setLoading);
  
  // Setup message event listener for cross-tab communication
  useEffect(() => {
    const handleStorageEvent = (event: StorageEvent) => {
      if (event.key === 'cafe_data_updated') {
        console.log("Detected cafe data update from another tab, refreshing...");
        fetchCafes();
      }
    };
    
    // Listen for storage events (works across tabs)
    window.addEventListener('storage', handleStorageEvent);
    
    return () => {
      window.removeEventListener('storage', handleStorageEvent);
    };
  }, [fetchCafes]);

  // Custom cafe adding function that also triggers cross-tab notification
  const handleAddCafe = async (cafe: Omit<Cafe, 'id' | 'createdAt'>) => {
    console.log("Adding cafe:", cafe);
    const cafeId = await addCafe(cafe);
    if (cafeId) {
      // Notify other tabs about the update
      localStorage.setItem('cafe_data_updated', String(new Date().getTime()));
      // This triggers the storage event in other tabs
      
      // Trigger an immediate fetch in this tab
      await fetchCafes();
    }
    return cafeId;
  };

  // Custom updateCafeStatus that also triggers cross-tab notification
  const handleUpdateCafeStatus = async (cafeId: string, status: 'Pending' | 'Visited' | 'Contracted') => {
    const result = await updateCafeStatus(cafeId, status);
    if (result) {
      // Notify other tabs
      localStorage.setItem('cafe_data_updated', String(new Date().getTime()));
      // Immediate fetch in this tab
      await fetchCafes();
    }
    return result;
  };
  
  // Manual refresh function
  const refreshCafes = async () => {
    console.log("Manual refresh triggered");
    await fetchCafes();
  };

  return (
    <CafeContext.Provider
      value={{
        cafes,
        addCafe: handleAddCafe,
        updateCafeStatus: handleUpdateCafeStatus,
        getCafeSize,
        deleteCafe,
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
