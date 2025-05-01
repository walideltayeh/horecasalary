
import { useCallback } from 'react';
import { supabase, refreshCafeData } from '@/integrations/supabase/client';

export const useAdminRefresh = () => {
  const handleRefreshCafes = useCallback(async (force?: boolean) => {
    try {
      console.log("Refreshing cafe data...", force ? "(forced)" : "");
      await refreshCafeData();
      console.log("Cafe data refreshed");
    } catch (error) {
      console.error("Error refreshing cafes:", error);
    }
  }, []);

  const enableRealtimeForTable = useCallback(async (tableName: string) => {
    try {
      const { error } = await supabase.functions.invoke('enable-realtime', {
        body: { table_name: tableName }
      });
      
      if (error) {
        console.error(`Admin: Error enabling realtime for ${tableName}:`, error);
      } else {
        console.log(`Admin: Successfully enabled realtime for ${tableName}`);
      }
    } catch (err) {
      console.error("Admin: Error enabling realtime:", err);
    }
  }, []);

  return {
    handleRefreshCafes,
    enableRealtimeForTable
  };
};
