
import { useCallback, useEffect, useRef } from 'react';
import { Cafe } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useCafeSubscription = (
  user: any | null,
  setCafes: React.Dispatch<React.SetStateAction<Cafe[]>>,
  setLoading: (loading: boolean) => void
) => {
  const channelsRef = useRef<any[]>([]);
  const fetchingRef = useRef<boolean>(false);
  const lastFetchTimeRef = useRef<number>(0);

  const fetchCafes = useCallback(async (force = false) => {
    // Debounce frequent fetch requests (within 1 second)
    const now = Date.now();
    if (!force && now - lastFetchTimeRef.current < 1000) {
      console.log("Fetch request debounced");
      return;
    }
    
    // Prevent concurrent fetches
    if (fetchingRef.current) {
      console.log("Fetch already in progress, skipping");
      return;
    }
    
    try {
      fetchingRef.current = true;
      setLoading(true);
      lastFetchTimeRef.current = now;
      
      console.log("Fetching cafes from database...");
      const { data, error } = await supabase
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
        
      if (error) {
        console.error("Error fetching cafes:", error);
        toast.error(`Failed to fetch cafes: ${error.message}`);
        throw error;
      }
      
      console.log("Cafes fetched:", data?.length || 0, data);
      
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
        
        console.log("Mapped cafes:", mappedCafes.length);
        setCafes(mappedCafes);
      }
    } catch (err: any) {
      console.error('Error fetching cafes:', err);
      toast.error(err.message || 'Failed to fetch cafes');
    } finally {
      setLoading(false);
      fetchingRef.current = false;
    }
  }, [setCafes, setLoading]);

  // Set up all event listeners for data updates
  useEffect(() => {
    console.log("Setting up cafe data event listeners...");
    
    // Listen for manual refresh requests
    const handleRefreshRequested = () => {
      console.log("Manual refresh requested");
      fetchCafes(true);
    };
    
    // Listen for data update events (within same tab)
    const handleDataUpdated = () => {
      console.log("Data updated event received");
      fetchCafes();
    };
    
    // Listen for storage events (across tabs)
    const handleStorageEvent = (event: StorageEvent) => {
      if (event.key === 'cafe_data_updated') {
        console.log("Storage event: cafe data updated");
        fetchCafes();
      }
    };
    
    // Register all listeners
    window.addEventListener('horeca_data_refresh_requested', handleRefreshRequested);
    window.addEventListener('horeca_data_updated', handleDataUpdated);
    window.addEventListener('storage', handleStorageEvent);
    
    return () => {
      // Clean up all listeners
      window.removeEventListener('horeca_data_refresh_requested', handleRefreshRequested);
      window.removeEventListener('horeca_data_updated', handleDataUpdated);
      window.removeEventListener('storage', handleStorageEvent);
    };
  }, [fetchCafes]);

  useEffect(() => {
    console.log("Setting up cafe subscriptions...");
    
    // Clean up existing channels first
    if (channelsRef.current.length > 0) {
      channelsRef.current.forEach(channel => {
        supabase.removeChannel(channel);
      });
      channelsRef.current = [];
    }
    
    // Always fetch cafes on mount, user change, or after subscription setup
    fetchCafes(true);

    const setupChannel = async () => {
      try {
        // Create a channel for all database changes
        const channel = supabase
          .channel('db-changes')
          .on('postgres_changes', 
            {
              event: '*', 
              schema: 'public', 
              table: 'cafes'
            },
            (payload) => {
              console.log("Cafe change detected:", payload);
              fetchCafes(true);
            }
          )
          .subscribe((status) => {
            console.log(`Cafe channel subscribed with status: ${status}`);
          });
          
        channelsRef.current.push(channel);
        
        // Also listen for changes in the cafe_surveys table
        const surveysChannel = supabase
          .channel('survey-changes')
          .on('postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'cafe_surveys'
            },
            (payload) => {
              console.log("Cafe survey change detected:", payload);
              fetchCafes(true);
            }
          )
          .subscribe((status) => {
            console.log(`Survey channel subscribed with status: ${status}`);
          });
          
        channelsRef.current.push(surveysChannel);
        
        console.log("Realtime subscription activated for cafes and surveys");
      } catch (err) {
        console.error("Error setting up realtime subscriptions:", err);
        toast.error('Failed to set up realtime updates');
        
        // Even if realtime setup fails, still do a manual fetch
        fetchCafes(true);
      }
    };

    setupChannel();

    return () => {
      console.log("Cleaning up realtime subscriptions");
      channelsRef.current.forEach(channel => {
        supabase.removeChannel(channel);
      });
      channelsRef.current = [];
    };
  }, [fetchCafes]);

  return { fetchCafes };
};
