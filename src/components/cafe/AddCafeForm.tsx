import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Camera } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { mexicoLocations } from '@/data/mexicoLocations';
import { toast } from 'sonner';
import { useData } from '@/contexts/DataContext';
import { Navigation } from 'lucide-react';

interface AddCafeFormProps {
  onCafeAdded: (cafeId: string, cafeData: any) => void;
}

const AddCafeForm: React.FC<AddCafeFormProps> = ({ onCafeAdded }) => {
  const { getCafeSize } = useData();
  const { user } = useAuth();
  
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
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [coordinates, setCoordinates] = useState<{latitude: number | null, longitude: number | null}>({
    latitude: null,
    longitude: null
  });

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

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setPhotoPreview(reader.result as string);
        setFormState(prev => ({ ...prev, photoUrl: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCaptureGPS = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCoordinates({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
          toast.success('GPS location captured successfully');
        },
        (error) => {
          console.error('Error getting location:', error);
          toast.error('Failed to capture GPS location. Please ensure location access is enabled.');
        }
      );
    } else {
      toast.error('GPS is not supported on this device');
    }
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
        owner_name: formState.ownerName,
        owner_number: formState.ownerNumber,
        number_of_hookahs: formState.numberOfHookahs,
        number_of_tables: formState.numberOfTables,
        status: formState.status as 'Pending' | 'Visited' | 'Contracted',
        photo_url: formState.photoUrl,
        governorate: formState.governorate,
        city: formState.city,
        created_by: user?.id || 'unknown',
        latitude: coordinates.latitude,
        longitude: coordinates.longitude
      };
      
      const tempId = `temp-${Date.now()}`;
      
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
    setPhotoPreview(null);
  };

  const cafeSize = getCafeSize(formState.numberOfHookahs);
  const shouldShowBrandSurvey = formState.numberOfHookahs > 0;

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

          <div className="space-y-2">
            <Label htmlFor="photo">Cafe Photo</Label>
            <div className="flex items-center">
              <Label 
                htmlFor="photo" 
                className="flex items-center justify-center h-10 px-4 border border-custom-red rounded-md cursor-pointer hover:bg-gray-100"
              >
                <Camera className="mr-2 h-5 w-5" />
                <span>Choose Photo</span>
              </Label>
              <Input 
                id="photo" 
                type="file" 
                accept="image/*" 
                onChange={handlePhotoChange}
                className="hidden" 
              />
            </div>
            
            {photoPreview && (
              <div className="mt-2">
                <div className="w-full h-40 bg-gray-100 rounded-md overflow-hidden">
                  <img 
                    src={photoPreview} 
                    alt="Cafe preview" 
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label>GPS Location</Label>
            <div className="flex gap-4 items-center">
              <Button 
                type="button"
                onClick={handleCaptureGPS}
                className="flex items-center gap-2"
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
          </div>
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
