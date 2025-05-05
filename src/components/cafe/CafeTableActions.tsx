
import React from 'react';
import { Button } from "@/components/ui/button";
import { RefreshCcw } from 'lucide-react';
import ExportToExcel from '../admin/ExportToExcel';
import { Cafe } from '@/types';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useLanguage } from '@/contexts/LanguageContext';

interface CafeTableActionsProps {
  loading: boolean;
  refreshing: boolean;
  filteredCafes: Cafe[];
  handleRefresh: () => Promise<void>;
}

const CafeTableActions: React.FC<CafeTableActionsProps> = ({ 
  loading, 
  refreshing, 
  filteredCafes, 
  handleRefresh 
}) => {
  const { t } = useLanguage();
  
  return (
    <div className="flex gap-2">
      <ExportToExcel cafes={filteredCafes} />
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-1"
              onClick={handleRefresh}
              disabled={loading || refreshing}
            >
              <RefreshCcw className={`h-3 w-3 ${loading || refreshing ? 'animate-spin' : ''}`} /> 
              {loading || refreshing ? t('cafe.refreshing') : t('cafe.refresh.data')}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Refresh cafe data from server</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
};

export default CafeTableActions;
