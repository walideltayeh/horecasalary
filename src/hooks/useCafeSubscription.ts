
import { useCallback, useEffect } from 'react';
import { Cafe } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useCafeSubscription = (
  user: any | null,
  setCafes: React.Dispatch<React.SetStateAction<Cafe[]>>,
  setLoading: (loading: boolean) => void
) => {
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
        
      if (error) throw error;
      
      if (data) {
        console.log("Cafes fetched:", data);
        setCafes(data.map(cafe => ({
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
        })));
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
    fetchCafes();

    if (!user) return;

    // Set up realtime subscriptions for all relevant tables
    const channels = [
      supabase.channel('cafes-changes')
        .on('postgres_changes', 
          { 
            event: '*', 
            schema: 'public', 
            table: 'cafes',
          }, 
          () => {
            console.log("Cafe change detected, refreshing data...");
            fetchCafes();
          }
        ),

      supabase.channel('surveys-changes')
        .on('postgres_changes', 
          { 
            event: '*', 
            schema: 'public', 
            table: 'cafe_surveys',
          }, 
          () => {
            console.log("Survey change detected, refreshing data...");
            fetchCafes();
          }
        ),

      supabase.channel('sales-changes')
        .on('postgres_changes', 
          { 
            event: '*', 
            schema: 'public', 
            table: 'brand_sales',
          }, 
          () => {
            console.log("Brand sales change detected, refreshing data...");
            fetchCafes();
          }
        )
    ];

    // Subscribe to all channels
    Promise.all(channels.map(channel => channel.subscribe()))
      .then(() => console.log("All realtime subscriptions activated"))
      .catch(err => console.error("Error setting up realtime subscriptions:", err));

    // Cleanup function
    return () => {
      console.log("Cleaning up realtime subscriptions");
      channels.forEach(channel => {
        supabase.removeChannel(channel);
      });
    };
  }, [user, fetchCafes]);

  return { fetchCafes };
};
