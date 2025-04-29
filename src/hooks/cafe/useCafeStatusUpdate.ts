
import { useRef } from 'react';
import { Cafe } from '@/types';
import { useData } from '@/contexts/DataContext';
import { toast } from 'sonner';

export const useCafeStatusUpdate = (
  setLocalCafes: React.Dispatch<React.SetStateAction<Cafe[]>>,
  cafes: Cafe[]
) => {
  const { updateCafeStatus, refreshCafes } = useData();
  const mounted = useRef(true);
  
  const handleUpdateStatus = async (cafeId: string, newStatus: 'Pending' | 'Visited' | 'Contracted') => {
    console.log(`Updating cafe status: ${cafeId} to ${newStatus}`);
    
    // Optimistic update
    setLocalCafes(prev => 
      prev.map(cafe => cafe.id === cafeId ? {...cafe, status: newStatus} : cafe)
    );
    
    try {
      const success = await updateCafeStatus(cafeId, newStatus);
      if (!success && mounted.current) {
        // Revert on failure
        setLocalCafes(cafes);
        toast.error(`Failed to update cafe status`);
      } else {
        toast.success(`Cafe status updated to ${newStatus}`);
        
        // Broadcast a data update event to trigger refresh across components
        window.dispatchEvent(new CustomEvent('horeca_data_updated', {
          detail: { action: 'statusUpdate', cafeId, newStatus }
        }));
        
        // Force a refresh to ensure synchronized state
        console.log("Forcing refresh after status update");
        setTimeout(() => refreshCafes(), 300);
      }
    } catch (error) {
      if (mounted.current) {
        setLocalCafes(cafes);
        toast.error(`Error updating status`);
        // Force a refresh to ensure synchronized state
        refreshCafes();
      }
    }
  };
  
  return { handleUpdateStatus };
};
