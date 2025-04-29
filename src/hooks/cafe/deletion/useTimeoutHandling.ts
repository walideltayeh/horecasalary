
import { toast } from 'sonner';

/**
 * Manages timeout handling for long-running deletion operations
 */
export const useTimeoutHandling = () => {
  const setupTimeout = (cafeId: string, onCancelled: () => void) => {
    // Set up timeout for slow operations notice
    const slowOperationTimeoutId = setTimeout(() => {
      toast.info("Deletion is taking longer than expected, but still processing...", {
        id: `delete-slow-${cafeId}`,
        duration: 5000
      });
    }, 2500);
    
    return {
      clearTimeout: () => {
        clearTimeout(slowOperationTimeoutId);
      }
    };
  };
  
  return { setupTimeout };
};
