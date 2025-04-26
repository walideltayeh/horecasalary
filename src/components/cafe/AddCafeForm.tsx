import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useAuth } from '@/contexts/AuthContext';
import { mexicoLocations } from '@/data/mexicoLocations';
import { toast } from 'sonner';
import { PhotoUpload } from './PhotoUpload';
import { GPSCapture } from './GPSCapture';
import { useGPSLocation } from '@/hooks/useGPSLocation';

interface AddCafeFormProps {
  onCafeAdded: (cafeId: string, cafeData: any) => void;
}

const AddCafeForm: React.FC<AddCafeFormProps> = ({ onCafeAdded }) => {
  const { user } = useAuth();
  const { 
    coordinates, 
    isCapturingLocation, 
    showLocationDialog, 
    setShowLocationDialog, 
    handleCaptureGPS 
  } = useGPSLocation();
  
  const [formState, setFormState] = useState({
    name: '',
    ownerName: '',
    ownerNumber: '',
    numberOfHookahs: 0,
    numberOfTables: 0,
    status: 'Pending',
    photoUrl: '',
    governorate: '',
    city: '',
  });
  
  const [availableCities, setAvailableCities] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (formState.governorate) {
      const selectedLocation = mexicoLocations.find(
        location => location.governorate === formState.governorate
      );
      
      if (selectedLocation) {
        setAvailableCities(selectedLocation.cities);
        setFormState(prev => ({ ...prev, city: '' }));
      } else {
        setAvailableCities([]);
      }
    } else {
      setAvailableCities([]);
    }
  }, [formState.governorate]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'number') {
      setFormState(prev => ({ ...prev, [name]: value === '' ? 0 : Number(value) }));
    } else {
      setFormState(prev => ({ ...prev, [name]: value }));
    }
  };
  
  const handleSelectChange = (name: string, value: string) => {
    setFormState(prev => ({ ...prev, [name]: value }));
  };

  const handlePhotoChange = (photoUrl: string) => {
    setFormState(prev => ({ ...prev, photoUrl }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (
      !formState.name || 
      !formState.ownerName || 
      !formState.ownerNumber || 
      !formState.governorate || 
      !formState.city
    ) {
      toast.error("Please fill in all required fields");
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      const cafeData = {
        name: formState.name,
        ownerName: formState.ownerName,
        ownerNumber: formState.ownerNumber,
        numberOfHookahs: formState.numberOfHookahs,
        numberOfTables: formState.numberOfTables,
        status: formState.status as 'Pending' | 'Visited' | 'Contracted',
        photoUrl: formState.photoUrl,
        governorate: formState.governorate,
        city: formState.city,
        createdBy: user?.id || 'unknown',
        latitude: coordinates.latitude,
        longitude: coordinates.longitude
      };
      
      const tempId = `temp-${Date.now()}`;
      console.log("Submitting cafe with data:", cafeData);
      
      onCafeAdded(tempId, cafeData);
      resetForm();
    } catch (error: any) {
      console.error('Error in form submission:', error);
      toast.error(error.message || 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormState({
      name: '',
      ownerName: '',
      ownerNumber: '',
      numberOfHookahs: 0,
      numberOfTables: 0,
      status: 'Pending',
      photoUrl: '',
      governorate: '',
      city: '',
    });
  };

  const shouldShowBrandSurvey = formState.numberOfHookahs > 0;

  const getCafeSize = (numberOfHookahs: number): string => {
    if (numberOfHookahs === 0) return 'In Negotiation';
    if (numberOfHookahs >= 1 && numberOfHookahs <= 3) return 'Small';
    if (numberOfHookahs >= 4 && numberOfHookahs <= 7) return 'Medium';
    return 'Large';
  };

  const cafeSize = getCafeSize(formState.numberOfHookahs);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add New Cafe</CardTitle>
        <CardDescription>Enter cafe details to add to your database</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="name">Name of Cafe</Label>
              <Input 
                id="name" 
                name="name"
                value={formState.name}
                onChange={handleInputChange}
                placeholder="Enter cafe name" 
                className="input-with-red-outline"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="ownerName">Owner's Name</Label>
              <Input 
                id="ownerName" 
                name="ownerName"
                value={formState.ownerName}
                onChange={handleInputChange}
                placeholder="Enter owner's name" 
                className="input-with-red-outline"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="ownerNumber">Owner's Phone Number</Label>
              <Input 
                id="ownerNumber" 
                name="ownerNumber"
                value={formState.ownerNumber}
                onChange={handleInputChange}
                placeholder="Enter owner's phone number" 
                className="input-with-red-outline"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select 
                value={formState.status} 
                onValueChange={(value) => handleSelectChange('status', value)}
              >
                <SelectTrigger id="status" className="input-with-red-outline">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="Visited">Visited</SelectItem>
                  <SelectItem value="Contracted">Contracted</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="numberOfHookahs">Number of Hookahs</Label>
              <Input 
                id="numberOfHookahs" 
                name="numberOfHookahs"
                type="number"
                min="0"
                value={formState.numberOfHookahs}
                onChange={handleInputChange}
                className="input-with-red-outline"
              />
              <div className="mt-2">
                <div>Current Size: <span className="cafe-size-value">{cafeSize}</span></div>
                <div className="cafe-size-legend">
                  1-3 hookahs: Small | 4-7 hookahs: Medium | 7+ hookahs: Large | 0 hookahs: In Negotiation
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="numberOfTables">Number of Tables</Label>
              <Input 
                id="numberOfTables" 
                name="numberOfTables"
                type="number"
                min="0"
                value={formState.numberOfTables}
                onChange={handleInputChange}
                className="input-with-red-outline"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="governorate">Governorate</Label>
              <Select 
                value={formState.governorate} 
                onValueChange={(value) => handleSelectChange('governorate', value)}
              >
                <SelectTrigger id="governorate" className="input-with-red-outline">
                  <SelectValue placeholder="Select governorate" />
                </SelectTrigger>
                <SelectContent>
                  {mexicoLocations.map((location) => (
                    <SelectItem key={location.governorate} value={location.governorate}>
                      {location.governorate}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Select 
                value={formState.city} 
                onValueChange={(value) => handleSelectChange('city', value)}
                disabled={availableCities.length === 0}
              >
                <SelectTrigger id="city" className="input-with-red-outline">
                  <SelectValue placeholder={availableCities.length ? "Select city" : "Select governorate first"} />
                </SelectTrigger>
                <SelectContent>
                  {availableCities.map((city) => (
                    <SelectItem key={city} value={city}>
                      {city}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <PhotoUpload onPhotoChange={handlePhotoChange} />

          <GPSCapture 
            coordinates={coordinates}
            onCaptureGPS={handleCaptureGPS}
            isCapturingLocation={isCapturingLocation}
            showLocationDialog={showLocationDialog}
            setShowLocationDialog={setShowLocationDialog}
          />
        </CardContent>
        <CardFooter>
          <Button 
            type="submit" 
            className="w-full bg-custom-red hover:bg-red-700"
            disabled={isSubmitting || !shouldShowBrandSurvey}
          >
            {isSubmitting ? "Processing..." : "Continue to Brand Survey"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
};

export default AddCafeForm;
