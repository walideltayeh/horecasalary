
import { useState } from 'react';
import { Cafe } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useCafeOperations = () => {
  const [loading, setLoading] = useState(true);

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

  return {
    loading,
    setLoading,
    addCafe,
    updateCafeStatus,
    deleteCafe
  };
};
