
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

  // URGENT FIX: Remove throttling completely to allow immediate database queries
  const refresh = useCallback(() => {
    console.log("URGENT FIX: Refresh called - triggering immediate fetch");
    setRefreshTrigger(prev => prev + 1);
  }, []);

  // Main fetch function with simplified, reliable logic
  const fetchCafes = useCallback(async () => {
    if (fetchInProgressRef.current) {
      console.log("Fetch already in progress, skipping");
      return;
    }

    try {
      console.log("URGENT FIX: Starting immediate cafe fetch from database");
      fetchInProgressRef.current = true;
      setError(null);
      setLoading(true);

      // Direct database query without retries or throttling
      const { data, error } = await supabase
        .from('cafes')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error("Database error:", error);
        throw new Error(error.message);
      }
      
      console.log(`URGENT FIX: Retrieved ${data?.length || 0} cafes from database:`, data);
      
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
          
          console.log(`URGENT FIX: Successfully formatted ${formattedCafes.length} cafes`);
          setCafes(formattedCafes);
          
          // Immediately dispatch events for dashboard updates
          window.dispatchEvent(new CustomEvent('cafe_stats_updated', {
            detail: { cafes: formattedCafes, forceRefresh: true }
          }));
          window.dispatchEvent(new CustomEvent('horeca_data_updated', {
            detail: { action: 'cafesRefreshed', cafes: formattedCafes }
          }));
        } else {
          console.log("URGENT FIX: No cafes found in database");
          setCafes([]);
        }
      }
    } catch (err: any) {
      console.error("URGENT FIX: Failed to fetch cafes:", err);
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
  }, []);

  // Effect to fetch cafes when refresh is triggered - immediate execution
  useEffect(() => {
    console.log("URGENT FIX: useEffect triggered for cafe fetch");
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
