
import { useState } from 'react';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Camera } from 'lucide-react';

interface PhotoUploadProps {
  onPhotoChange: (photoUrl: string) => void;
}

export const PhotoUpload = ({ onPhotoChange }: PhotoUploadProps) => {
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        setPhotoPreview(result);
        onPhotoChange(result);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
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
  );
};
