
import { useEffect, useRef, useCallback } from 'react';

interface DashboardDataRefreshProps {
  refreshCafes: () => void;
}

export const useDashboardDataRefresh = ({ refreshCafes }: DashboardDataRefreshProps) => {
  const refreshInProgressRef = useRef(false);
  const lastRefreshTimeRef = useRef(Date.now());
  
  // Only refresh on initial mount and specific data changes
  useEffect(() => {
    refreshCafes();
  }, [refreshCafes]);
  
  // Create a throttled refresh function
  const debouncedRefresh = useCallback((forceRefresh = false) => {
    if (refreshInProgressRef.current) {
      return;
    }
    
    const now = Date.now();
    if (!forceRefresh && now - lastRefreshTimeRef.current < 5000) { 
      return;
    }
    
    refreshInProgressRef.current = true;
    lastRefreshTimeRef.current = now;
    
    refreshCafes();
    
    // Reset flag after delay
    setTimeout(() => {
      refreshInProgressRef.current = false;
    }, 1000);
  }, [refreshCafes]);
  
  // Listen ONLY for specific critical data updates
  useEffect(() => {
    const handleDataUpdated = (event: CustomEvent) => {
      const detail = event.detail || {};
      
      // Only refresh for specific important actions
      if (detail.action === 'statusUpdate' || 
          detail.action === 'cafeCreated' ||
          detail.action === 'cafeEdited' ||
          detail.action === 'cafeDeleted') {
        
        debouncedRefresh(true);
      }
    };
    
    const handleCafeDeleted = (event: CustomEvent) => {
      debouncedRefresh(true);
    };
    
    window.addEventListener('horeca_data_updated', handleDataUpdated as EventListener);
    window.addEventListener('cafe_deleted', handleCafeDeleted as EventListener);
    
    return () => {
      window.removeEventListener('horeca_data_updated', handleDataUpdated as EventListener);
      window.removeEventListener('cafe_deleted', handleCafeDeleted as EventListener);
    };
  }, [debouncedRefresh]);
};
