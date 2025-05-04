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
  
  // Set up listeners for data update events with reduced throttling
  useEffect(() => {
    const handleDataUpdated = (event: CustomEvent) => {
      const detail = event.detail || {};
      
      // Consider more events as critical
      const isCriticalUpdate = 
        detail.action === 'statusUpdate' || 
        detail.action === 'cafeCreated' || 
        detail.action === 'cafeEdited' ||
        detail.action === 'cafeDeleted' || 
        detail.action === 'cafeAdded' ||
        detail.highPriority === true ||
        detail.forceRefresh === true;
      
      if (!isCriticalUpdate) {
        return; // Skip non-critical updates
      }
      
      // Reduce throttling to 5 seconds (was 10 seconds)
      const now = Date.now();
      if (now - lastRefreshTime.current < 5000) { 
        console.log("Skipping refresh - too recent");
        return;
      }
      
      if (mounted.current && !refreshing && handleRefresh) {
        // Clear any existing timeout
        if (refreshTimeoutRef.current) {
          clearTimeout(refreshTimeoutRef.current);
        }
        
        // Execute refresh for critical updates with shorter delay
        lastRefreshTime.current = Date.now();
        console.log("Critical update detected - refreshing data");
        handleRefresh();
      }
    };
    
    // Handle cafe added events specifically - add local state update
    const handleCafeAdded = (event: CustomEvent) => {
      const { cafeId } = event.detail || {};
      console.log("Cafe added event detected, ID:", cafeId);
      
      if (cafeId && handleRefresh && !refreshing) {
        console.log("Cafe added - triggering immediate refresh");
        // Clear any existing timeout
        if (refreshTimeoutRef.current) {
          clearTimeout(refreshTimeoutRef.current);
        }
        
        // Trigger refresh with shorter delay
        refreshTimeoutRef.current = setTimeout(() => {
          lastRefreshTime.current = Date.now();
          handleRefresh();
        }, 500);
      }
    };
    
    // Handle cafe deleted event - keep current behavior for deletion
    const handleCafeDeleted = (event: CustomEvent) => {
      const { cafeId } = event.detail;
      
      // Update local state immediately for better responsiveness
      if (mounted.current) {
        setLocalCafes(prev => prev.filter(cafe => cafe.id !== cafeId));
        
        // Only trigger refresh after deletion if absolutely necessary
        // with a significant delay to reduce network load
        if (handleRefresh && !refreshing) {
          // Clear any existing timeout
          if (refreshTimeoutRef.current) {
            clearTimeout(refreshTimeoutRef.current);
          }
          
          // Use longer timeout to debounce multiple events
          refreshTimeoutRef.current = setTimeout(() => {
            lastRefreshTime.current = Date.now();
            handleRefresh();
          }, 2500);
        }
      }
    };
    
    // Handle cafe stats updated event with more aggressive throttling
    const handleStatsUpdated = () => {
      console.log("Stats updated event received");
      
      // Throttle updates with a much longer interval
      const now = Date.now();
      if (now - lastRefreshTime.current < 15000) {
        console.log("Skipping stats refresh - too recent");
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
    
    window.addEventListener('horeca_data_updated', handleDataUpdated);
    window.addEventListener('cafe_deleted', handleCafeDeleted as EventListener);
    window.addEventListener('cafe_added', handleCafeAdded as EventListener);
    window.addEventListener('cafe_stats_updated', handleStatsUpdated as EventListener);
    
    return () => {
      window.removeEventListener('horeca_data_updated', handleDataUpdated);
      window.removeEventListener('cafe_deleted', handleCafeDeleted as EventListener);
      window.removeEventListener('cafe_added', handleCafeAdded as EventListener);
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
