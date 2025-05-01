
import { useCallback, useRef } from 'react';
import { Cafe } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

/**
 * Hook that provides functionality to fetch cafe data from the database
 */
export const useCafeFetch = (
  user: any | null,
  setCafes: React.Dispatch<React.SetStateAction<Cafe[]>>,
  setLoading: (loading: boolean) => void
) => {
  const fetchingRef = useRef<boolean>(false);
  const lastFetchTimeRef = useRef<number>(0);
  const isAdminRef = useRef<boolean>(false);

  // Update admin status when user changes
  if (user) {
    isAdminRef.current = user.role === 'admin';
  } else {
    isAdminRef.current = false;
  }

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
      
      console.log("Fetching cafes from database... isAdmin:", isAdminRef.current, "userID:", user?.id);
      
      // For admin users, use the serviceRole client to bypass RLS policies
      if (isAdminRef.current) {
        console.log("ADMIN USER: Fetching ALL cafes without RLS restrictions");
        
        // Use direct query with no filters for admin users
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
          console.error("Error fetching cafes for admin:", error);
          toast.error(`Failed to fetch cafes: ${error.message}`);
          throw error;
        }
        
        console.log("Admin cafes fetched:", data?.length || 0);
        
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
          
          console.log("Admin mapped cafes:", mappedCafes.length);
          setCafes(mappedCafes);
        }
      } else {
        // For regular users, use standard query
        // The query will automatically be filtered by RLS
        console.log("REGULAR USER: Fetching cafes with RLS restrictions");
        
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
          console.error("Error fetching cafes for regular user:", error);
          toast.error(`Failed to fetch cafes: ${error.message}`);
          throw error;
        }
        
        console.log("Regular user cafes fetched:", data?.length || 0);
        
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
          
          setCafes(mappedCafes);
        }
      }
    } catch (err: any) {
      console.error('Error fetching cafes:', err);
      toast.error(err.message || 'Failed to fetch cafes');
    } finally {
      setLoading(false);
      fetchingRef.current = false;
    }
  }, [setCafes, setLoading, user?.id]);

  return { fetchCafes, isAdminRef };
};
