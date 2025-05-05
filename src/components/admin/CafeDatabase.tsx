
import React, { useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import CafeList from '@/components/CafeList';
import { Cafe } from '@/types';
import ExportToExcel from './ExportToExcel';
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { useData } from '@/contexts/DataContext';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';

interface CafeDatabaseProps {
  cafes?: Cafe[];
}

const CafeDatabase: React.FC<CafeDatabaseProps> = ({ cafes = [] }) => {
  const { refreshCafes, loading } = useData();
  const { t } = useLanguage();

  // Force initial data refresh on mount
  useEffect(() => {
    console.log("CafeDatabase mounted, refreshing cafe data");
    refreshCafes();
    
    // Listen for cafe added events
    const handleCafeAdded = () => {
      console.log("CafeDatabase detected cafe added event");
      refreshCafes();
    };
    
    window.addEventListener('cafe_added', handleCafeAdded);
    window.addEventListener('horeca_data_updated', handleCafeAdded);
    
    return () => {
      window.removeEventListener('cafe_added', handleCafeAdded);
      window.removeEventListener('horeca_data_updated', handleCafeAdded);
    };
  }, [refreshCafes]);

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
          <CardTitle>{t('cafe.database')}</CardTitle>
          <CardDescription>{t('cafe.all')}</CardDescription>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="flex items-center gap-2"
            onClick={handleForceRefresh}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            {loading ? t('cafe.refreshing') : t('cafe.force.refresh')}
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

export default CafeDatabase;
