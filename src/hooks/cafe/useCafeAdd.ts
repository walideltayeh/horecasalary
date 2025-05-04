
import { useState } from 'react';
import { Cafe } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useCafeAdd = () => {
  const addCafe = async (cafeData: Omit<Cafe, 'id' | 'createdAt'>): Promise<string | null> => {
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
          created_by: cafeData.createdBy,
          latitude: cafeData.latitude,
          longitude: cafeData.longitude
        })
        .select('id')
        .single();

      if (error) {
        console.error("Error adding cafe:", error);
        toast.error(`Failed to add cafe: ${error.message}`);
        throw error;
      }
      
      console.log("Cafe added successfully:", data);
      toast.success(`Cafe "${cafeData.name}" added successfully`);
      
      // Dispatch more explicit events for cafe addition
      // First a specific cafe_added event with complete details
      window.dispatchEvent(new CustomEvent('cafe_added', { 
        detail: { 
          cafeId: data.id,
          name: cafeData.name,
          timestamp: Date.now(),
          forceRefresh: true
        }
      }));
      
      // Also dispatch an explicit force refresh event
      window.dispatchEvent(new CustomEvent('cafe_data_force_refresh', {
        detail: { timestamp: Date.now() }
      }));
      
      // Then the general data update event with explicit high priority flags
      window.dispatchEvent(new CustomEvent('horeca_data_updated', { 
        detail: { 
          action: 'cafeAdded',
          cafeId: data.id, 
          forceRefresh: true,
          highPriority: true,
          timestamp: Date.now()
        }
      }));
      
      // Also explicitly dispatch stats updated event
      window.dispatchEvent(new CustomEvent('cafe_stats_updated', {
        detail: { 
          cafeId: data.id,
          timestamp: Date.now()
        }
      }));
      
      return data.id;
    } catch (err: any) {
      console.error('Error adding cafe:', err);
      toast.error(err.message || 'Failed to add cafe');
      return null;
    }
  };

  return { addCafe };
};
