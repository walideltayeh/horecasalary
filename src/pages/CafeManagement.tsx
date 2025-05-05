
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from '@/contexts/AuthContext';
import CafeSurveyWrapper from '@/components/cafe/CafeSurveyWrapper';
import CafeList from '@/components/CafeList';
import { useLanguage } from '@/contexts/LanguageContext';

const CafeManagement: React.FC = () => {
  const { isAdmin } = useAuth();
  const { t } = useLanguage();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">{t('cafe.management.title')}</h1>
        <p className="text-gray-600">{t('cafe.management.subtitle')}</p>
      </div>

      {!isAdmin && (
        <CafeSurveyWrapper />
      )}

      <Card>
        <CardHeader>
          <CardTitle>{t('cafe.my.cafes')}</CardTitle>
          <CardDescription>{t('cafe.list')}</CardDescription>
        </CardHeader>
        <CardContent>
          <CafeList adminView={isAdmin} />
        </CardContent>
      </Card>
    </div>
  );
};

export default CafeManagement;
