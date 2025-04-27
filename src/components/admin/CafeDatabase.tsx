
import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download } from 'lucide-react';
import CafeList from '@/components/CafeList';
import { toast } from '@/hooks/use-toast';
import { getCafeSize } from '@/utils/cafeUtils';
import { Cafe } from '@/types';

interface CafeDatabaseProps {
  cafes: Cafe[];
}

export const CafeDatabase: React.FC<CafeDatabaseProps> = ({ cafes }) => {
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
    
    toast({
      title: "Export Successful",
      description: "Cafes data exported successfully",
      variant: "default"
    });
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Cafe Database</CardTitle>
          <CardDescription>All cafes in the system</CardDescription>
        </div>
        <Button 
          variant="outline" 
          className="flex items-center gap-2 border-custom-red text-custom-red hover:bg-red-50"
          onClick={exportToExcel}
        >
          <Download className="h-4 w-4" /> Export to Excel
        </Button>
      </CardHeader>
      <CardContent>
        <CafeList adminView={true} />
      </CardContent>
    </Card>
  );
};
