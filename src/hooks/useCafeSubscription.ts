
import { useEffect } from 'react';
import { Cafe } from '@/types';
import { useCafeFetch } from './cafe/useCafeFetch';
import { useRealtimeChannels } from './cafe/useRealtimeChannels';
import { useDataRefreshEvents } from './cafe/useDataRefreshEvents';
import { usePeriodicRefresh } from './cafe/usePeriodicRefresh';

/**
 * Main hook for cafe data subscription that combines all the specialized hooks
 */
export const useCafeSubscription = (
  user: any | null,
  setCafes: React.Dispatch<React.SetStateAction<Cafe[]>>,
  setLoading: (loading: boolean) => void
) => {
  // Set up the fetch mechanism
  const { fetchCafes, isAdminRef } = useCafeFetch(user, setCafes, setLoading);
  
  // Set up realtime channel subscriptions
  const { setupChannels } = useRealtimeChannels(fetchCafes);
  
  // Set up event listeners for data refresh
  const { setupEventListeners } = useDataRefreshEvents(fetchCafes);
  
  // Set up periodic refresh based on user role
  usePeriodicRefresh(fetchCafes, isAdminRef);

  // Initialize subscription and fetch initial data
  useEffect(() => {
    console.log("Setting up cafe subscriptions...");
    
    // Set up event listeners
    const cleanupEvents = setupEventListeners();
    
    // Set up realtime channels
    const cleanupChannels = setupChannels();
    
    // Always fetch cafes on mount, user change, or after subscription setup
    fetchCafes(true);
    
    return () => {
      cleanupEvents();
      if (typeof cleanupChannels === 'function') {
        cleanupChannels();
      }
    };
  }, [fetchCafes, setupEventListeners, setupChannels]);

  return { fetchCafes };
};
