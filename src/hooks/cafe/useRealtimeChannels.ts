
import { useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

/**
 * Hook for managing real-time channel subscriptions to cafe-related tables
 * Uses a more efficient approach with selective updates instead of full refreshes
 */
export const useRealtimeChannels = (
  onDataChange: (force?: boolean) => Promise<void>
) => {
  const channelsRef = useRef<any[]>([]);
  const lastUpdateTimeRef = useRef<number>(0);
  const pendingUpdatesRef = useRef<Set<string>>(new Set());
  const updateTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const setupChannels = useCallback(async () => {
    console.log("Setting up cafe realtime channels with selective updates...");
    
    // Clean up existing channels first
    if (channelsRef.current.length > 0) {
      channelsRef.current.forEach(channel => {
        supabase.removeChannel(channel);
      });
      channelsRef.current = [];
    }

    try {
      // Function to process updates in batches for better performance
      const processUpdates = () => {
        if (pendingUpdatesRef.current.size === 0) return;
        
        console.log(`Processing ${pendingUpdatesRef.current.size} pending updates`);
        
        // Reset pending updates
        pendingUpdatesRef.current.clear();
        
        // Trigger a single refresh
        const now = Date.now();
        if (now - lastUpdateTimeRef.current > 1000) {  // Only if last refresh was >1s ago
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
        
        // Set a new timeout to process all pending updates
        updateTimeoutRef.current = setTimeout(() => {
          processUpdates();
          updateTimeoutRef.current = null;
        }, 500); // 500ms debounce
      };
      
      // Create a single channel for all database changes
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
        .on('postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'cafe_surveys'
          },
          (payload) => {
            console.log("Cafe survey change detected:", payload.eventType);
            scheduleUpdate(payload.eventType, 'cafe_surveys');
          }
        )
        .on('postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'brand_sales'
          },
          (payload) => {
            console.log("Brand sales change detected:", payload.eventType);
            scheduleUpdate(payload.eventType, 'brand_sales');
          }
        )
        .subscribe((status) => {
          console.log(`Realtime channels subscribed with status: ${status}`);
        });
        
      channelsRef.current.push(channel);
      
      // Enable realtime for all relevant tables using the enable-realtime function
      try {
        await Promise.all([
          supabase.functions.invoke('enable-realtime', { body: { table_name: 'cafes' }}),
          supabase.functions.invoke('enable-realtime', { body: { table_name: 'cafe_surveys' }}),
          supabase.functions.invoke('enable-realtime', { body: { table_name: 'brand_sales' }})
        ]);
        console.log("Realtime subscription activated");
      } catch (err) {
        console.warn("Non-critical error enabling realtime:", err);
        // Continue anyway as the function might not exist or fail for other reasons
      }
    } catch (err) {
      console.error("Error setting up realtime subscriptions:", err);
      toast.error('Failed to set up realtime updates');
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
    };
  }, []);

  return { setupChannels };
};
