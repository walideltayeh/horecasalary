
import { useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

/**
 * Hook for managing real-time channel subscriptions to cafe-related tables
 */
export const useRealtimeChannels = (
  onDataChange: (force?: boolean) => Promise<void>
) => {
  const channelsRef = useRef<any[]>([]);
  const lastUpdateTimeRef = useRef<number>(0);
  const pendingUpdatesRef = useRef<Set<string>>(new Set());
  const updateTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const setupChannels = useCallback(async () => {
    console.log("Setting up cafe realtime channels with optimized updates...");
    
    // Clean up existing channels first
    if (channelsRef.current.length > 0) {
      channelsRef.current.forEach(channel => {
        supabase.removeChannel(channel);
      });
      channelsRef.current = [];
    }

    try {
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
            console.log("Cafe change detected:", payload.eventType, payload);
            
            // For critical changes, force an immediate refresh
            const isCriticalChange = payload.eventType === 'INSERT' || 
                                    payload.eventType === 'DELETE';
            
            // Clear any pending timeout
            if (updateTimeoutRef.current) {
              clearTimeout(updateTimeoutRef.current);
            }
            
            // Schedule a refresh with appropriate timing
            updateTimeoutRef.current = setTimeout(() => {
              console.log(`Processing ${payload.eventType} change for cafes, forcing refresh:`, isCriticalChange);
              onDataChange(isCriticalChange);
              
              // Also dispatch global refresh event
              window.dispatchEvent(new CustomEvent('global_data_refresh'));
              
              updateTimeoutRef.current = null;
            }, isCriticalChange ? 300 : 1000); // Faster refresh for critical changes
          }
        )
        .subscribe((status) => {
          console.log(`Realtime channels subscribed with status: ${status}`);
          if (status === 'SUBSCRIBED') {
            toast.success("Realtime updates activated");
          }
        });
        
      channelsRef.current.push(channel);
      
      try {
        // Try to enable realtime via edge function
        const { error } = await supabase.functions.invoke('enable-realtime', { 
          body: { table_name: 'cafes' }
        });
        
        if (error) {
          console.error("Failed to enable realtime via edge function:", error);
        } else {
          console.log("Realtime subscription activated for cafes table");
        }
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
    };
  }, [onDataChange]);

  return { setupChannels };
};
