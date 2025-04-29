
import React from 'react';
import { TableRow, TableCell } from "@/components/ui/table";
import { Skeleton } from '@/components/ui/skeleton';

interface CafeTableSkeletonProps {
  adminView: boolean;
  rowCount?: number;
}

const CafeTableSkeleton: React.FC<CafeTableSkeletonProps> = ({ adminView, rowCount = 3 }) => {
  return (
    <>
      {Array(rowCount).fill(0).map((_, i) => (
        <TableRow key={`skeleton-${i}`}>
          <TableCell><Skeleton className="h-4 w-full" /></TableCell>
          <TableCell><Skeleton className="h-4 w-16" /></TableCell>
          <TableCell><Skeleton className="h-4 w-32" /></TableCell>
          <TableCell><Skeleton className="h-4 w-20" /></TableCell>
          <TableCell><Skeleton className="h-4 w-24" /></TableCell>
          {adminView && <TableCell><Skeleton className="h-4 w-24" /></TableCell>}
          <TableCell><Skeleton className="h-4 w-28" /></TableCell>
          <TableCell><Skeleton className="h-4 w-full" /></TableCell>
        </TableRow>
      ))}
    </>
  );
};

export default CafeTableSkeleton;
