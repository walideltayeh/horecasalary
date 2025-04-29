import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useCafeDelete = () => {
  // Improved deletion function with optimistic updates, non-blocking operations
  const deleteCafe = async (cafeId: string): Promise<boolean> => {
    try {
      console.log(`DELETION: Starting deletion process for cafe ${cafeId}`);

      // Track timeout and cancel state
      let isCancelled = false;
      
      // Show initial notification
      toast.info("Starting deletion process...", {
        id: `delete-${cafeId}`,
        duration: 3000
      });
      
      // Set up timeout for slow operations notice
      const slowOperationTimeoutId = setTimeout(() => {
        if (isCancelled) return;
        toast.info("Deletion is taking longer than expected, but still processing...", {
          id: `delete-slow-${cafeId}`,
          duration: 5000
        });
      }, 2500);

      try {
        // First try the edge function approach (most reliable)
        const { data: functionData, error: functionError } = await supabase.functions.invoke(
          'safe_delete_cafe_related_data',
          {
            body: { cafeId }
          }
        );
        
        clearTimeout(slowOperationTimeoutId);
        
        if (functionError) {
          console.log("DELETION: Edge function error, falling back to client deletion:", functionError);
          
          // Edge function failed, try client-side deletion
          const fallbackResult = await clientSideDeletion(cafeId);
          return fallbackResult;
        }
        
        if (functionData?.success) {
          console.log("DELETION: Edge function success:", functionData);
          
          // Notify on success
          toast.success("Deletion completed successfully", {
            id: `delete-${cafeId}`,
            duration: 2000
          });
          
          // Update localStorage and dispatch event for cross-component communication
          try {
            window.dispatchEvent(new CustomEvent('cafe_deleted', {
              detail: { cafeId }
            }));
            localStorage.setItem('last_deleted_cafe', cafeId);
            localStorage.setItem('last_deletion_time', String(Date.now()));
          } catch (e) {
            console.warn("DELETION: Could not dispatch events:", e);
          }
          
          return true;
        } else {
          console.error("DELETION: Edge function returned error:", functionData);
          toast.error(`Deletion failed: ${functionData?.error || "Unknown error"}`, {
            id: `delete-${cafeId}`,
            duration: 4000
          });
          return false;
        }
      } catch (err: any) {
        clearTimeout(slowOperationTimeoutId);
        
        // Since we can't use AbortController signal, we'll check for specific error types
        if (err.name === 'AbortError' || isCancelled) {
          console.warn("DELETION: Operation was aborted");
          toast.error("Deletion operation was cancelled", {
            id: `delete-${cafeId}`
          });
          return false;
        }
        
        console.error("DELETION: Error during edge function call:", err);
        
        // Try client-side deletion as fallback
        const fallbackResult = await clientSideDeletion(cafeId);
        return fallbackResult;
      }
    } catch (generalError: any) {
      console.error("DELETION: Critical error in deletion process:", generalError);
      toast.error(`Deletion failed: ${generalError.message || "Unknown error"}`, {
        id: `delete-${cafeId}`
      });
      return false;
    }
  };
  
  // Fallback client-side deletion (used if edge function fails)
  const clientSideDeletion = async (cafeId: string): Promise<boolean> => {
    try {
      console.log("DELETION: Attempting client-side deletion");
      toast.info("Using alternative deletion method...", {
        id: `delete-${cafeId}`,
        duration: 3000
      });

      // Step 1: Verify cafe exists
      const { data: existingCafe, error: fetchError } = await supabase
        .from('cafes')
        .select('id, name')
        .eq('id', cafeId)
        .maybeSingle();
      
      if (fetchError) {
        console.error("DELETION: Error fetching cafe:", fetchError);
        toast.error(`Error checking cafe: ${fetchError.message}`, {
          id: `delete-${cafeId}`
        });
        return false;
      }
      
      if (!existingCafe) {
        console.warn("DELETION: Cafe doesn't exist - may have been already deleted");
        toast.success("Cafe has been successfully removed", {
          id: `delete-${cafeId}`
        });
        return true; // Return true since it's already gone
      }
      
      // Step 2: Get related surveys
      const { data: relatedSurveys, error: surveysError } = await supabase
        .from('cafe_surveys')
        .select('id')
        .eq('cafe_id', cafeId);
      
      if (surveysError) {
        console.error("DELETION: Error fetching related surveys:", surveysError);
        toast.error(`Error fetching related data: ${surveysError.message}`, {
          id: `delete-${cafeId}`
        });
        return false;
      }
      
      // Step 3: Delete brand_sales for each survey
      if (relatedSurveys && relatedSurveys.length > 0) {
        const surveyIds = relatedSurveys.map(survey => survey.id);
        
        const { error: brandSalesError } = await supabase
          .from('brand_sales')
          .delete()
          .in('survey_id', surveyIds);
        
        if (brandSalesError) {
          console.error("DELETION: Error deleting brand sales:", brandSalesError);
          toast.error(`Error deleting related sales data: ${brandSalesError.message}`, {
            id: `delete-${cafeId}`
          });
          return false;
        }
      }
      
      // Step 4: Delete surveys
      const { error: deleteSurveysError } = await supabase
        .from('cafe_surveys')
        .delete()
        .eq('cafe_id', cafeId);
      
      if (deleteSurveysError) {
        console.error("DELETION: Error deleting surveys:", deleteSurveysError);
        toast.error(`Error deleting survey data: ${deleteSurveysError.message}`, {
          id: `delete-${cafeId}`
        });
        return false;
      }
      
      // Step 5: Finally delete the cafe
      const { error: deleteCafeError } = await supabase
        .from('cafes')
        .delete()
        .eq('id', cafeId);
      
      if (deleteCafeError) {
        console.error("DELETION: Error deleting cafe:", deleteCafeError);
        toast.error(`Error deleting cafe: ${deleteCafeError.message}`, {
          id: `delete-${cafeId}`
        });
        return false;
      }
      
      // Success! Update UI and notify
      console.log("DELETION: Client-side deletion completed successfully");
      toast.success("Cafe deleted successfully", {
        id: `delete-${cafeId}`
      });
      
      // Dispatch events for UI updates
      try {
        window.dispatchEvent(new CustomEvent('cafe_deleted', {
          detail: { cafeId, cafeName: existingCafe.name }
        }));
        localStorage.setItem('last_deleted_cafe', cafeId);
        localStorage.setItem('last_deletion_time', String(Date.now()));
      } catch (e) {
        console.warn("DELETION: Could not dispatch events:", e);
      }
      
      return true;
    } catch (err: any) {
      console.error("DELETION: Error in client-side deletion:", err);
      toast.error(`Deletion failed: ${err.message || "Unknown error"}`, {
        id: `delete-${cafeId}`
      });
      return false;
    }
  };

  return { deleteCafe };
};
