
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

  // Improved deletion function with optimistic updates, non-blocking operations
  const deleteCafe = async (cafeId: string): Promise<boolean> => {
    try {
      console.log(`DELETION: Starting deletion process for cafe ${cafeId}`);
      
      // Use a cancelable promise pattern to improve control over long-running operations
      let isCanceled = false;
      let deletePromise: Promise<boolean>;
      
      const timeoutId = setTimeout(() => {
        console.log("DELETION: Operation taking longer than expected, but still running");
        toast.info("Deletion is taking longer than expected, please wait...");
      }, 3000);
      
      // Wrap the actual deletion in a non-blocking promise
      deletePromise = (async () => {
        try {
          // Step 1: Verify cafe exists
          const { data: existingCafe, error: fetchError } = await supabase
            .from('cafes')
            .select('name')
            .eq('id', cafeId)
            .maybeSingle();
          
          if (fetchError) {
            console.error("DELETION: Error fetching cafe:", fetchError);
            toast.error(`Error checking cafe: ${fetchError.message}`);
            return false;
          }
          
          if (!existingCafe) {
            console.warn("DELETION: Cafe doesn't exist - may have been already deleted");
            toast.error("Cafe not found - it may have been already deleted");
            return true; // Return true since it's already gone
          }
          
          // Step 2: Delete related records first - using a more efficient approach
          // Delete related surveys and brand_sales in a single operation using the edge function
          const { error: cleanupError } = await supabase.functions.invoke('safe_delete_cafe_related_data', {
            body: { cafeId }
          });
          
          if (cleanupError) {
            console.log("DELETION: Using alternative deletion method due to:", cleanupError);
            
            // Step 2b: Fallback - delete related surveys directly
            const { data: relatedSurveys } = await supabase
              .from('cafe_surveys')
              .select('id')
              .eq('cafe_id', cafeId);
            
            if (relatedSurveys && relatedSurveys.length > 0) {
              console.log(`DELETION: Found ${relatedSurveys.length} related surveys to delete first`);
              
              // Get survey IDs
              const surveyIds = relatedSurveys.map(survey => survey.id);
              
              // Delete brand_sales records linked to these surveys
              await supabase
                .from('brand_sales')
                .delete()
                .in('survey_id', surveyIds);
              
              // Delete surveys
              await supabase
                .from('cafe_surveys')
                .delete()
                .eq('cafe_id', cafeId);
            }
          }
          
          // Check if the operation was canceled
          if (isCanceled) {
            console.log("DELETION: Operation was canceled");
            return false;
          }
          
          // Step 3: Delete the cafe itself
          const { error: deleteError } = await supabase
            .from('cafes')
            .delete()
            .eq('id', cafeId);
          
          if (deleteError) {
            console.error("DELETION: Failed to delete cafe:", deleteError);
            toast.error(`Failed to delete cafe: ${deleteError.message}`);
            return false;
          }
          
          console.log("DELETION: Cafe successfully deleted");
          
          // Dispatch a custom event to notify all components immediately
          try {
            window.dispatchEvent(new CustomEvent('cafe_deleted', {
              detail: { cafeId, cafeName: existingCafe.name }
            }));
            
            // Also update localStorage for cross-tab communication
            localStorage.setItem('last_deleted_cafe', cafeId);
            localStorage.setItem('last_deletion_time', String(Date.now()));
          } catch (e) {
            console.warn("DELETION: Could not dispatch events:", e);
          }
          
          return true;
        } catch (err: any) {
          console.error('DELETION: Unexpected error in deletion process:', err);
          toast.error(`Unexpected error: ${err.message || 'Unknown error'}`);
          return false;
        }
      })();
      
      // Create a timeout promise that resolves after a maximum time
      const timeoutPromise = new Promise<boolean>((resolve) => {
        setTimeout(() => {
          isCanceled = true;
          resolve(false);
          toast.error("Deletion operation timed out. The app may be in an inconsistent state.");
          console.error("DELETION: Operation timed out completely");
        }, 15000); // 15 seconds max timeout
      });
      
      // Race the deletion against a timeout
      const result = await Promise.race([deletePromise, timeoutPromise]);
      clearTimeout(timeoutId);
      return result;
    } catch (err: any) {
      console.error('DELETION: Critical error in deletion process:', err);
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
