
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Cafe } from '@/types';

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

interface StatsOverviewProps {
  cafes: Cafe[];
}

export const StatsOverview: React.FC<StatsOverviewProps> = ({ cafes }) => {
  const visitedCafes = cafes.filter(c => c.status === 'Visited' || c.status === 'Contracted').length;
  const contractedCafes = cafes.filter(c => c.status === 'Contracted').length;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <StatsCard title="Total Cafes" value={cafes.length} />
      <StatsCard title="Visited Cafes" value={visitedCafes} />
      <StatsCard title="Contracted Cafes" value={contractedCafes} />
    </div>
  );
};
