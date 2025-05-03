
import { useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

/**
 * Hook for managing real-time channel subscriptions to cafe-related tables
 * Uses a more efficient approach with improved throttling
 */
export const useRealtimeChannels = (
  onDataChange: (force?: boolean) => Promise<void>
) => {
  const channelsRef = useRef<any[]>([]);
  const lastUpdateTimeRef = useRef<number>(0);
  const pendingUpdatesRef = useRef<Set<string>>(new Set());
  const updateTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const setupCompleteRef = useRef<boolean>(false);

  const setupChannels = useCallback(async () => {
    // Skip setup if already completed to prevent duplicate subscriptions
    if (setupCompleteRef.current) {
      console.log("Realtime channels already set up, skipping");
      return () => {}; // Return empty cleanup function
    }

    console.log("Setting up cafe realtime channels with optimized updates...");
    
    // Clean up existing channels first
    if (channelsRef.current.length > 0) {
      channelsRef.current.forEach(channel => {
        supabase.removeChannel(channel);
      });
      channelsRef.current = [];
    }

    try {
      // Function to process updates in batches with increased debounce time
      const processUpdates = () => {
        if (pendingUpdatesRef.current.size === 0) return;
        
        console.log(`Processing ${pendingUpdatesRef.current.size} pending updates`);
        
        // Reset pending updates
        pendingUpdatesRef.current.clear();
        
        // Trigger a single refresh with increased throttling
        const now = Date.now();
        if (now - lastUpdateTimeRef.current > 10000) {  // Increased from 5s to 10s
          lastUpdateTimeRef.current = now;
          
          // Dispatch event rather than performing direct refresh
          window.dispatchEvent(new CustomEvent('horeca_data_updated'));
        }
      };
      
      // Create a smarter update handler that collects changes and processes them in batches
      const scheduleUpdate = (type: string, tableName: string) => {
        // Add to pending updates
        pendingUpdatesRef.current.add(`${type}:${tableName}`);
        
        // Clear previous timeout if exists
        if (updateTimeoutRef.current) {
          clearTimeout(updateTimeoutRef.current);
        }
        
        // Set a new timeout to process all pending updates with increased debounce time
        updateTimeoutRef.current = setTimeout(() => {
          processUpdates();
          updateTimeoutRef.current = null;
        }, 2500); // Increased to 2.5s debounce for better performance
      };
      
      // Create a single channel for all database changes instead of multiple channels
      const channel = supabase
        .channel('db-changes')
        .on('postgres_changes', 
          {
            event: '*', 
            schema: 'public', 
            table: 'cafes'
          },
          (payload) => {
            console.log("Cafe change detected:", payload.eventType);
            scheduleUpdate(payload.eventType, 'cafes');
          }
        )
        .subscribe((status) => {
          console.log(`Realtime channels subscribed with status: ${status}`);
        });
        
      channelsRef.current.push(channel);
      
      // Set setup as complete to prevent duplicate subscriptions
      setupCompleteRef.current = true;
      
      // Try to enable realtime once instead of multiple times
      try {
        await supabase.functions.invoke('enable-realtime', { 
          body: { table_name: 'cafes' }
        });
        console.log("Realtime subscription activated for cafes table");
      } catch (err) {
        console.warn("Non-critical error enabling realtime:", err);
      }
    } catch (err) {
      console.error("Error setting up realtime subscriptions:", err);
    }

    // Return a cleanup function
    return () => {
      console.log("Cleaning up realtime subscriptions");
      // Clear any pending timeout
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
        updateTimeoutRef.current = null;
      }
      
      // Remove all channels
      channelsRef.current.forEach(channel => {
        supabase.removeChannel(channel);
      });
      channelsRef.current = [];
      
      // Reset setup flag
      setupCompleteRef.current = false;
    };
  }, []);

  return { setupChannels };
};
