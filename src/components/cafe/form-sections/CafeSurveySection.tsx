
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import CafeBrandSurvey from '../../CafeBrandSurvey';
import { CafeFormState } from '../types/CafeFormTypes';

interface CafeSurveySectionProps {
  showSurvey: boolean;
  formState: CafeFormState;
  coordinates: {latitude: number | null; longitude: number | null};
  onSurveyComplete: () => void;
  onCancelSurvey: () => void;
}

export const CafeSurveySection: React.FC<CafeSurveySectionProps> = ({
  showSurvey,
  formState,
  coordinates,
  onSurveyComplete,
  onCancelSurvey
}) => {
  const { user } = useAuth();

  if (!showSurvey) return null;

  return (
    <div className="mt-4 border border-gray-200 rounded-lg p-4 bg-white">
      <CafeBrandSurvey
        cafeFormData={{
          ...formState,
          createdBy: user?.id || 'unknown',
          latitude: coordinates.latitude || 0,
          longitude: coordinates.longitude || 0,
          status: formState.status
        }}
        onComplete={onSurveyComplete}
        onCancel={onCancelSurvey}
      />
    </div>
  );
};
