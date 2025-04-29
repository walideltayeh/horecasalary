
import React from 'react';
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";

interface CafeStatsCardProps {
  cafes?: any[];
  loadingCafes?: boolean;
  title?: string;
  value?: number;
}

const CafeStatsCard: React.FC<CafeStatsCardProps> = ({ 
  cafes, 
  loadingCafes,
  title,
  value
}) => {
  // Handle both use cases - either cafes data or direct title/value
  if (title !== undefined && value !== undefined) {
    return (
      <Card className="bg-white">
        <CardHeader className="pb-2">
          <CardTitle className="text-gray-800">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold">{value}</p>
        </CardContent>
      </Card>
    );
  }
  
  // Original cafe database status card
  return (
    <Card className="bg-green-50 border-green-200">
      <CardHeader className="pb-2">
        <CardTitle className="text-green-800">Cafe Database Status</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-green-700">
          {loadingCafes ? (
            "Loading cafe data..."
          ) : (
            `Total cafes in system: ${cafes?.length || 0}`
          )}
        </p>
      </CardContent>
    </Card>
  );
};

export default CafeStatsCard;
