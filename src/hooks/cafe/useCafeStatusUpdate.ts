
import { useRef } from 'react';
import { Cafe } from '@/types';
import { useData } from '@/contexts/DataContext';
import { toast } from 'sonner';
import { canUpdateCafeStatus } from '@/utils/cafeUtils';

export const useCafeStatusUpdate = (
  setLocalCafes: React.Dispatch<React.SetStateAction<Cafe[]>>,
  cafes: Cafe[]
) => {
  const { updateCafeStatus } = useData();
  const mounted = useRef(true);
  
  const handleUpdateStatus = async (cafeId: string, newStatus: 'Pending' | 'Visited' | 'Contracted') => {
    console.log(`Updating cafe status: ${cafeId} to ${newStatus}`);
    
    // Find the cafe to check validation
    const cafe = cafes.find(c => c.id === cafeId);
    
    if (!cafe) {
      toast.error("Cafe not found");
      return;
    }
    
    // Validate status update
    if (!canUpdateCafeStatus(cafe, newStatus)) {
      toast.error(`Cannot mark a cafe in negotiation (0 hookahs) as Contracted`);
      return;
    }
    
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
        
        // Broadcast a data update event to trigger refresh across components with specific action
        window.dispatchEvent(new CustomEvent('horeca_data_updated', {
          detail: { 
            action: 'statusUpdate', 
            cafeId, 
            newStatus,
            timestamp: Date.now()
          }
        }));
      }
    } catch (error) {
      if (mounted.current) {
        setLocalCafes(cafes);
        toast.error(`Error updating status`);
      }
    }
  };
  
  return { handleUpdateStatus };
};
