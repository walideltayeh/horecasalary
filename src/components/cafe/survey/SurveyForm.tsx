
import React from 'react';
import CafeBrandSurvey from '@/components/CafeBrandSurvey';
import { CafeFormState } from '../types/CafeFormTypes';
import { useAuth } from '@/contexts/AuthContext';

interface SurveyFormProps {
  isVisible: boolean;
  cafeFormData: CafeFormState;
  onComplete: () => void;
  onCancel: () => void;
}

const SurveyForm: React.FC<SurveyFormProps> = ({
  isVisible,
  cafeFormData,
  onComplete,
  onCancel
}) => {
  const { user } = useAuth();
  
  if (!isVisible) return null;

  return (
    <div className="mt-4 bg-white p-4 rounded-lg border border-gray-200">
      <CafeBrandSurvey 
        cafeFormData={{
          ...cafeFormData,
          createdBy: user?.id || 'unknown',
          latitude: 0,
          longitude: 0,
          status: 'Pending'
        }} 
        onComplete={onComplete} 
        onCancel={onCancel}
      />
    </div>
  );
};

export default SurveyForm;
