
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

  const fetchCafes = useCallback(async () => {
    if (!user) {
      setCafes([]);
      setLoading(false);
      return;
    }
    
    setLoading(true);
    
    try {
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
      
      console.log("Cafes fetched:", data?.length || 0);
      
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
    }
  }, [user, setCafes, setLoading]);

  useEffect(() => {
    console.log("Setting up cafe subscriptions for user:", user?.id);
    
    // Clean up existing channels first
    if (channelsRef.current.length > 0) {
      channelsRef.current.forEach(channel => {
        supabase.removeChannel(channel);
      });
      channelsRef.current = [];
    }
    
    // Always fetch cafes on mount, user change, or after subscription setup
    fetchCafes();

    if (!user) return;

    const setupChannel = async () => {
      try {
        // Enable realtime for the cafes table
        const { error: enableError } = await supabase.functions.invoke('enable-realtime', {
          body: { table_name: 'cafes' }
        });
        
        if (enableError) {
          console.error("Error enabling realtime:", enableError);
          toast.error(`Failed to enable realtime: ${enableError.message}`);
        } else {
          console.log("Realtime enabled successfully for cafes table");
        }
        
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
              fetchCafes();
            }
          )
          .subscribe((status) => {
            console.log(`Cafe channel subscribed with status: ${status}`);
          });
          
        channelsRef.current.push(channel);
        
        console.log("Realtime subscription activated for cafes");
      } catch (err) {
        console.error("Error setting up realtime subscriptions:", err);
        toast.error('Failed to set up realtime updates');
        
        // Even if realtime setup fails, still do a manual fetch
        fetchCafes();
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
  }, [user, fetchCafes]);

  return { fetchCafes };
};
