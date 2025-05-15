
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
