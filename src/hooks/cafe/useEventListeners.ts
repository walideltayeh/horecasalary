
import { useEffect, useRef } from 'react';
import { Cafe } from '@/types';

export const useEventListeners = (
  setLocalCafes: React.Dispatch<React.SetStateAction<Cafe[]>>,
  refreshing: boolean,
  deleteInProgress: string | null,
  handleRefresh?: () => Promise<void>
) => {
  const mounted = useRef(true);
  
  // Minimal event listeners - only listen to data ready events
  useEffect(() => {
    const handleDataReady = (event: CustomEvent) => {
      const { cafes } = event.detail || {};
      
      if (mounted.current && cafes && Array.isArray(cafes)) {
        console.log("Cafe data ready event - updating local state");
        setLocalCafes(cafes);
      }
    };
    
    // Only listen to essential data ready events
    window.addEventListener('cafe_data_ready', handleDataReady as EventListener);
    
    return () => {
      window.removeEventListener('cafe_data_ready', handleDataReady as EventListener);
    };
  }, [setLocalCafes]);
  
  // Cleanup function
  useEffect(() => {
    mounted.current = true;
    return () => {
      console.log("useEventListeners cleanup");
      mounted.current = false;
    };
  }, []);
  
  return mounted;
};
