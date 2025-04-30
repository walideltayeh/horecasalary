
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import SystemStats from './SystemStats';
import { Cafe } from '@/types';

interface AdminSystemInfoProps {
  cafes: Cafe[];
}

const AdminSystemInfo: React.FC<AdminSystemInfoProps> = ({ cafes }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>System Information</CardTitle>
      </CardHeader>
      <CardContent>
        <SystemStats cafes={cafes} />
      </CardContent>
    </Card>
  );
};

export default AdminSystemInfo;
