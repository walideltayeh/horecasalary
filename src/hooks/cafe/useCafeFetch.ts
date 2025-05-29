
import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Cafe } from '@/types';
import { useAuth } from '@/contexts/AuthContext';

export function useCafeFetch() {
  const [cafes, setCafes] = useState<Cafe[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const isMountedRef = useRef(true);
  const fetchInProgressRef = useRef(false);
  const { user, session } = useAuth();

  const fetchCafes = useCallback(async () => {
    // Prevent multiple simultaneous fetches
    if (!isMountedRef.current || fetchInProgressRef.current) {
      console.log("useCafeFetch: Fetch prevented - unmounted or in progress");
      return;
    }

    // Clear state if no authentication
    if (!user || !session) {
      console.log("useCafeFetch: No authentication - clearing data");
      setLoading(false);
      setCafes([]);
      setError(null);
      return;
    }

    try {
      fetchInProgressRef.current = true;
      setLoading(true);
      setError(null);
      console.log("useCafeFetch: Starting fetch for user:", user.id);
      
      // Simple query with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      const { data, error } = await supabase
        .from('cafes')
        .select('*')
        .order('created_at', { ascending: false })
        .abortSignal(controller.signal);
      
      clearTimeout(timeoutId);
      
      if (error) {
        console.error("useCafeFetch: Database query error:", error);
        throw new Error(`Failed to fetch cafes: ${error.message}`);
      }
      
      if (!isMountedRef.current) {
        console.log("useCafeFetch: Component unmounted during fetch");
        return;
      }
      
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
      
    } catch (err: any) {
      console.error("useCafeFetch: Fetch error:", err);
      
      if (!isMountedRef.current) {
        return;
      }
      
      // Don't set error for aborted requests
      if (err.name !== 'AbortError') {
        setError(err.message || 'Failed to fetch cafes');
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
      fetchInProgressRef.current = false;
    }
  }, [user?.id, session?.access_token]); // Stable dependencies

  const refresh = useCallback(() => {
    console.log("useCafeFetch: Refresh triggered");
    fetchCafes();
  }, [fetchCafes]);

  // Single effect for initial fetch
  useEffect(() => {
    if (user && session) {
      console.log("useCafeFetch: Authentication available, fetching data");
      fetchCafes();
    } else {
      console.log("useCafeFetch: No authentication, clearing data");
      setLoading(false);
      setCafes([]);
      setError(null);
    }
  }, [user?.id, session?.access_token]); // Only depend on stable auth identifiers

  // Cleanup
  useEffect(() => {
    return () => {
      console.log("useCafeFetch: Component unmounting");
      isMountedRef.current = false;
      fetchInProgressRef.current = false;
    };
  }, []);

  return { cafes, loading, error, refresh };
}
