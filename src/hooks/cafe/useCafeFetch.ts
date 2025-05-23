
import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Cafe, User } from '@/types';
import { fetchWithRetry } from '@/utils/networkUtils';

export function useCafeFetch() {
  const [cafes, setCafes] = useState<Cafe[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);
  const isMountedRef = useRef(true);
  const fetchInProgressRef = useRef(false);
  const lastFetchTimeRef = useRef(0);
  const initialLoadCompleteRef = useRef(false);

  // Define a throttled refresh function
  const refresh = useCallback(() => {
    const now = Date.now();
    // Allow refreshing at most once every 5 seconds
    if (now - lastFetchTimeRef.current > 5000 && !fetchInProgressRef.current) {
      lastFetchTimeRef.current = now;
      setRefreshTrigger(prev => prev + 1);
    } else {
      console.log("Cafe fetch throttled - too recent or fetch already in progress");
    }
  }, []);

  // Main fetch function with retry logic
  const fetchCafes = useCallback(async () => {
    if (fetchInProgressRef.current) {
      console.log("Fetch already in progress, skipping");
      return;
    }

    try {
      console.log("Starting cafe fetch");
      fetchInProgressRef.current = true;
      setError(null);
      
      if (!initialLoadCompleteRef.current) {
        setLoading(true);
      }

      // Maximum retries and delay for exponential backoff
      const maxRetries = 3;
      const baseDelay = 1000; // 1 second
      
      // Use fetchWithRetry utility for better error handling
      const response = await fetchWithRetry(
        async () => {
          const { data, error } = await supabase
            .from('cafes')
            .select('*')
            .order('created_at', { ascending: false });
          
          if (error) throw new Error(error.message);
          return { data, error };
        },
        maxRetries,
        baseDelay
      );
      
      if (response.error) {
        throw new Error(String(response.error));
      }
      
      // Type safety check
      if (Array.isArray(response.data) && response.data.length > 0) {
        // Apply any necessary transformations to the cafe data
        const formattedCafes: Cafe[] = response.data.map((cafe: any) => ({
          id: cafe.id,
          name: cafe.name,
          ownerName: cafe.owner_name,
          ownerNumber: cafe.owner_number,
          numberOfTables: cafe.number_of_tables || 0,
          numberOfHookahs: cafe.number_of_hookahs || 0,
          city: cafe.city,
          governorate: cafe.governorate,
          latitude: cafe.latitude,
          longitude: cafe.longitude,
          createdAt: cafe.created_at,
          createdBy: cafe.created_by,
          status: cafe.status,
          photoUrl: cafe.photo_url
        }));
        
        if (isMountedRef.current) {
          setCafes(formattedCafes);
          console.log(`Fetched ${formattedCafes.length} cafes`);
        }
      } else {
        // If no cafes, set empty array
        if (isMountedRef.current) {
          setCafes([]);
          console.log("No cafes found");
        }
      }
    } catch (err: any) {
      console.error("Failed to fetch cafes:", err);
      if (isMountedRef.current) {
        setError(`Failed to fetch cafes: ${err.message || 'Unknown error'}`);
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
        initialLoadCompleteRef.current = true;
        // Add small delay before clearing the in-progress flag
        setTimeout(() => {
          fetchInProgressRef.current = false;
        }, 1000);
      }
    }
  }, []);

  // Effect to fetch cafes when refresh is triggered
  useEffect(() => {
    fetchCafes();
  }, [fetchCafes, refreshTrigger]);

  // Clean up effect
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  return { cafes, loading, error, refresh };
}
