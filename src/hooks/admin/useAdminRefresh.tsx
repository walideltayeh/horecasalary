
import { useCallback } from 'react';
import { supabase, refreshCafeData } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useAdminRefresh = () => {
  const handleRefreshCafes = useCallback(async () => {
    try {
      console.log("Refreshing cafe data...");
      // Force cache invalidation by adding timestamp parameter
      const timestamp = Date.now();
      await refreshCafeData();
      console.log(`Cafe data refreshed at ${new Date().toLocaleTimeString()} with timestamp ${timestamp}`);
      
      // Also dispatch specific refresh events
      window.dispatchEvent(new CustomEvent('cafe_data_force_refresh', { 
        detail: { timestamp }
      }));
      
      return true;
    } catch (error) {
      console.error("Error refreshing cafes:", error);
      toast.error("Failed to refresh cafe data");
      return false;
    }
  }, []);

  const enableRealtimeForTable = useCallback(async (tableName: string) => {
    try {
      console.log(`Enabling realtime for table: ${tableName}`);
      const { error } = await supabase.functions.invoke('enable-realtime', {
        body: { table_name: tableName }
      });
      
      if (error) {
        console.error(`Admin: Error enabling realtime for ${tableName}:`, error);
        return false;
      } else {
        console.log(`Admin: Successfully enabled realtime for ${tableName}`);
        return true;
      }
    } catch (err) {
      console.error("Admin: Error enabling realtime:", err);
      return false;
    }
  }, []);

  return {
    handleRefreshCafes,
    enableRealtimeForTable
  };
};
