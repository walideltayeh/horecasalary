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

      if (error) {
        console.error("Error adding cafe:", error);
        toast.error(`Failed to add cafe: ${error.message}`);
        throw error;
      }
      
      console.log("Cafe added successfully:", data);
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

      if (error) {
        console.error("Error updating cafe status:", error);
        toast.error(`Failed to update cafe status: ${error.message}`);
        throw error;
      }
      
      console.log("Cafe status updated successfully");
      toast.success(`Cafe status updated to ${status}`);
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
      return true;
    } catch (err: any) {
      console.error('Error updating cafe:', err);
      toast.error(err.message || 'Failed to update cafe');
      return false;
    }
  };

  // Enhanced deletion function with better debugging and error handling
  const deleteCafe = async (cafeId: string): Promise<boolean> => {
    try {
      console.log(`DELETION DEBUG: Starting process for cafe ID: ${cafeId}`);
      
      // Step 1: Verify cafe exists before attempting deletion
      const { data: existingCafe, error: fetchError } = await supabase
        .from('cafes')
        .select('name')
        .eq('id', cafeId)
        .single();
      
      if (fetchError) {
        console.error("DELETION DEBUG: Error fetching cafe before deletion:", fetchError);
        toast.error(`Error checking cafe: ${fetchError.message}`);
        return false;
      }
      
      if (!existingCafe) {
        console.error("DELETION DEBUG: Cafe doesn't exist");
        toast.error("Cafe not found - it may have been already deleted");
        return false;
      }
      
      console.log(`DELETION DEBUG: Confirmed cafe exists: ${existingCafe.name}`);
      
      // Step 2: Check if there are any related records in cafe_surveys
      const { data: relatedSurveys } = await supabase
        .from('cafe_surveys')
        .select('id')
        .eq('cafe_id', cafeId);
        
      console.log(`DELETION DEBUG: Found ${relatedSurveys?.length || 0} related surveys`);
      
      // Step 3: If there are related surveys, delete them first
      if (relatedSurveys && relatedSurveys.length > 0) {
        console.log(`DELETION DEBUG: Deleting ${relatedSurveys.length} related surveys`);
        
        // Get all survey IDs
        const surveyIds = relatedSurveys.map(survey => survey.id);
        
        // Delete related brand_sales records first
        const { error: brandSalesError } = await supabase
          .from('brand_sales')
          .delete()
          .in('survey_id', surveyIds);
          
        if (brandSalesError) {
          console.error("DELETION DEBUG: Error deleting brand_sales:", brandSalesError);
          // Continue anyway, as we'll try to delete the cafe
        } else {
          console.log("DELETION DEBUG: Successfully deleted related brand_sales");
        }
        
        // Delete surveys
        const { error: surveysError } = await supabase
          .from('cafe_surveys')
          .delete()
          .eq('cafe_id', cafeId);
          
        if (surveysError) {
          console.error("DELETION DEBUG: Error deleting surveys:", surveysError);
          // Continue anyway, as we'll try to delete the cafe
        } else {
          console.log("DELETION DEBUG: Successfully deleted related surveys");
        }
      }
      
      // Step 4: Attempt deletion with explicit return of deleted data
      console.log("DELETION DEBUG: Proceeding with cafe deletion");
      const { data: deletedData, error: deleteError } = await supabase
        .from('cafes')
        .delete()
        .eq('id', cafeId)
        .select()
        .maybeSingle();
      
      // Handle deletion error
      if (deleteError) {
        console.error("DELETION DEBUG: Error from Supabase:", deleteError);
        
        // Check if it's a permission error
        if (deleteError.code === '42501' || deleteError.message.includes('permission denied')) {
          toast.error("Permission denied. You cannot delete this cafe.");
        } else {
          toast.error(`Failed to delete cafe: ${deleteError.message}`);
        }
        return false;
      }
      
      // Successful deletion confirmed by returned data
      if (deletedData) {
        console.log("DELETION DEBUG: Cafe deleted successfully with returned data", deletedData);
        toast.success("Cafe deleted successfully");
        return true;
      }
      
      // If no data returned but also no error, it might be an RLS policy blocking
      // Double check if the cafe still exists
      const { data: checkData } = await supabase
        .from('cafes')
        .select('id')
        .eq('id', cafeId)
        .single();
        
      if (!checkData) {
        // The cafe is indeed gone, so deletion was successful
        console.log("DELETION DEBUG: Cafe confirmed deleted (not found after deletion)");
        toast.success("Cafe deleted successfully");
        return true;
      } else {
        // The cafe still exists, so deletion failed
        console.error("DELETION DEBUG: Cafe still exists after deletion attempt");
        toast.error("Failed to delete cafe - you may not have permission");
        return false;
      }
    } catch (err: any) {
      console.error('DELETION DEBUG: Unexpected exception:', err);
      toast.error('An unexpected error occurred while deleting the cafe');
      return false;
    }
  };

  return {
    loading,
    setLoading,
    addCafe,
    updateCafe,
    updateCafeStatus,
    deleteCafe
  };
};
