
import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Cafe } from '@/types';

export function useCafeFetch() {
  const [cafes, setCafes] = useState<Cafe[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const isMountedRef = useRef(true);
  const hasInitialFetchRef = useRef(false);

  const fetchCafes = useCallback(async () => {
    if (!isMountedRef.current) {
      return;
    }

    try {
      setError(null);
      
      const { data, error } = await supabase
        .from('cafes')
        .select('*')
        .order('created_at', { ascending: false });
      
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
      console.error("Failed to fetch cafes:", err);
      if (isMountedRef.current) {
        setError(`Failed to fetch cafes: ${err.message || 'Unknown error'}`);
        setLoading(false);
      }
    }
  }, []);

  const refresh = useCallback(() => {
    fetchCafes();
  }, [fetchCafes]);

  // Single fetch on mount
  useEffect(() => {
    fetchCafes();
  }, [fetchCafes]);

  // Cleanup
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  return { cafes, loading, error, refresh };
}
