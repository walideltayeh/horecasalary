
import { Button } from "@/components/ui/button";
import { FileSpreadsheet } from "lucide-react";
import { toast } from "sonner";
import { Cafe } from "@/types";
import { getCafeSize } from "@/utils/cafeUtils";
import { useState } from "react";
import { useCafeSurveys } from "@/hooks/useCafeSurveys";

interface ExportToExcelProps {
  cafes: Cafe[];
}

const ExportToExcel: React.FC<ExportToExcelProps> = ({ cafes }) => {
  const [isExporting, setIsExporting] = useState(false);
  const { cafeSurveys, loading, fetchAllSurveys } = useCafeSurveys();

  const exportToExcel = async () => {
    setIsExporting(true);
    try {
      // Refresh survey data before exporting
      await fetchAllSurveys();
      
      const cafesData = cafes.map(cafe => {
        // Find surveys for this cafe
        const surveysForCafe = cafeSurveys[cafe.id] || [];
        
        // Create brand-specific columns
        const brandData: Record<string, string> = {};
        const uniqueBrands = new Set<string>();
        
        // Collect all unique brands
        surveysForCafe.forEach(survey => {
          uniqueBrands.add(survey.brand);
        });
        
        // Add data for each brand
        uniqueBrands.forEach(brand => {
          const brandSurvey = surveysForCafe.find(s => s.brand === brand);
          brandData[`${brand} (packs/week)`] = brandSurvey ? brandSurvey.packsPerWeek.toString() : "0";
        });
        
        // Return cafe data with survey information
        return {
          "Name": cafe.name,
          "Size": getCafeSize(cafe.numberOfHookahs),
          "Location": `${cafe.governorate}, ${cafe.city}`,
          "Status": cafe.status,
          "Owner": cafe.ownerName,
          "Owner Number": cafe.ownerNumber,
          "Tables": cafe.numberOfTables,
          "Hookahs": cafe.numberOfHookahs,
          "Created By": cafe.createdBy,
          "Date Added": new Date(cafe.createdAt).toLocaleDateString(),
          "Has Survey": surveysForCafe.length > 0 ? "Yes" : "No",
          ...brandData
        };
      });

      const worksheet = window.XLSX.utils.json_to_sheet(cafesData);
      const workbook = window.XLSX.utils.book_new();
      window.XLSX.utils.book_append_sheet(workbook, worksheet, "Cafes");
      window.XLSX.writeFile(workbook, "HoReCa_Cafes_Export.xlsx");
      
      toast.success("Cafes data exported successfully with survey information");
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Failed to export data");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Button 
      variant="outline" 
      className="flex items-center gap-2 border-custom-red text-custom-red hover:bg-red-50"
      onClick={exportToExcel}
      disabled={isExporting || loading}
    >
      <FileSpreadsheet className="h-4 w-4" /> 
      {isExporting ? "Exporting..." : "Export to Excel"}
    </Button>
  );
};

export default ExportToExcel;
