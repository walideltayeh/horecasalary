
import { useState } from 'react';
import { Cafe } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useCafeUpdate = () => {
  const updateCafeStatus = async (cafeId: string, status: 'Pending' | 'Visited' | 'Contracted'): Promise<boolean> => {
    try {
      console.log(`Updating cafe ${cafeId} status to ${status}`);
      
      const { error } = await supabase
        .from('cafes')
        .update({ status })
        .eq('id', cafeId);

      if (error) {
        console.error("Error updating cafe status:", error);
        toast.error(`Failed to update cafe status: ${error.message}`);
        throw error;
      }
      
      console.log("Cafe status updated successfully");
      toast.success(`Cafe status updated to ${status}`);
      
      // Broadcast the update event
      window.dispatchEvent(new CustomEvent('horeca_data_updated'));
      
      return true;
    } catch (err: any) {
      console.error('Error updating cafe status:', err);
      toast.error(err.message || 'Failed to update cafe status');
      return false;
    }
  };

  const updateCafe = async (cafeId: string, cafeData: Partial<Cafe>): Promise<boolean> => {
    try {
      console.log(`Updating cafe ${cafeId}:`, cafeData);
      
      // Prepare update object - convert from camelCase to snake_case for Supabase
      const updateData: Record<string, any> = {};
      if (cafeData.name) updateData.name = cafeData.name;
      if (cafeData.ownerName) updateData.owner_name = cafeData.ownerName;
      if (cafeData.ownerNumber) updateData.owner_number = cafeData.ownerNumber;
      if (cafeData.numberOfHookahs !== undefined) updateData.number_of_hookahs = cafeData.numberOfHookahs;
      if (cafeData.numberOfTables !== undefined) updateData.number_of_tables = cafeData.numberOfTables;
      if (cafeData.status) updateData.status = cafeData.status;
      if (cafeData.photoUrl) updateData.photo_url = cafeData.photoUrl;
      if (cafeData.governorate) updateData.governorate = cafeData.governorate;
      if (cafeData.city) updateData.city = cafeData.city;
      
      console.log("Sending to Supabase:", updateData);
      
      const { error } = await supabase
        .from('cafes')
        .update(updateData)
        .eq('id', cafeId);

      if (error) {
        console.error("Error updating cafe:", error);
        toast.error(`Failed to update cafe: ${error.message}`);
        throw error;
      }
      
      console.log("Cafe updated successfully");
      toast.success(`Cafe updated successfully`);
      
      // Broadcast the update event
      window.dispatchEvent(new CustomEvent('horeca_data_updated'));
      
      return true;
    } catch (err: any) {
      console.error('Error updating cafe:', err);
      toast.error(err.message || 'Failed to update cafe');
      return false;
    }
  };

  return { updateCafeStatus, updateCafe };
};
