
import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import CafeList from '@/components/CafeList';
import { Cafe } from '@/types';
import ExportToExcel from './ExportToExcel';
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { useData } from '@/contexts/DataContext';
import { toast } from 'sonner';

interface CafeDatabaseProps {
  cafes: Cafe[];
}

export const CafeDatabase: React.FC<CafeDatabaseProps> = ({ cafes }) => {
  const { refreshCafes, loading } = useData();

  const handleForceRefresh = async () => {
    try {
      toast.info("Refreshing cafe data...");
      await refreshCafes();
      toast.success("Cafe data refreshed");
    } catch (error) {
      console.error("Error refreshing cafes:", error);
      toast.error("Failed to refresh cafe data");
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Cafe Database</CardTitle>
          <CardDescription>All cafes in the system</CardDescription>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="flex items-center gap-2"
            onClick={handleForceRefresh}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Refreshing...' : 'Force Refresh'}
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
