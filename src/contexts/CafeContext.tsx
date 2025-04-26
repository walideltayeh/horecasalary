import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Cafe, CafeSize } from '@/types';
import { useAuth } from './AuthContext';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { getCafeSize } from '@/utils/cafeUtils';

interface CafeContextType {
  cafes: Cafe[];
  addCafe: (cafe: Omit<Cafe, 'id' | 'createdAt'>) => Promise<string | null>;
  updateCafeStatus: (cafeId: string, status: 'Pending' | 'Visited' | 'Contracted') => Promise<boolean>;
  getCafeSize: (numberOfHookahs: number) => CafeSize;
  deleteCafe: (cafeId: string) => Promise<boolean>;
  loading: boolean;
}

const CafeContext = createContext<CafeContextType | undefined>(undefined);

export const CafeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [cafes, setCafes] = useState<Cafe[]>([]);
  const [loading, setLoading] = useState(true);

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
  }, [user]);

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

  const addCafe = async (cafeData: Omit<Cafe, 'id' | 'createdAt'>): Promise<string | null> => {
    if (!user) return null;

    try {
      console.log("Adding cafe to database:", cafeData);
      
      const { data, error } = await supabase
        .from('cafes')
        .insert({
          name: cafeData.name,
          owner_name: cafeData.ownerName,
          owner_number: cafeData.ownerNumber,
          number_of_hookahs: cafeData.numberOfHookahs,
          number_of_tables: cafeData.numberOfTables,
          status: cafeData.status,
          photo_url: cafeData.photoUrl,
          governorate: cafeData.governorate,
          city: cafeData.city,
          created_by: user.id,
          latitude: cafeData.latitude,
          longitude: cafeData.longitude
        })
        .select('id')
        .single();

      if (error) throw error;
      
      toast.success(`Cafe "${cafeData.name}" added successfully`);
      return data.id;
    } catch (err: any) {
      console.error('Error adding cafe:', err);
      toast.error(err.message || 'Failed to add cafe');
      return null;
    }
  };

  const updateCafeStatus = async (cafeId: string, status: 'Pending' | 'Visited' | 'Contracted'): Promise<boolean> => {
    try {
      console.log(`Updating cafe ${cafeId} status to ${status}`);
      
      const { error } = await supabase
        .from('cafes')
        .update({ status })
        .eq('id', cafeId);

      if (error) throw error;
      
      toast.success(`Cafe status updated to ${status}`);
      return true;
    } catch (err: any) {
      console.error('Error updating cafe status:', err);
      toast.error(err.message || 'Failed to update cafe status');
      return false;
    }
  };

  const deleteCafe = async (cafeId: string): Promise<boolean> => {
    try {
      console.log(`Deleting cafe ${cafeId}`);
      
      const { error } = await supabase
        .from('cafes')
        .delete()
        .eq('id', cafeId);

      if (error) throw error;
      
      toast.success("Cafe deleted successfully");
      return true;
    } catch (err: any) {
      console.error('Error deleting cafe:', err);
      toast.error(err.message || 'Failed to delete cafe');
      return false;
    }
  };

  return (
    <CafeContext.Provider
      value={{
        cafes,
        addCafe,
        updateCafeStatus,
        getCafeSize,
        deleteCafe,
        loading
      }}
    >
      {children}
    </CafeContext.Provider>
  );
};

export const useCafes = () => {
  const context = useContext(CafeContext);
  if (context === undefined) {
    throw new Error('useCafes must be used within a CafeProvider');
  }
  return context;
};
