
import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Cafe } from '@/types';

export function useCafeFetch() {
  const [cafes, setCafes] = useState<Cafe[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);
  const isMountedRef = useRef(true);
  const fetchInProgressRef = useRef(false);
  const lastFetchTimeRef = useRef<number>(0);

  const refresh = useCallback(() => {
    const now = Date.now();
    // Prevent too frequent refreshes (minimum 1 second between calls)
    if (now - lastFetchTimeRef.current < 1000) {
      console.log("Refresh called too soon, skipping");
      return;
    }
    
    console.log("Refresh called - triggering fetch");
    lastFetchTimeRef.current = now;
    setRefreshTrigger(prev => prev + 1);
  }, []);

  // Main fetch function with proper guards
  const fetchCafes = useCallback(async () => {
    if (fetchInProgressRef.current) {
      console.log("Fetch already in progress, skipping");
      return;
    }

    if (!isMountedRef.current) {
      console.log("Component unmounted, skipping fetch");
      return;
    }

    try {
      console.log("Starting cafe fetch from database");
      fetchInProgressRef.current = true;
      setError(null);
      
      // Only set loading if we don't have data yet
      if (cafes.length === 0) {
        setLoading(true);
      }

      // Direct database query
      const { data, error } = await supabase
        .from('cafes')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error("Database error:", error);
        throw new Error(error.message);
      }
      
      console.log(`Retrieved ${data?.length || 0} cafes from database`);
      
      if (isMountedRef.current) {
        if (data && data.length > 0) {
          // Format cafes data
          const formattedCafes: Cafe[] = data.map((cafe: any) => ({
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
          
          console.log(`Successfully formatted ${formattedCafes.length} cafes`);
          setCafes(formattedCafes);
          
          // Dispatch single event to avoid cascading updates
          setTimeout(() => {
            window.dispatchEvent(new CustomEvent('cafe_data_ready', {
              detail: { cafes: formattedCafes }
            }));
          }, 100);
          
        } else {
          console.log("No cafes found in database");
          setCafes([]);
        }
      }
    } catch (err: any) {
      console.error("Failed to fetch cafes:", err);
      if (isMountedRef.current) {
        setError(`Failed to fetch cafes: ${err.message || 'Unknown error'}`);
        setCafes([]);
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
        fetchInProgressRef.current = false;
      }
    }
  }, [cafes.length]);

  // Effect to fetch cafes when refresh is triggered - with proper cleanup
  useEffect(() => {
    if (refreshTrigger > 0) {
      console.log("useEffect triggered for cafe fetch, trigger:", refreshTrigger);
      fetchCafes();
    }
  }, [fetchCafes, refreshTrigger]);

  // Initial fetch on mount
  useEffect(() => {
    console.log("Initial cafe fetch on mount");
    setRefreshTrigger(1);
  }, []);

  // Clean up effect
  useEffect(() => {
    return () => {
      console.log("useCafeFetch cleanup");
      isMountedRef.current = false;
    };
  }, []);

  return { cafes, loading, error, refresh };
}
