
import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import CafeList from '@/components/CafeList';
import { Cafe } from '@/types';
import ExportToExcel from './ExportToExcel';

interface CafeDatabaseProps {
  cafes: Cafe[];
}

export const CafeDatabase: React.FC<CafeDatabaseProps> = ({ cafes }) => {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Cafe Database</CardTitle>
          <CardDescription>All cafes in the system</CardDescription>
        </div>
        <ExportToExcel cafes={cafes} />
      </CardHeader>
      <CardContent>
        <CafeList adminView={true} />
      </CardContent>
    </Card>
  );
};
