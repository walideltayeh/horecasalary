
import React, { useEffect } from 'react';
import { getCafeSize } from '@/utils/cafeUtils';
import { useCafeState } from './useCafeState';
import { useCafeEvents, useCafeDeletionEvents } from './CafeEvents';
import { CafeContext } from './useCafeContext';

export const CafeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { 
    cafes, 
    setCafes,
    loading, 
    fetchCafes, 
    addCafe, 
    updateCafe, 
    updateCafeStatus, 
    deleteCafe,
    lastRefreshTime,
    setLastRefreshTime,
    pendingDeletions
  } = useCafeState();
  
  // Set up events for cafe deletion
  useCafeDeletionEvents({ fetchCafes });
  
  // Set up refreshing functionality
  const { refreshCafes } = useCafeEvents({ 
    fetchCafes, 
    setLastRefreshTime, 
    lastRefreshTime 
  });
  
  // Initial data load on mount
  useEffect(() => {
    console.log("CafeProvider mounted - forcing initial data refresh");
    fetchCafes(true);
    
    // Listen for global refresh events
    const handleGlobalRefresh = () => {
      console.log("Global refresh event received in CafeProvider");
      fetchCafes(true);
    };
    
    window.addEventListener('global_data_refresh', handleGlobalRefresh);
    
    return () => {
      window.removeEventListener('global_data_refresh', handleGlobalRefresh);
    };
  }, [fetchCafes]);

  return (
    <CafeContext.Provider
      value={{
        cafes,
        addCafe,
        updateCafe,
        updateCafeStatus,
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
