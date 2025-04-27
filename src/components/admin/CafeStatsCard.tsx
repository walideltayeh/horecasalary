
import React from 'react';
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";

interface CafeStatsCardProps {
  cafes: any[];
  loadingCafes: boolean;
}

const CafeStatsCard: React.FC<CafeStatsCardProps> = ({ cafes, loadingCafes }) => {
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
            `Total cafes in system: ${cafes.length}`
          )}
        </p>
      </CardContent>
    </Card>
  );
};

export default CafeStatsCard;
