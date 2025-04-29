
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Cafe } from '@/types';
import { useData } from '@/contexts/DataContext';

interface StatsCardProps {
  title: string;
  value: number;
}

const StatsCard: React.FC<StatsCardProps> = ({ title, value }) => (
  <Card>
    <CardHeader className="pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{value}</div>
    </CardContent>
  </Card>
);

export const StatsOverview: React.FC = () => {
  const { cafes } = useData();
  const [stats, setStats] = useState({
    total: 0,
    visited: 0,
    contracted: 0
  });
  
  // Calculate stats whenever cafes change
  useEffect(() => {
    const visitedCafes = cafes.filter(c => c.status === 'Visited' || c.status === 'Contracted').length;
    const contractedCafes = cafes.filter(c => c.status === 'Contracted').length;
    
    setStats({
      total: cafes.length,
      visited: visitedCafes,
      contracted: contractedCafes
    });
  }, [cafes]);

  // Listen for data updates
  useEffect(() => {
    const handleDataUpdate = () => {
      console.log('StatsOverview detected data update');
    };
    
    window.addEventListener('horeca_data_updated', handleDataUpdate);
    return () => window.removeEventListener('horeca_data_updated', handleDataUpdate);
  }, []);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <StatsCard title="Total Cafes" value={stats.total} />
      <StatsCard title="Visited Cafes" value={stats.visited} />
      <StatsCard title="Contracted Cafes" value={stats.contracted} />
    </div>
  );
};
