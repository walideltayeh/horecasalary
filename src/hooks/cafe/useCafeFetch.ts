
import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Cafe } from '@/types';
import { useAuth } from '@/contexts/AuthContext';

export function useCafeFetch() {
  const [cafes, setCafes] = useState<Cafe[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const isMountedRef = useRef(true);
  const hasInitialFetchRef = useRef(false);
  const { user, session } = useAuth();

  const fetchCafes = useCallback(async () => {
    // Don't fetch if component unmounted or no authentication
    if (!isMountedRef.current) {
      console.log("useCafeFetch: Component unmounted, skipping fetch");
      return;
    }

    if (!user || !session) {
      console.log("useCafeFetch: No authentication - user:", !!user, "session:", !!session);
      setLoading(false);
      setCafes([]);
      setError(null);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      console.log("useCafeFetch: Starting authenticated fetch for user:", user.id);
      
      // Test database connection first
      const { data: testData, error: testError } = await supabase
        .from('cafes')
        .select('count')
        .limit(1)
        .abortSignal(AbortSignal.timeout(5000));
      
      if (testError) {
        console.error("useCafeFetch: Database connection test failed:", testError);
        throw new Error(`Database connection failed: ${testError.message}`);
      }
      
      console.log("useCafeFetch: Database connection test successful");
      
      // Now fetch actual data
      const { data, error } = await supabase
        .from('cafes')
        .select('*')
        .order('created_at', { ascending: false })
        .abortSignal(AbortSignal.timeout(10000));
      
      if (error) {
        console.error("useCafeFetch: Database query error:", error);
        throw new Error(`Database query failed: ${error.message}`);
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
      
      // Dispatch event on successful fetch
      if (!hasInitialFetchRef.current) {
        hasInitialFetchRef.current = true;
        window.dispatchEvent(new CustomEvent('cafe_data_ready', {
          detail: { cafes: formattedCafes }
        }));
      }
      
    } catch (err: any) {
      console.error("useCafeFetch: Fetch error:", err);
      
      if (!isMountedRef.current) {
        return;
      }
      
      let errorMessage = 'Failed to fetch cafes';
      
      if (err.name === 'AbortError' || err.message?.includes('timeout')) {
        errorMessage = 'Request timed out. Please check your connection and try again.';
      } else if (err.message?.includes('Database connection failed')) {
        errorMessage = 'Database connection failed. Please try again later.';
      } else if (err.message?.includes('Database query failed')) {
        errorMessage = `Database error: ${err.message}`;
      } else {
        errorMessage = `Error: ${err.message || 'Unknown error occurred'}`;
      }
      
      setError(errorMessage);
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [user, session]);

  const refresh = useCallback(() => {
    if (user && session) {
      console.log("useCafeFetch: Manual refresh triggered");
      fetchCafes();
    } else {
      console.log("useCafeFetch: Refresh skipped - no authentication");
    }
  }, [fetchCafes, user, session]);

  // Only fetch when user and session are available
  useEffect(() => {
    if (user && session) {
      console.log("useCafeFetch: Authentication detected, starting fetch");
      fetchCafes();
    } else {
      console.log("useCafeFetch: No authentication, clearing data");
      setLoading(false);
      setCafes([]);
      setError(null);
      hasInitialFetchRef.current = false;
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
