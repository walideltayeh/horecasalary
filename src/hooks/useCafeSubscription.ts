
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
        `);
        
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
    fetchCafes();
  }, [fetchCafes]);

  useEffect(() => {
    if (!user) return;

    console.log("Setting up realtime subscription for cafes...");
    
    const cafesChannel = supabase
      .channel('user-cafes-changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'cafes' 
        }, 
        (payload) => {
          console.log("Real-time cafe update received:", payload);
          fetchCafes();
        }
      );
      
    const surveysChannel = supabase
      .channel('user-cafe-surveys-changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'cafe_surveys' 
        }, 
        (payload) => {
          console.log("Real-time cafe survey update received:", payload);
          fetchCafes();
        }
      );
      
    const brandSalesChannel = supabase
      .channel('user-brand-sales-changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'brand_sales' 
        }, 
        (payload) => {
          console.log("Real-time brand sales update received:", payload);
          fetchCafes();
        }
      );

    Promise.all([
      cafesChannel.subscribe(),
      surveysChannel.subscribe(),
      brandSalesChannel.subscribe()
    ])
      .then(() => console.log("All realtime subscriptions activated"))
      .catch(err => console.error("Error setting up realtime subscriptions:", err));

    return () => {
      console.log("Removing realtime subscriptions...");
      supabase.removeChannel(cafesChannel);
      supabase.removeChannel(surveysChannel);
      supabase.removeChannel(brandSalesChannel);
    };
  }, [user, fetchCafes]);

  return { fetchCafes };
};
