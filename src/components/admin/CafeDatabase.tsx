
import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import CafeList from '@/components/CafeList';
import { Cafe } from '@/types';
import ExportToExcel from './ExportToExcel';
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { useData } from '@/contexts/DataContext';
import { toast } from 'sonner';
import { refreshCafeData } from '@/integrations/supabase/client';
import { supabase } from '@/integrations/supabase/client';

interface CafeDatabaseProps {
  cafes: Cafe[];
}

export const CafeDatabase: React.FC<CafeDatabaseProps> = ({ cafes }) => {
  const { refreshCafes, loading } = useData();
  const [isRefreshing, setIsRefreshing] = React.useState(false);

  const handleForceRefresh = async () => {
    try {
      setIsRefreshing(true);
      toast.info("Forcefully refreshing cafe data from server...");
      
      // Skip the edge function call and use direct refresh methods
      try {
        console.log("Direct refresh initiated - fetching data without edge functions");
        // Use multiple refresh methods for redundancy
        await refreshCafeData(); // Direct DB refresh
        await new Promise(resolve => setTimeout(resolve, 500)); // Longer delay for sync
        await refreshCafes(); // Context refresh
      } catch (error) {
        console.error("Error in direct refresh:", error);
      }
      
      // Dispatch global refresh events
      window.dispatchEvent(new CustomEvent('global_data_refresh'));
      window.dispatchEvent(new CustomEvent('horeca_data_updated', { 
        detail: { action: 'forceRefresh', timestamp: Date.now() }
      }));
      
      // Show success message with counts
      toast.success(`Data refreshed: ${cafes.length} cafes loaded`);
      
      // If no cafes were found, try one more time
      if (cafes.length === 0) {
        toast.info("No cafes found, trying alternative refresh method...");
        await new Promise(resolve => setTimeout(resolve, 1000));
        await refreshCafes();
        
        console.log("Second refresh attempt completed");
      }
    } catch (error) {
      console.error("Error refreshing cafes:", error);
      toast.error("Failed to refresh cafe data");
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Cafe Database</CardTitle>
          <CardDescription>All cafes in the system ({cafes.length} found)</CardDescription>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="flex items-center gap-2"
            onClick={handleForceRefresh}
            disabled={loading || isRefreshing}
          >
            <RefreshCw className={`h-4 w-4 ${(loading || isRefreshing) ? 'animate-spin' : ''}`} />
            {loading || isRefreshing ? 'Refreshing...' : 'Force Refresh'}
          </Button>
          <ExportToExcel cafes={cafes} />
        </div>
      </CardHeader>
      <CardContent>
        <CafeList adminView={true} />
      </CardContent>
    </Card>
  );
};
