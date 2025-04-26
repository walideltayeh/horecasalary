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
    if (!navigator || !('geolocation' in navigator)) {
      toast.error('GPS is not supported on this device');
      return;
    }
    
    setIsCapturingLocation(true);
    setShowLocationDialog(true);
    
    const options = {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 0
    };

    navigator.geolocation.getCurrentPosition(
      (position) => {
        console.log('Location captured successfully:', position.coords);
        setCoordinates({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        });
        setIsCapturingLocation(false);
        
        setTimeout(() => {
          setShowLocationDialog(false);
          toast.success('GPS location captured successfully');
        }, 500);
      },
      (error) => {
        console.error('Error getting location:', error);
        setIsCapturingLocation(false);
        
        switch(error.code) {
          case 1:
            toast.error('Location access was denied. Please check your browser settings and enable location access.');
            break;
          case 2:
            toast.error('Unable to determine your location. Please try again or check your device settings.');
            break;
          case 3:
            toast.error('Location request timed out. Please try again in an area with better GPS signal.');
            break;
          default:
            toast.error('Failed to capture GPS location. Please ensure location access is enabled.');
        }
        
        // Keep the dialog open so user can read the error
        // They can close it manually
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
