
import React, { createContext, useContext, useState, useEffect } from 'react';
import { Cafe } from '@/types';
import { useAuth } from './AuthContext';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { getCafeSize } from '@/utils/cafeUtils';

interface CafeContextType {
  cafes: Cafe[];
  addCafe: (cafe: Omit<Cafe, 'id' | 'createdAt'>) => void;
  updateCafeStatus: (cafeId: string, status: 'Pending' | 'Visited' | 'Contracted') => void;
  getCafeSize: (numberOfHookahs: number) => CafeSize;
  deleteCafe: (cafeId: string) => void;
}

const CafeContext = createContext<CafeContextType | undefined>(undefined);

export const CafeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [cafes, setCafes] = useState<Cafe[]>([]);

  useEffect(() => {
    const fetchCafes = async () => {
      if (!user) return;
      
      try {
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
            createdBy: cafe.created_by
          })));
        }
      } catch (err: any) {
        console.error('Error fetching cafes:', err);
        toast.error(err.message || 'Failed to fetch cafes');
      }
    };

    fetchCafes();
  }, [user]);

  const addCafe = (cafeData: Omit<Cafe, 'id' | 'createdAt'>) => {
    if (!user) return;

    const newCafe: Cafe = {
      ...cafeData,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    };

    setCafes(prev => [...prev, newCafe]);
    toast.success(`Cafe "${cafeData.name}" added successfully`);
  };

  const updateCafeStatus = (cafeId: string, status: 'Pending' | 'Visited' | 'Contracted') => {
    setCafes(prev => 
      prev.map(cafe => {
        if (cafe.id === cafeId) {
          return { ...cafe, status };
        }
        return cafe;
      })
    );
  };

  const deleteCafe = (cafeId: string) => {
    setCafes(prev => prev.filter(cafe => cafe.id !== cafeId));
    toast.success("Cafe deleted successfully");
  };

  return (
    <CafeContext.Provider
      value={{
        cafes,
        addCafe,
        updateCafeStatus,
        getCafeSize,
        deleteCafe
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

