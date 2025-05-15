
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useCafeForm } from '@/hooks/useCafeForm';
import { CafeFormState } from './types/CafeFormTypes';
import { CafeFormLayout } from './layout/CafeFormLayout';
import { CafeSubmitHandler } from './form-handlers/CafeSubmitHandler';
import CafeFormFields from './form-sections/CafeFormFields';
import { CafeSurveySection } from './form-sections/CafeSurveySection';
import CafeSurveyWrapper from './CafeSurveyWrapper';

interface AddCafeFormProps {
  onPreSubmit?: (cafeData: CafeFormState & { latitude: number, longitude: number }) => Promise<boolean>;
  surveyCompleted?: boolean;
  onFormChange?: (formData: CafeFormState) => void;
  onComplete?: () => void;
}

const AddCafeForm: React.FC<AddCafeFormProps> = ({ 
  onPreSubmit, 
  surveyCompleted: externalSurveyCompleted = false,
  onFormChange,
  onComplete
}) => {
  const [showSurvey, setShowSurvey] = useState(false);
  const [localSurveyCompleted, setLocalSurveyCompleted] = useState(externalSurveyCompleted);
  const formRef = useRef<HTMLFormElement>(null);
  const initialFormStateSet = useRef<boolean>(false);
  const formStateRef = useRef<CafeFormState | null>(null);
  const [formKey, setFormKey] = useState<number>(0);

  const {
    formState,
    handleInputChange,
    handleSelectChange,
    handleCaptureGPS,
    coordinates,
    getCafeSize,
    isCapturingLocation,
    showLocationDialog,
    setShowLocationDialog,
    resetForm
  } = useCafeForm();

  // Store form state in ref for recovery mechanism
  useEffect(() => {
    formStateRef.current = formState;
  }, [formState]);

  // Save form state to session storage as backup
  const saveFormStateToStorage = useCallback(() => {
    if (formStateRef.current) {
      try {
        sessionStorage.setItem('cafeFormData', JSON.stringify(formStateRef.current));
        sessionStorage.setItem('cafeFormCoordinates', JSON.stringify(coordinates));
      } catch (err) {
        console.error("Error saving form state to session storage:", err);
      }
    }
  }, [coordinates]);

  // Periodically save form data to avoid loss
  useEffect(() => {
    const saveInterval = setInterval(saveFormStateToStorage, 5000);
    
    // Try to load saved form data on initial mount
    if (!initialFormStateSet.current) {
      try {
        const savedFormData = sessionStorage.getItem('cafeFormData');
        const savedCoordinates = sessionStorage.getItem('cafeFormCoordinates');
        
        if (savedFormData) {
          initialFormStateSet.current = true;
          // Implement form recovery logic here if needed
          console.log("Found saved form data that could be recovered if needed");
        }
      } catch (err) {
        console.error("Error loading saved form data:", err);
      }
    }
    
    return () => {
      clearInterval(saveInterval);
      saveFormStateToStorage();
    };
  }, [saveFormStateToStorage]);

  // Update local state when external surveyCompleted prop changes
  useEffect(() => {
    setLocalSurveyCompleted(externalSurveyCompleted);
  }, [externalSurveyCompleted]);

  // Call onFormChange whenever formState changes, with debouncing
  useEffect(() => {
    if (onFormChange) {
      const timer = setTimeout(() => {
        onFormChange(formState);
      }, 300);
      
      return () => clearTimeout(timer);
    }
  }, [formState, onFormChange]);

  const handleShowSurvey = useCallback(() => {
    setShowSurvey(true);
  }, []);

  const handleSurveyComplete = useCallback(() => {
    setLocalSurveyCompleted(true);
    setShowSurvey(false);
    if (onComplete) {
      onComplete();
    }
  }, [onComplete]);

  const handleCancelSurvey = useCallback(() => {
    setShowSurvey(false);
  }, []);

  const handleFormSuccess = useCallback(() => {
    // Reset the form after successful submission
    resetForm();
    setFormKey(prev => prev + 1);
    
    // Clear session storage form data
    try {
      sessionStorage.removeItem('cafeFormData');
      sessionStorage.removeItem('cafeFormCoordinates');
    } catch (err) {
      console.error("Error clearing stored form data:", err);
    }
    
    // Reset survey completion state
    setLocalSurveyCompleted(false);
  }, [resetForm]);

  return (
    <CafeFormLayout
      key={formKey}
      isSubmitting={false}
      hasHookahs={formState.numberOfHookahs >= 1}
      surveyCompleted={localSurveyCompleted}
      onSubmit={() => {}}
    >
      <CafeSubmitHandler
        formState={formState}
        coordinates={coordinates}
        surveyCompleted={localSurveyCompleted}
        onPreSubmit={onPreSubmit}
        onShowSurvey={handleShowSurvey}
        onSuccess={handleFormSuccess}
      >
        <CafeFormFields
          formState={formState}
          handleInputChange={handleInputChange}
          handleSelectChange={handleSelectChange}
          handleStatusChange={handleSelectChange}
          getCafeSize={getCafeSize}
          coordinates={coordinates}
          availableCities={[]}
          setLocationCoordinates={() => {}}
          handleCaptureGPS={handleCaptureGPS}
          isCapturingLocation={isCapturingLocation}
          showLocationDialog={showLocationDialog}
          setShowLocationDialog={setShowLocationDialog}
        />
        
        <CafeSurveyWrapper
          surveyCompleted={localSurveyCompleted}
          onFormChange={(formData) => {
            if (onFormChange) {
              onFormChange(formData);
            }
          }}
          currentFormData={formState}
          onSurveyComplete={handleSurveyComplete}
          onPreSubmit={onPreSubmit}
        />

        <CafeSurveySection 
          showSurvey={showSurvey}
          formState={formState}
          coordinates={coordinates}
          onSurveyComplete={handleSurveyComplete}
          onCancelSurvey={handleCancelSurvey}
        />
      </CafeSubmitHandler>
    </CafeFormLayout>
  );
};

export default AddCafeForm;
