
import React from 'react';
import { CafeFormState } from '../types/CafeFormTypes';
import { CafeBasicInfo } from '../CafeBasicInfo';
import { CafeCapacityInfo } from '../CafeCapacityInfo';
import { CafeLocationInfo } from '../CafeLocationInfo';
import { PhotoUpload } from '../PhotoUpload';
import { GPSCapture } from '../GPSCapture';
import CafeStatusSelect from '../CafeStatusSelect';
import { Label } from "@/components/ui/label";

interface CafeFormFieldsProps {
  formState: CafeFormState;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleSelectChange: (name: string, value: string) => void;
  getCafeSize: (numberOfHookahs: number) => string;
  coordinates: { latitude: number | null; longitude: number | null };
  handleCaptureGPS: () => void;
  isCapturingLocation: boolean;
  showLocationDialog: boolean;
  setShowLocationDialog: (show: boolean) => void;
}

export const CafeFormFields: React.FC<CafeFormFieldsProps> = ({ 
  formState, 
  handleInputChange, 
  handleSelectChange,
  getCafeSize,
  coordinates,
  handleCaptureGPS,
  isCapturingLocation,
  showLocationDialog,
  setShowLocationDialog
}) => {
  return (
    <>
      <CafeBasicInfo 
        formState={formState} 
        onInputChange={handleInputChange} 
      />

      <CafeCapacityInfo 
        formState={formState} 
        onInputChange={handleInputChange}
        cafeSize={getCafeSize(formState.numberOfHookahs)}
      />

      <CafeLocationInfo 
        formState={formState} 
        onSelectChange={handleSelectChange}
        availableCities={[]}
      />

      <CafeStatusSelect
        selectedStatus={formState.status}
        onSelectChange={handleSelectChange}
      />

      <div className="space-y-2">
        <Label className="block">
          Cafe Photo <span className="text-red-500">*</span>
        </Label>
        <PhotoUpload 
          onPhotoChange={(photoUrl) => handleSelectChange('photoUrl', photoUrl)} 
        />
      </div>

      <div className="space-y-2">
        <Label className="block">
          GPS Location <span className="text-red-500">*</span>
        </Label>
        <GPSCapture 
          coordinates={coordinates}
          onCaptureGPS={handleCaptureGPS}
          isCapturingLocation={isCapturingLocation}
          showLocationDialog={showLocationDialog}
          setShowLocationDialog={setShowLocationDialog}
        />
      </div>
    </>
  );
};
