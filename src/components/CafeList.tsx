
import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Check, Clock } from 'lucide-react';

interface CafeListProps {
  adminView?: boolean;
  filterByUser?: string;
}

const CafeList: React.FC<CafeListProps> = ({ adminView = false, filterByUser }) => {
  const { cafes, getCafeSize, updateCafeStatus } = useData();
  const { user } = useAuth();
  
  const handleUpdateStatus = (cafeId: string, newStatus: 'Pending' | 'Visited' | 'Contracted') => {
    updateCafeStatus(cafeId, newStatus);
    toast.success(`Cafe status updated to ${newStatus}`);
  };
  
  // Filter cafes based on filterByUser if provided
  const filteredCafes = filterByUser 
    ? cafes.filter(cafe => cafe.createdBy === filterByUser)
    : cafes;
    
  return (
    <div className="rounded-md border overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Size</TableHead>
            <TableHead>Location</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Owner</TableHead>
            {adminView && <TableHead>Created By</TableHead>}
            <TableHead>Date Added</TableHead>
            {!adminView && <TableHead className="text-right">Actions</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredCafes.length === 0 ? (
            <TableRow>
              <TableCell colSpan={adminView ? 7 : 7} className="text-center py-4 text-muted-foreground">
                No cafes found. {!adminView && "Add some cafes to see them here."}
              </TableCell>
            </TableRow>
          ) : (
            filteredCafes.map((cafe) => (
              <TableRow key={cafe.id}>
                <TableCell className="font-medium">{cafe.name}</TableCell>
                <TableCell>
                  <span className={getCafeSize(cafe.numberOfHookahs) === 'In Negotiation' ? 'text-orange-500' : 
                                   getCafeSize(cafe.numberOfHookahs) === 'Small' ? 'text-blue-500' : 
                                   getCafeSize(cafe.numberOfHookahs) === 'Medium' ? 'text-green-500' : 
                                   'text-purple-500'}>
                    {getCafeSize(cafe.numberOfHookahs)}
                  </span>
                </TableCell>
                <TableCell>{cafe.governorate}, {cafe.city}</TableCell>
                <TableCell>
                  <span className={cafe.status === 'Contracted' ? 'text-green-500' : 
                                   cafe.status === 'Visited' ? 'text-blue-500' : 
                                   'text-gray-500'}>
                    {cafe.status}
                  </span>
                </TableCell>
                <TableCell>{cafe.ownerName}</TableCell>
                {adminView && <TableCell>{cafe.createdBy}</TableCell>}
                <TableCell>{new Date(cafe.createdAt).toLocaleDateString()}</TableCell>
                {!adminView && (
                  <TableCell className="text-right">
                    {cafe.status === 'Pending' && (
                      <div className="flex justify-end gap-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="flex items-center gap-1 border-blue-500 text-blue-500 hover:bg-blue-50"
                          onClick={() => handleUpdateStatus(cafe.id, 'Visited')}
                        >
                          <Clock className="h-3 w-3" /> Mark Visited
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="flex items-center gap-1 border-green-500 text-green-500 hover:bg-green-50"
                          onClick={() => handleUpdateStatus(cafe.id, 'Contracted')}
                        >
                          <Check className="h-3 w-3" /> Mark Contracted
                        </Button>
                      </div>
                    )}
                    {cafe.status === 'Visited' && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex items-center gap-1 border-green-500 text-green-500 hover:bg-green-50"
                        onClick={() => handleUpdateStatus(cafe.id, 'Contracted')}
                      >
                        <Check className="h-3 w-3" /> Mark Contracted
                      </Button>
                    )}
                    {cafe.status === 'Contracted' && (
                      <span className="text-green-500 text-xs">✓ Contracted</span>
                    )}
                  </TableCell>
                )}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default CafeList;
