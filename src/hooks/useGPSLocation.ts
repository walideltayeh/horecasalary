
import { useState } from 'react';
import { toast } from 'sonner';

interface Coordinates {
  latitude: number | null;
  longitude: number | null;
}

export const useGPSLocation = () => {
  const [coordinates, setCoordinates] = useState<Coordinates>({
    latitude: null,
    longitude: null
  });
  const [isCapturingLocation, setIsCapturingLocation] = useState(false);
  const [showLocationDialog, setShowLocationDialog] = useState(false);

  const handleCaptureGPS = () => {
    if (!('geolocation' in navigator)) {
      toast.error('GPS is not supported on this device');
      return;
    }
    
    setIsCapturingLocation(true);
    setShowLocationDialog(true);
    
    const options = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0
    };

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoordinates({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        });
        setIsCapturingLocation(false);
        setShowLocationDialog(false);
        toast.success('GPS location captured successfully');
        console.log('Location captured:', position.coords);
      },
      (error) => {
        setIsCapturingLocation(false);
        setShowLocationDialog(false);
        console.error('Error getting location:', error);
        
        switch(error.code) {
          case 1:
            toast.error('Location access was denied. Please check your browser settings and enable location access.');
            break;
          case 2:
            toast.error('Unable to determine your location. Please try again or check your device settings.');
            break;
          case 3:
            toast.error('Location request timed out. Please try again.');
            break;
          default:
            toast.error('Failed to capture GPS location. Please ensure location access is enabled.');
        }
      },
      options
    );
  };

  return {
    coordinates,
    isCapturingLocation,
    showLocationDialog,
    setShowLocationDialog,
    handleCaptureGPS
  };
};
