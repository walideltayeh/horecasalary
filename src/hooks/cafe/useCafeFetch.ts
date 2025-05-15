
import { useCallback, useRef } from 'react';
import { Cafe } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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
  const dataFreshUntilRef = useRef<number>(0);
  const fetchAttemptCount = useRef<number>(0);
  const abortControllerRef = useRef<AbortController | null>(null);
  const cafeCache = useRef<{data: Cafe[] | null, timestamp: number}>({
    data: null,
    timestamp: 0
  });

  // Update admin status when user changes
  if (user) {
    isAdminRef.current = user.role === 'admin';
  } else {
    isAdminRef.current = false;
  }

  const fetchCafes = useCallback(async (force = false) => {
    // Cache data for 15 seconds unless force=true
    const now = Date.now();
    const CACHE_TIME = 15000; // 15 seconds
    
    if (!force && now < dataFreshUntilRef.current && cafeCache.current.data) {
      console.log("Using cached cafe data - refresh not needed");
      return;
    }
    
    // Debounce frequent fetch requests (within 3 seconds)
    if (!force && now - lastFetchTimeRef.current < 3000) {
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
        
      const { data, error } = await query;
        
      if (error) {
        console.error("Error fetching cafes:", error);
        toast.error(`Failed to fetch cafes: ${error.message}`);
        throw error;
      }
      
      console.log("Cafes fetched:", data?.length || 0);
      
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
        
        // Update cache with fresh data
        cafeCache.current = {
          data: mappedCafes,
          timestamp: now
        };
        
        setCafes(mappedCafes);
        
        // Set the time until which data is considered fresh
        dataFreshUntilRef.current = now + CACHE_TIME;
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
      setLoading(false);
      fetchingRef.current = false;
      abortControllerRef.current = null;
    }
  }, [setCafes, setLoading, user?.id]);

  return { fetchCafes, isAdminRef };
};
