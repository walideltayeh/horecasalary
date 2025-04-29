
import { useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

/**
 * Hook for managing real-time channel subscriptions to cafe-related tables
 * Now uses a more selective update approach
 */
export const useRealtimeChannels = (
  onDataChange: (force?: boolean) => Promise<void>
) => {
  const channelsRef = useRef<any[]>([]);
  const lastUpdateTimeRef = useRef<number>(0);

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
      // Create a debounced update handler to prevent excessive refreshes
      const triggerUpdate = () => {
        const now = Date.now();
        // Only refresh if it's been at least 2 seconds since last update
        if (now - lastUpdateTimeRef.current > 2000) {
          console.log("Realtime update triggered - refreshing data");
          lastUpdateTimeRef.current = now;
          
          // Dispatch event rather than performing direct refresh
          window.dispatchEvent(new CustomEvent('horeca_data_updated'));
        } else {
          console.log("Realtime update debounced");
        }
      };
      
      // Create a channel for all database changes
      const channel = supabase
        .channel('db-changes')
        .on('postgres_changes', 
          {
            event: '*', 
            schema: 'public', 
            table: 'cafes'
          },
          (payload) => {
            console.log("Cafe change detected:", payload);
            triggerUpdate();
          }
        )
        .subscribe((status) => {
          console.log(`Cafe channel subscribed with status: ${status}`);
        });
        
      channelsRef.current.push(channel);
      
      // Also listen for changes in the cafe_surveys table
      const surveysChannel = supabase
        .channel('survey-changes')
        .on('postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'cafe_surveys'
          },
          (payload) => {
            console.log("Cafe survey change detected:", payload);
            triggerUpdate();
          }
        )
        .subscribe((status) => {
          console.log(`Survey channel subscribed with status: ${status}`);
        });
        
      channelsRef.current.push(surveysChannel);
      
      // Listen for changes in the brand_sales table
      const salesChannel = supabase
        .channel('sales-changes')
        .on('postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'brand_sales'
          },
          (payload) => {
            console.log("Brand sales change detected:", payload);
            triggerUpdate();
          }
        )
        .subscribe((status) => {
          console.log(`Brand sales channel subscribed with status: ${status}`);
        });
        
      channelsRef.current.push(salesChannel);
      
      // Enable realtime for all relevant tables using the enable-realtime function
      await Promise.all([
        supabase.functions.invoke('enable-realtime', { body: { table_name: 'cafes' }}),
        supabase.functions.invoke('enable-realtime', { body: { table_name: 'cafe_surveys' }}),
        supabase.functions.invoke('enable-realtime', { body: { table_name: 'brand_sales' }})
      ]);
      
      console.log("Realtime subscription activated with selective updates");
    } catch (err) {
      console.error("Error setting up realtime subscriptions:", err);
      toast.error('Failed to set up realtime updates');
    }

    // Return a cleanup function
    return () => {
      console.log("Cleaning up realtime subscriptions");
      channelsRef.current.forEach(channel => {
        supabase.removeChannel(channel);
      });
      channelsRef.current = [];
    };
  }, []);

  return { setupChannels };
};
