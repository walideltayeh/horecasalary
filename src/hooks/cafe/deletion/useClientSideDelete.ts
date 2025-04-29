
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { broadcastDeletionEvent } from './useEdgeFunctionDelete';

/**
 * Handles deletion using client-side approach (fallback)
 */
export const useClientSideDelete = () => {
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
      broadcastDeletionEvent(cafeId);
      
      return true;
    } catch (err: any) {
      console.error("DELETION: Error in client-side deletion:", err);
      toast.error(`Deletion failed: ${err.message || "Unknown error"}`, {
        id: `delete-${cafeId}`
      });
      return false;
    }
  };

  return { clientSideDeletion };
};
