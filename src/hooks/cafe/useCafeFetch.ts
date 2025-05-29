
import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Cafe } from '@/types';
import { useAuth } from '@/contexts/AuthContext';

export function useCafeFetch() {
  const [cafes, setCafes] = useState<Cafe[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const isMountedRef = useRef(true);
  const { user, session } = useAuth();

  const fetchCafes = useCallback(async () => {
    // Don't fetch if component unmounted
    if (!isMountedRef.current) {
      console.log("useCafeFetch: Component unmounted, skipping fetch");
      return;
    }

    // Don't fetch if no authentication - but don't treat this as an error
    if (!user || !session) {
      console.log("useCafeFetch: No authentication - clearing data");
      setLoading(false);
      setCafes([]);
      setError(null);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      console.log("useCafeFetch: Starting simplified fetch for user:", user.id);
      
      // Simplified query with timeout handling
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      const { data, error } = await supabase
        .from('cafes')
        .select(`
          id,
          name,
          owner_name,
          owner_number,
          number_of_tables,
          number_of_hookahs,
          city,
          governorate,
          latitude,
          longitude,
          created_at,
          created_by,
          status,
          photo_url
        `)
        .order('created_at', { ascending: false })
        .limit(100); // Limit results to prevent timeout
      
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
      
      // Handle timeout specifically
      if (err.name === 'AbortError') {
        setError('Request timed out. Please try again.');
      } else {
        setError(err.message || 'Failed to fetch cafes');
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [user, session]);

  const refresh = useCallback(() => {
    console.log("useCafeFetch: Refresh triggered");
    fetchCafes();
  }, [fetchCafes]);

  // Fetch when authentication is available
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
  }, [fetchCafes, user, session]);

  // Cleanup
  useEffect(() => {
    return () => {
      console.log("useCafeFetch: Component unmounting");
      isMountedRef.current = false;
    };
  }, []);

  return { cafes, loading, error, refresh };
}
