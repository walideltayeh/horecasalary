
import React from 'react';
import { Button } from "@/components/ui/button";
import { RefreshCcw } from 'lucide-react';
import ExportToExcel from '../admin/ExportToExcel';
import { Cafe } from '@/types';

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
  return (
    <div className="flex gap-2">
      <ExportToExcel cafes={filteredCafes} />
      <Button
        variant="outline"
        size="sm"
        className="flex items-center gap-1"
        onClick={handleRefresh}
        disabled={loading || refreshing}
      >
        <RefreshCcw className={`h-3 w-3 ${loading || refreshing ? 'animate-spin' : ''}`} /> 
        {loading || refreshing ? 'Refreshing...' : 'Refresh Data'}
      </Button>
    </div>
  );
};

export default CafeTableActions;
