
import { useCallback, useRef } from 'react';
import { Cafe } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { withSupabaseRetry, isNetworkError, isOnline } from '@/utils/networkUtils';

/**
 * Hook that provides functionality to fetch cafe data from the database
 * with optimized networking, caching, and error handling
 */
export const useCafeFetch = (
  user: any | null,
  setCafes: (cafes: Cafe[]) => void,
  setLoading: (loading: boolean) => void
) => {
  const fetchingRef = useRef<boolean>(false);
  const lastFetchTimeRef = useRef<number>(0);
  const isAdminRef = useRef<boolean>(false);
  const fetchAttemptCount = useRef<number>(0);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Update admin status when user changes
  if (user) {
    isAdminRef.current = user.role === 'admin';
  } else {
    isAdminRef.current = false;
  }

  const fetchCafes = useCallback(async (force = false) => {
    // Debug logging to track fetches
    console.log("fetchCafes called with force =", force);
    
    // Check if we're online before attempting to fetch
    if (!isOnline()) {
      console.log("Device is offline, cannot fetch data");
      toast.error("You appear to be offline. Please check your internet connection.");
      return;
    }
    
    // Debounce frequent fetch requests (within 1 second) unless forced
    const now = Date.now();
    if (!force && now - lastFetchTimeRef.current < 1000) {
      console.log("Fetch request debounced - too recent");
      return;
    }
    
    // Cancel any in-flight request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    // Create new abort controller for this request
    abortControllerRef.current = new AbortController();
    
    // Prevent concurrent fetches
    if (fetchingRef.current) {
      console.log("Fetch already in progress, skipping");
      return;
    }
    
    try {
      console.log("Starting fetch operation...");
      fetchingRef.current = true;
      setLoading(true);
      lastFetchTimeRef.current = now;
      fetchAttemptCount.current++;
      
      console.log("Fetching cafes from database... isAdmin:", isAdminRef.current, "userID:", user?.id);
      const query = supabase
        .from('cafes')
        .select(`
          *,
          cafe_surveys (
            id,
            brand_sales (
              brand,
              packs_per_week
            )
          )
        `)
        .order('created_at', { ascending: false });
        
      // Use our new retry mechanism
      const { data, error } = await withSupabaseRetry(
        () => query,
        {
          maxRetries: 5,
          initialDelay: 1000,
          maxDelay: 15000,
          onRetry: (attempt, err) => {
            console.log(`Retrying cafe fetch (attempt ${attempt}) after error:`, err);
            if (attempt === 1) {
              toast.info("Network issue detected. Retrying...", { id: "network-retry" });
            }
          }
        }
      );
        
      if (error) {
        console.error("Error fetching cafes:", error);
        
        if (isNetworkError(error)) {
          toast.error("Network connectivity issue. Please check your internet connection.", { 
            id: "network-error",
            duration: 10000
          });
        } else {
          toast.error(`Failed to fetch cafes: ${error.message}`);
        }
        throw error;
      }
      
      console.log("Cafes fetched successfully:", data?.length || 0);
      
      if (data) {
        const mappedCafes = data.map(cafe => ({
          id: cafe.id,
          name: cafe.name,
          ownerName: cafe.owner_name,
          ownerNumber: cafe.owner_number,
          numberOfHookahs: cafe.number_of_hookahs,
          numberOfTables: cafe.number_of_tables,
          status: cafe.status as 'Pending' | 'Visited' | 'Contracted',
          photoUrl: cafe.photo_url,
          governorate: cafe.governorate,
          city: cafe.city,
          createdAt: cafe.created_at,
          createdBy: cafe.created_by,
          latitude: cafe.latitude,
          longitude: cafe.longitude
        }));
        
        console.log("Mapped cafes:", mappedCafes.length, "isAdmin:", isAdminRef.current);
        
        setCafes(mappedCafes);
      }
    } catch (err: any) {
      // Only handle errors that aren't from aborting the request
      if (err.name !== 'AbortError') {
        console.error('Error fetching cafes:', err);
        
        // Only show toast errors on first few attempts to avoid spamming
        if (fetchAttemptCount.current <= 2) {
          toast.error(err.message || 'Failed to fetch cafes');
        }
      }
    } finally {
      console.log("Fetch operation completed");
      setLoading(false);
      fetchingRef.current = false;
      abortControllerRef.current = null;
    }
  }, [setCafes, setLoading, user?.id]);

  return { fetchCafes, isAdminRef };
};
