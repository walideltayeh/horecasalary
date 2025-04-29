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

  // Completely rewritten deletion function with more robust error handling and cleanup
  const deleteCafe = async (cafeId: string): Promise<boolean> => {
    try {
      console.log(`DELETION: Starting deletion process for cafe ${cafeId}`);
      
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
      
      // Step 2: Delete related brand_sales records first
      const { data: relatedSurveys } = await supabase
        .from('cafe_surveys')
        .select('id')
        .eq('cafe_id', cafeId);
      
      if (relatedSurveys && relatedSurveys.length > 0) {
        console.log(`DELETION: Found ${relatedSurveys.length} related surveys to delete first`);
        
        // Get survey IDs
        const surveyIds = relatedSurveys.map(survey => survey.id);
        
        // Delete brand_sales records linked to these surveys
        const { error: brandSalesError } = await supabase
          .from('brand_sales')
          .delete()
          .in('survey_id', surveyIds);
        
        if (brandSalesError) {
          console.error("DELETION: Failed to delete related brand_sales:", brandSalesError);
          // Continue anyway, try to delete surveys and cafe
        } else {
          console.log("DELETION: Successfully deleted related brand_sales");
        }
        
        // Delete surveys
        const { error: surveysError } = await supabase
          .from('cafe_surveys')
          .delete()
          .eq('cafe_id', cafeId);
          
        if (surveysError) {
          console.error("DELETION: Failed to delete related surveys:", surveysError);
          // Continue anyway, try to delete the cafe
        } else {
          console.log("DELETION: Successfully deleted related surveys");
        }
      }
      
      // Step 3: Delete the cafe with multiple retries
      let success = false;
      let attempts = 0;
      const maxAttempts = 5; // Increased from 3 to 5 attempts
      
      while (!success && attempts < maxAttempts) {
        attempts++;
        console.log(`DELETION: Attempt ${attempts}/${maxAttempts} to delete cafe ${cafeId}`);
        
        try {
          // Small delay between retries, increasing with each attempt
          if (attempts > 1) {
            const delayMs = attempts * 300;
            console.log(`DELETION: Waiting ${delayMs}ms before retry ${attempts}`);
            await new Promise(resolve => setTimeout(resolve, delayMs));
          }
          
          const { data, error } = await supabase
            .from('cafes')
            .delete()
            .eq('id', cafeId)
            .select();
          
          if (error) {
            console.error(`DELETION: Error on attempt ${attempts}:`, error);
            
            // Special handling for foreign key violations
            if (error.code === "23503") {
              console.log("DELETION: Foreign key violation - attempting to clean up related records");
              
              // Instead of using RPC, we'll handle the cleanup directly
              // First, try to find surveys and delete those
              const { data: surveys } = await supabase
                .from('cafe_surveys')
                .select('id')
                .eq('cafe_id', cafeId);
                
              if (surveys && surveys.length > 0) {
                console.log(`Found ${surveys.length} more surveys to delete`);
                
                // Delete related brand sales for these surveys
                for (const survey of surveys) {
                  await supabase
                    .from('brand_sales')
                    .delete()
                    .eq('survey_id', survey.id);
                }
                
                // Delete the surveys
                await supabase
                  .from('cafe_surveys')
                  .delete()
                  .eq('cafe_id', cafeId);
              }
              
              // Try again using execute_sql for direct SQL execution as a last resort
              if (attempts === maxAttempts - 1) {
                console.log("DELETION: Using SQL execution as last resort");
                try {
                  const sql = `
                    DELETE FROM brand_sales WHERE survey_id IN 
                    (SELECT id FROM cafe_surveys WHERE cafe_id = '${cafeId}');
                    
                    DELETE FROM cafe_surveys WHERE cafe_id = '${cafeId}';
                    
                    DELETE FROM cafes WHERE id = '${cafeId}';
                  `;
                  
                  await supabase.rpc('execute_sql', { sql });
                } catch (sqlError) {
                  console.error("Error during SQL execution:", sqlError);
                }
              }
            }
            
            // If this was the last attempt, show error to user
            if (attempts === maxAttempts) {
              toast.error(`Failed to delete cafe: ${error.message}`);
              return false;
            }
            
            // Continue to next attempt
            continue;
          }
          
          // If we get here, deletion was successful
          console.log("DELETION: Cafe successfully deleted");
          success = true;
          
          // Dispatch a custom event to notify all components
          window.dispatchEvent(new CustomEvent('cafe_deleted', {
            detail: { cafeId, cafeName: existingCafe.name }
          }));
          
          // Also update localStorage for cross-tab communication
          try {
            localStorage.setItem('last_deleted_cafe', cafeId);
            localStorage.setItem('last_deletion_time', String(Date.now()));
          } catch (e) {
            console.warn("DELETION: Could not update localStorage");
          }
          
          return true;
        } catch (err: any) {
          console.error(`DELETION: Unexpected error on attempt ${attempts}:`, err);
          
          // If this was the last attempt, show error to user
          if (attempts === maxAttempts) {
            toast.error(`Unexpected error: ${err.message || 'Unknown error'}`);
            return false;
          }
        }
      }
      
      // If we got here, all attempts failed
      toast.error("Failed to delete cafe after multiple attempts");
      return false;
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
