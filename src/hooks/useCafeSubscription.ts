
import { useEffect, useRef, useCallback } from 'react';
import { Cafe } from '@/types';
import { useCafeFetch } from './cafe/useCafeFetch';
import { useRealtimeChannels } from './cafe/useRealtimeChannels';
import { useDataRefreshEvents } from './cafe/useDataRefreshEvents';
import { usePeriodicRefresh } from './cafe/usePeriodicRefresh';

/**
 * Main hook for cafe data subscription that combines all the specialized hooks with optimized performance
 */
export const useCafeSubscription = (
  user: any | null,
  setCafes: React.Dispatch<React.SetStateAction<Cafe[]>>,
  setLoading: (loading: boolean) => void
) => {
  // Track if component is mounted to prevent state updates after unmounting
  const isMounted = useRef<boolean>(true);
  
  // Set up the fetch mechanism with optimized caching
  const { fetchCafes, isAdminRef } = useCafeFetch(
    user, 
    (cafes) => {
      if (isMounted.current) {
        setCafes(cafes);
      }
    }, 
    (loading) => {
      if (isMounted.current) {
        setLoading(loading);
      }
    }
  );
  
  // Create memoized fetch function to prevent recreation on renders
  const memoizedFetchCafes = useCallback(fetchCafes, [fetchCafes]);
  
  // Set up realtime channel subscriptions with reduced connection overhead
  const { setupChannels } = useRealtimeChannels(memoizedFetchCafes);
  
  // Set up event listeners for data refresh with proper debouncing
  const { setupEventListeners } = useDataRefreshEvents(memoizedFetchCafes);
  
  // Set up periodic refresh based on user role with optimized intervals
  usePeriodicRefresh(memoizedFetchCafes, isAdminRef);

  // Store cleanup function reference
  const cleanupChannelsRef = useRef<(() => void) | null>(null);
  const cleanupEventsRef = useRef<(() => void) | null>(null);

  // Initialize subscription and fetch initial data
  useEffect(() => {
    console.log("Setting up cafe subscriptions...");
    
    // Set up event listeners
    const cleanupEvents = setupEventListeners();
    cleanupEventsRef.current = cleanupEvents;
    
    // Set up realtime channels (this returns a Promise that resolves to a cleanup function)
    setupChannels().then(cleanupFunction => {
      // Store the cleanup function for later use
      cleanupChannelsRef.current = cleanupFunction;
    });
    
    // Always fetch cafes on mount, user change, or after subscription setup
    // Adding a slight delay to ensure all subscriptions are set up first
    const timer = setTimeout(() => {
      if (isMounted.current) {
        memoizedFetchCafes(true);
      }
    }, 100);
    
    return () => {
      // Mark component as unmounted to prevent state updates
      isMounted.current = false;
      
      // Clear the timeout
      clearTimeout(timer);
      
      // Call cleanup functions if they exist
      if (cleanupEventsRef.current) {
        cleanupEventsRef.current();
      }
      
      if (cleanupChannelsRef.current) {
        cleanupChannelsRef.current();
      }
    };
  }, [memoizedFetchCafes, setupEventListeners, setupChannels]);

  return { fetchCafes: memoizedFetchCafes };
};
