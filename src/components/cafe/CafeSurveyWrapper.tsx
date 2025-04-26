
import React, { useState } from 'react';
import CafeBrandSurvey from '@/components/CafeBrandSurvey';
import AddCafeForm from './AddCafeForm';

const CafeSurveyWrapper: React.FC = () => {
  const [showSurvey, setShowSurvey] = useState(false);
  const [newCafeId, setNewCafeId] = useState<string | null>(null);

  const handleCafeAdded = (cafeId: string) => {
    setNewCafeId(cafeId);
    setShowSurvey(true);
  };

  const handleSurveyComplete = () => {
    setShowSurvey(false);
    setNewCafeId(null);
  };

  if (showSurvey && newCafeId) {
    return <CafeBrandSurvey cafeId={newCafeId} onComplete={handleSurveyComplete} />;
  }

  return <AddCafeForm onCafeAdded={handleCafeAdded} />;
};

export default CafeSurveyWrapper;
