
import { useEffect, useRef } from 'react';
import { Cafe } from '@/types';

export const useEventListeners = (
  setLocalCafes: React.Dispatch<React.SetStateAction<Cafe[]>>,
  refreshing: boolean,
  deleteInProgress: string | null,
  handleRefresh?: () => Promise<void>
) => {
  const mounted = useRef(true);
  const lastEventTimeRef = useRef<number>(0);
  const eventTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Set up listeners with heavy throttling to prevent infinite loops
  useEffect(() => {
    const handleDataReady = (event: CustomEvent) => {
      const { cafes } = event.detail || {};
      
      if (mounted.current && cafes && Array.isArray(cafes)) {
        console.log("Cafe data ready event - updating local state");
        setLocalCafes(cafes);
      }
    };
    
    // Only handle critical events with heavy throttling
    const handleCriticalUpdate = (event: CustomEvent) => {
      const detail = event.detail || {};
      const now = Date.now();
      
      // Heavy throttling - minimum 5 seconds between events
      if (now - lastEventTimeRef.current < 5000) {
        console.log("Event throttled - too recent");
        return;
      }
      
      // Only handle truly critical updates
      const isCritical = 
        detail.action === 'cafeDeleted' || 
        detail.action === 'cafeAdded' ||
        detail.forceRefresh === true;
      
      if (!isCritical) {
        return;
      }
      
      if (mounted.current && !refreshing && handleRefresh) {
        // Clear any existing timeout
        if (eventTimeoutRef.current) {
          clearTimeout(eventTimeoutRef.current);
        }
        
        console.log("Critical update detected - scheduling refresh");
        lastEventTimeRef.current = now;
        
        // Debounce the refresh call
        eventTimeoutRef.current = setTimeout(() => {
          if (mounted.current && !refreshing) {
            handleRefresh();
          }
        }, 1000);
      }
    };
    
    // Handle cafe deleted event with immediate local state update
    const handleCafeDeleted = (event: CustomEvent) => {
      const { cafeId } = event.detail;
      
      if (mounted.current && cafeId) {
        console.log("Cafe deleted - updating local state");
        setLocalCafes(prev => prev.filter(cafe => cafe.id !== cafeId));
      }
    };
    
    // Listen only to essential events
    window.addEventListener('cafe_data_ready', handleDataReady as EventListener);
    window.addEventListener('horeca_data_updated', handleCriticalUpdate as EventListener);
    window.addEventListener('cafe_deleted', handleCafeDeleted as EventListener);
    
    return () => {
      window.removeEventListener('cafe_data_ready', handleDataReady as EventListener);
      window.removeEventListener('horeca_data_updated', handleCriticalUpdate as EventListener);
      window.removeEventListener('cafe_deleted', handleCafeDeleted as EventListener);
      
      if (eventTimeoutRef.current) {
        clearTimeout(eventTimeoutRef.current);
      }
    };
  }, [refreshing, deleteInProgress, setLocalCafes, handleRefresh]);
  
  // Cleanup function to prevent state updates after unmount
  useEffect(() => {
    mounted.current = true;
    return () => {
      console.log("useEventListeners cleanup");
      mounted.current = false;
      if (eventTimeoutRef.current) {
        clearTimeout(eventTimeoutRef.current);
      }
    };
  }, []);
  
  return mounted;
};
