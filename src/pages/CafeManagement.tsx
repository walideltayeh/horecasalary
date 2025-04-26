
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from '@/contexts/AuthContext';
import CafeSurveyWrapper from '@/components/cafe/CafeSurveyWrapper';
import CafeList from '@/components/CafeList';

const CafeManagement: React.FC = () => {
  const { isAdmin } = useAuth();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Cafe Management</h1>
        <p className="text-gray-600">Add and manage cafe information</p>
      </div>

      {!isAdmin && (
        <CafeSurveyWrapper />
      )}

      <Card>
        <CardHeader>
          <CardTitle>My Cafes</CardTitle>
          <CardDescription>List of cafes in the system</CardDescription>
        </CardHeader>
        <CardContent>
          <CafeList adminView={isAdmin} />
        </CardContent>
      </Card>
    </div>
  );
};

export default CafeManagement;
