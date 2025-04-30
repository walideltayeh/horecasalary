
import { useEffect, useRef } from 'react';
import { Cafe } from '@/types';

export const useEventListeners = (
  setLocalCafes: React.Dispatch<React.SetStateAction<Cafe[]>>,
  refreshing: boolean,
  deleteInProgress: string | null,
  handleRefresh?: () => Promise<void>
) => {
  const mounted = useRef(true);
  const lastRefreshTime = useRef(Date.now());
  const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Set up listeners for data update events with stronger throttling
  useEffect(() => {
    const handleDataUpdated = (event: CustomEvent) => {
      const detail = event.detail || {};
      
      // Only respond to specific events, ignore generic refreshes
      const isCriticalUpdate = 
        detail.action === 'statusUpdate' || 
        detail.action === 'cafeCreated' || 
        detail.action === 'cafeEdited' ||
        detail.action === 'cafeDeleted';
      
      if (isCriticalUpdate) {
        // Throttle updates
        const now = Date.now();
        if (now - lastRefreshTime.current < 5000) { 
          return;
        }
        
        if (mounted.current && !refreshing && handleRefresh) {
          // Clear any existing timeout
          if (refreshTimeoutRef.current) {
            clearTimeout(refreshTimeoutRef.current);
          }
          
          // Execute refresh for critical updates
          lastRefreshTime.current = Date.now();
          handleRefresh();
        }
      }
    };
    
    const handleCafeDeleted = (event: CustomEvent) => {
      const { cafeId } = event.detail;
      
      // Update local state immediately for better responsiveness
      if (mounted.current) {
        setLocalCafes(prev => prev.filter(cafe => cafe.id !== cafeId));
        
        // Also trigger a refresh to ensure data consistency but with delay
        if (handleRefresh && !refreshing) {
          // Clear any existing timeout
          if (refreshTimeoutRef.current) {
            clearTimeout(refreshTimeoutRef.current);
          }
          
          // Use timeout to debounce multiple events
          refreshTimeoutRef.current = setTimeout(() => {
            lastRefreshTime.current = Date.now();
            handleRefresh();
          }, 1000);
        }
      }
    };
    
    // Handle cafe stats updated event
    const handleStatsUpdated = () => {
      console.log("Stats updated event received");
      
      // Throttle updates
      const now = Date.now();
      if (now - lastRefreshTime.current < 5000) {
        return;
      }
      
      if (mounted.current && !refreshing && handleRefresh) {
        // Clear any existing timeout
        if (refreshTimeoutRef.current) {
          clearTimeout(refreshTimeoutRef.current);
        }
        
        // Execute refresh for stats updates
        lastRefreshTime.current = Date.now();
        console.log("Refreshing due to stats update");
        handleRefresh();
      }
    };
    
    // Modify direct refresh handler to throttle requests
    const handleRefreshRequested = (event: CustomEvent) => {
      const force = event.detail?.force === true;
      
      // Only respond to forced refresh requests
      if (force) {
        const now = Date.now();
        if (now - lastRefreshTime.current < 5000) { 
          return;
        }
        
        if (mounted.current && handleRefresh) {
          // Clear any existing timeout
          if (refreshTimeoutRef.current) {
            clearTimeout(refreshTimeoutRef.current);
          }
          
          lastRefreshTime.current = Date.now();
          handleRefresh();
        }
      }
    };
    
    window.addEventListener('horeca_data_updated', handleDataUpdated);
    window.addEventListener('cafe_deleted', handleCafeDeleted as EventListener);
    window.addEventListener('horeca_data_refresh_requested', handleRefreshRequested as EventListener);
    window.addEventListener('cafe_stats_updated', handleStatsUpdated as EventListener);
    
    return () => {
      window.removeEventListener('horeca_data_updated', handleDataUpdated);
      window.removeEventListener('cafe_deleted', handleCafeDeleted as EventListener);
      window.removeEventListener('horeca_data_refresh_requested', handleRefreshRequested as EventListener);
      window.removeEventListener('cafe_stats_updated', handleStatsUpdated as EventListener);
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
    };
  }, [refreshing, deleteInProgress, setLocalCafes, handleRefresh]);
  
  // Cleanup function to prevent state updates after unmount
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
    };
  }, []);
  
  return mounted;
};
