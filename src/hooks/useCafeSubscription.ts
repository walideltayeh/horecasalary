
import { useEffect, useRef, useState } from 'react';
import { Cafe } from '@/types';
import { useDataRefreshEvents } from './cafe/useDataRefreshEvents';
import { setupConnectivityMonitoring } from '@/utils/networkUtils';

/**
 * Main hook for cafe data subscription that combines all the specialized hooks
 */
export const useCafeSubscription = (
  user: any | null,
  setCafes: React.Dispatch<React.SetStateAction<Cafe[]>>,
  setLoading: (loading: boolean) => void
) => {
  // Set up state for cafe data
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const isAdminRef = useRef(user?.role === 'admin');

  // Function to fetch cafes
  const fetchCafes = async (force = false) => {
    if (force || refreshTrigger === 0) {
      setLoading(true);
      // This would trigger a refresh in the component using this hook
      setRefreshTrigger(prev => prev + 1);
    }
  };
  
  // Set up event listeners for data refresh
  const { setupEventListeners } = useDataRefreshEvents(() => fetchCafes(true));

  // Store cleanup function reference
  const cleanupChannelsRef = useRef<(() => void) | null>(null);

  // Initialize subscription and fetch initial data
  useEffect(() => {
    console.log("Setting up cafe subscriptions...");
    
    // Set up event listeners
    const cleanupEvents = setupEventListeners();
    
    // Set up connectivity monitoring
    const cleanupConnectivity = setupConnectivityMonitoring(
      // Online callback
      () => {
        console.log("Device is online, refreshing cafe data");
        fetchCafes(true);
      },
      // Offline callback
      () => {
        console.log("Device is offline, cannot fetch cafe data");
      }
    );
    
    // Always fetch cafes on mount
    fetchCafes(true);
    
    return () => {
      cleanupEvents();
      cleanupConnectivity();
      // Call the cleanup function if it exists
      if (cleanupChannelsRef.current) {
        cleanupChannelsRef.current();
      }
    };
  }, []);

  return { fetchCafes };
};
