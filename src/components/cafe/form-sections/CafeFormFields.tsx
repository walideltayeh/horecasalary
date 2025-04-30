
import React from 'react';
import { CafeFormState } from '../types/CafeFormTypes';
import CafeBasicInfo from '../CafeBasicInfo';
import CafeCapacityInfo from '../CafeCapacityInfo';
import CafeLocationInfo from '../CafeLocationInfo';
import { Label } from '@/components/ui/label';
import { PhotoUpload } from '../PhotoUpload';
import GPSCapture from '../GPSCapture';

interface CafeFormFieldsProps {
  formState: CafeFormState;
  coordinates: { latitude: number | null; longitude: number | null };
  availableCities: string[];
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleStatusChange: (name: string, value: string) => void;
  handleSelectChange: (name: string, value: string) => void;
  setLocationCoordinates: (latitude: number, longitude: number) => void;
}

const CafeFormFields = ({
  formState,
  coordinates,
  availableCities,
  handleInputChange,
  handleStatusChange,
  handleSelectChange,
  setLocationCoordinates,
}: CafeFormFieldsProps) => {
  return (
    <div className="space-y-6">
      <CafeBasicInfo
        formState={formState}
        handleInputChange={handleInputChange}
        handleStatusChange={handleStatusChange}
      />

      <CafeCapacityInfo
        formState={formState}
        handleInputChange={handleInputChange}
      />

      <CafeLocationInfo
        formState={formState}
        availableCities={availableCities}
        handleSelectChange={handleSelectChange}
      />

      {/* Photo Upload */}
      <div className="space-y-2">
        <Label>Cafe Photo <span className="text-red-500">*</span></Label>
        <PhotoUpload
          onPhotoChange={(url) => handleSelectChange('photoUrl', url)}
          initialUrl={formState.photoUrl}
        />
      </div>

      {/* GPS Capture */}
      <div className="space-y-2">
        <Label>GPS Location <span className="text-red-500">*</span></Label>
        <GPSCapture
          onCaptureLocation={setLocationCoordinates}
          latitude={coordinates.latitude}
          longitude={coordinates.longitude}
        />
      </div>
    </div>
  );
};

export default CafeFormFields;
