
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ImageIcon, X } from 'lucide-react';
import { toast } from 'sonner';
import { AspectRatio } from "@/components/ui/aspect-ratio";

interface PhotoUploadProps {
  onPhotoChange: (photoUrl: string) => void;
  initialUrl?: string;
}

export const PhotoUpload: React.FC<PhotoUploadProps> = ({ onPhotoChange, initialUrl = '' }) => {
  const [photoUrl, setPhotoUrl] = useState(initialUrl);
  const [uploading, setUploading] = useState(false);

  // Update local state when initialUrl changes (e.g., when editing an existing cafe)
  useEffect(() => {
    setPhotoUrl(initialUrl);
  }, [initialUrl]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) { // 5MB
      toast.error("File size must be less than 5MB");
      return;
    }

    if (!file.type.startsWith('image/')) {
      toast.error("Only image files are allowed");
      return;
    }

    setUploading(true);
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      setPhotoUrl(base64String);
      onPhotoChange(base64String);
      setUploading(false);
    };
    reader.onerror = () => {
      toast.error("Error reading the file");
      setUploading(false);
    };
    reader.readAsDataURL(file);
  };

  const clearPhoto = () => {
    setPhotoUrl('');
    onPhotoChange('');
  };

  return (
    <div className="space-y-2">
      <Label>Cafe Photo</Label>
      <div className="flex flex-col gap-2">
        {photoUrl ? (
          <div className="relative w-full">
            <AspectRatio ratio={16 / 9} className="overflow-hidden rounded-md border border-gray-200">
              <img 
                src={photoUrl} 
                alt="Cafe" 
                className="w-full h-full object-cover" 
              />
            </AspectRatio>
            <Button
              type="button"
              variant="destructive"
              className="absolute top-2 right-2 h-8 w-8 p-0"
              onClick={clearPhoto}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div className="border border-gray-300 rounded-md py-8 px-4 flex flex-col items-center justify-center gap-2 bg-gray-50">
            <ImageIcon className="h-12 w-12 text-gray-300" />
            <Label
              htmlFor="photo-upload"
              className="cursor-pointer text-center text-sm font-medium text-blue-600 hover:text-blue-800"
            >
              {uploading ? "Uploading..." : "Upload photo"}
            </Label>
            <input
              id="photo-upload"
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={handleFileChange}
              disabled={uploading}
            />
            <p className="text-xs text-gray-500">
              Upload a cafe photo (max 5MB)
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
