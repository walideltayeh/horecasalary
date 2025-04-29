
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

  const setupChannels = useCallback(async () => {
    console.log("Setting up cafe realtime channels...");
    
    // Clean up existing channels first
    if (channelsRef.current.length > 0) {
      channelsRef.current.forEach(channel => {
        supabase.removeChannel(channel);
      });
      channelsRef.current = [];
    }

    try {
      console.log("Setting up realtime channels for cafe data");
      
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
            onDataChange(true);
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
            onDataChange(true);
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
            onDataChange(true);
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
      
      console.log("Realtime subscription activated for all cafe-related tables");
    } catch (err) {
      console.error("Error setting up realtime subscriptions:", err);
      toast.error('Failed to set up realtime updates');
    }

    return () => {
      console.log("Cleaning up realtime subscriptions");
      channelsRef.current.forEach(channel => {
        supabase.removeChannel(channel);
      });
      channelsRef.current = [];
    };
  }, [onDataChange]);

  return { setupChannels };
};
