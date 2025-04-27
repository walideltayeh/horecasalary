
import React from 'react';
import { Button } from "@/components/ui/button";
import { RefreshCw } from 'lucide-react';

interface AdminHeaderProps {
  onRefreshCafes: () => void;
  loadingCafes: boolean;
}

const AdminHeader: React.FC<AdminHeaderProps> = ({ onRefreshCafes, loadingCafes }) => {
  return (
    <div className="flex justify-between items-center">
      <div>
        <h1 className="text-3xl font-bold mb-2">Admin Panel</h1>
        <p className="text-gray-600">Monitor user activity and cafe data</p>
      </div>
      
      <div className="flex gap-2">
        <Button 
          variant="outline" 
          className="flex items-center gap-2"
          onClick={onRefreshCafes}
          disabled={loadingCafes}
        >
          <RefreshCw className={`h-4 w-4 ${loadingCafes ? 'animate-spin' : ''}`} />
          {loadingCafes ? 'Refreshing...' : 'Refresh Data'}
        </Button>
      </div>
    </div>
  );
};

export default AdminHeader;
