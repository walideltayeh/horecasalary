
import React from 'react';
import { getCafeSize } from '@/utils/cafeUtils';
import { useCafeState } from './useCafeState';
import { useCafeEvents } from './CafeEvents';
import { CafeContext } from '../CafeContext';

export const CafeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { 
    cafes, 
    loading, 
    addCafe, 
    updateCafe, 
    updateCafeStatus, 
    deleteCafe,
    fetchCafes,
    lastRefreshTime,
    setLastRefreshTime
  } = useCafeState();
  
  // Set up refreshing functionality
  const { refreshCafes } = useCafeEvents({ 
    fetchCafes, 
    setLastRefreshTime, 
    lastRefreshTime 
  });

  // Create the context value with all required properties
  const contextValue = {
    cafes,
    addCafe,
    updateCafe,
    updateCafeStatus,
    getCafeSize,
    deleteCafe,
    loading,
    refreshCafes
  };

  return (
    <CafeContext.Provider value={contextValue}>
      {children}
    </CafeContext.Provider>
  );
};
