
import React from 'react';
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
