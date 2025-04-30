
import { Button } from "@/components/ui/button";
import { Navigation } from 'lucide-react';
import { LocationDialog } from './LocationDialog';

interface GPSCaptureProps {
  coordinates: {
    latitude: number | null;
    longitude: number | null;
  };
  onCaptureGPS: () => void;
  isCapturingLocation: boolean;
  showLocationDialog: boolean;
  setShowLocationDialog: (show: boolean) => void;
}

export const GPSCapture = ({ 
  coordinates, 
  onCaptureGPS, 
  isCapturingLocation,
  showLocationDialog,
  setShowLocationDialog
}: GPSCaptureProps) => {
  return (
    <div className="space-y-2">
      <div className="flex gap-4 items-center">
        <Button 
          type="button"
          onClick={onCaptureGPS}
          className="flex items-center gap-2 bg-green-700 hover:bg-green-800 text-white font-bold"
          variant="secondary"
        >
          <Navigation className="h-4 w-4" />
          Capture GPS
        </Button>
        {coordinates.latitude && coordinates.longitude && (
          <span className="text-sm text-gray-600">
            ({coordinates.latitude.toFixed(6)}, {coordinates.longitude.toFixed(6)})
          </span>
        )}
      </div>

      <LocationDialog 
        showDialog={showLocationDialog}
        setShowDialog={setShowLocationDialog}
        isCapturing={isCapturingLocation}
      />
    </div>
  );
};
