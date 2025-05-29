
import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Cafe } from '@/types';
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

  // Define a more aggressive refresh function - reduce throttling for urgent fix
  const refresh = useCallback(() => {
    const now = Date.now();
    // Reduce throttling from 5 seconds to 2 seconds for urgent fix
    if (now - lastFetchTimeRef.current > 2000 && !fetchInProgressRef.current) {
      lastFetchTimeRef.current = now;
      setRefreshTrigger(prev => prev + 1);
    } else {
      console.log("Cafe fetch throttled - too recent or fetch already in progress");
    }
  }, []);

  // Main fetch function with improved retry logic
  const fetchCafes = useCallback(async () => {
    if (fetchInProgressRef.current) {
      console.log("Fetch already in progress, skipping");
      return;
    }

    try {
      console.log("Starting cafe fetch - URGENT FIX");
      fetchInProgressRef.current = true;
      setError(null);
      
      if (!initialLoadCompleteRef.current) {
        setLoading(true);
      }

      // Increase retries for urgent fix
      const maxRetries = 5;
      const baseDelay = 500; // Reduce delay for urgency
      
      // Use fetchWithRetry utility for better error handling
      const response = await fetchWithRetry(
        async () => {
          console.log("Fetching cafes from database...");
          const { data, error } = await supabase
            .from('cafes')
            .select('*')
            .order('created_at', { ascending: false });
          
          if (error) {
            console.error("Database error:", error);
            throw new Error(error.message);
          }
          return { data, error };
        },
        maxRetries,
        baseDelay
      );
      
      if (response.error) {
        throw new Error(String(response.error));
      }
      
      // Handle data formatting more robustly
      if (response.data) {
        console.log(`Raw data from database:`, response.data);
        
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
          console.log(`Successfully formatted ${formattedCafes.length} cafes:`, formattedCafes);
          setCafes(formattedCafes);
          
          // Force update events for dashboard refresh
          window.dispatchEvent(new CustomEvent('cafe_stats_updated', {
            detail: { cafes: formattedCafes, forceRefresh: true }
          }));
          window.dispatchEvent(new CustomEvent('horeca_data_updated', {
            detail: { action: 'cafesRefreshed', cafes: formattedCafes }
          }));
        }
      } else {
        // If no cafes, set empty array and still trigger events
        if (isMountedRef.current) {
          console.log("No cafes found in database");
          setCafes([]);
          
          // Still dispatch events for empty state
          window.dispatchEvent(new CustomEvent('cafe_stats_updated', {
            detail: { cafes: [], forceRefresh: true }
          }));
        }
      }
    } catch (err: any) {
      console.error("Failed to fetch cafes:", err);
      if (isMountedRef.current) {
        setError(`Failed to fetch cafes: ${err.message || 'Unknown error'}`);
        // Set empty array on error but still trigger refresh events
        setCafes([]);
        window.dispatchEvent(new CustomEvent('cafe_stats_updated', {
          detail: { cafes: [], error: err.message }
        }));
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
        initialLoadCompleteRef.current = true;
        // Reduce delay before clearing progress flag for urgency
        setTimeout(() => {
          fetchInProgressRef.current = false;
        }, 500);
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
