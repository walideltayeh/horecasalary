
import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Cafe } from '@/types';
import { useAuth } from '@/contexts/AuthContext';

export function useCafeFetch() {
  const [cafes, setCafes] = useState<Cafe[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const isMountedRef = useRef(true);
  const hasInitialFetchRef = useRef(false);
  const { user, session } = useAuth();

  const fetchCafes = useCallback(async () => {
    if (!isMountedRef.current || !user || !session) {
      console.log("useCafeFetch: Skipping fetch - no user or session");
      setLoading(false);
      return;
    }

    try {
      setError(null);
      console.log("useCafeFetch: Starting fetch for user:", user.id);
      
      const { data, error } = await supabase
        .from('cafes')
        .select('*')
        .order('created_at', { ascending: false })
        .abortSignal(AbortSignal.timeout(10000)); // 10 second timeout
      
      if (error) {
        throw new Error(error.message);
      }
      
      if (isMountedRef.current) {
        const formattedCafes: Cafe[] = (data || []).map((cafe: any) => ({
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
        
        console.log("useCafeFetch: Successfully fetched", formattedCafes.length, "cafes");
        setCafes(formattedCafes);
        setLoading(false);
        
        // Only dispatch event once after successful fetch
        if (!hasInitialFetchRef.current) {
          hasInitialFetchRef.current = true;
          window.dispatchEvent(new CustomEvent('cafe_data_ready', {
            detail: { cafes: formattedCafes }
          }));
        }
      }
    } catch (err: any) {
      console.error("useCafeFetch: Failed to fetch cafes:", err);
      if (isMountedRef.current) {
        if (err.name === 'AbortError' || err.message?.includes('timeout')) {
          setError('Request timed out. Please check your connection and try again.');
        } else {
          setError(`Failed to fetch cafes: ${err.message || 'Unknown error'}`);
        }
        setLoading(false);
      }
    }
  }, [user, session]);

  const refresh = useCallback(() => {
    if (user && session) {
      fetchCafes();
    }
  }, [fetchCafes, user, session]);

  // Only fetch when user and session are available
  useEffect(() => {
    if (user && session) {
      fetchCafes();
    } else {
      setLoading(false);
      setCafes([]);
    }
  }, [fetchCafes, user, session]);

  // Cleanup
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  return { cafes, loading, error, refresh };
}
