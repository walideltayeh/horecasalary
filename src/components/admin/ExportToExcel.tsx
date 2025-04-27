
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { toast } from "sonner";
import { Cafe } from "@/types";
import { getCafeSize } from "@/utils/cafeUtils";

interface ExportToExcelProps {
  cafes: Cafe[];
}

const ExportToExcel: React.FC<ExportToExcelProps> = ({ cafes }) => {
  const exportToExcel = () => {
    const cafesData = cafes.map(cafe => ({
      "Name": cafe.name,
      "Size": getCafeSize(cafe.numberOfHookahs),
      "Location": `${cafe.governorate}, ${cafe.city}`,
      "Status": cafe.status,
      "Owner": cafe.ownerName,
      "Owner Number": cafe.ownerNumber,
      "Tables": cafe.numberOfTables,
      "Hookahs": cafe.numberOfHookahs,
      "Created By": cafe.createdBy,
      "Date Added": new Date(cafe.createdAt).toLocaleDateString()
    }));

    const worksheet = window.XLSX.utils.json_to_sheet(cafesData);
    const workbook = window.XLSX.utils.book_new();
    window.XLSX.utils.book_append_sheet(workbook, worksheet, "Cafes");
    window.XLSX.writeFile(workbook, "HoReCa_Cafes_Export.xlsx");
    
    toast.success("Cafes data exported successfully");
  };

  return (
    <Button 
      variant="outline" 
      className="flex items-center gap-2 border-custom-red text-custom-red hover:bg-red-50"
      onClick={exportToExcel}
    >
      <Download className="h-4 w-4" /> Export to Excel
    </Button>
  );
};

export default ExportToExcel;
