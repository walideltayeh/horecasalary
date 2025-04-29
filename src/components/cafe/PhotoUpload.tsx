
import React, { useState, useCallback, useEffect } from 'react';
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ImageIcon } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { toast } from 'sonner';

interface PhotoUploadProps {
  onPhotoChange: (photoUrl: string) => void;
  initialUrl?: string;
}

export const PhotoUpload: React.FC<PhotoUploadProps> = ({ onPhotoChange, initialUrl = '' }) => {
  const [photoPreview, setPhotoPreview] = useState<string>(initialUrl);
  const [uploading, setUploading] = useState(false);
  
  // Set initial photo preview if provided
  useEffect(() => {
    if (initialUrl) {
      setPhotoPreview(initialUrl);
    }
  }, [initialUrl]);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    
    if (!file) {
      toast.error("No file selected");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size should be less than 5MB");
      return;
    }

    setUploading(true);
    
    try {
      const reader = new FileReader();
      reader.onload = (event: any) => {
        setPhotoPreview(event.target.result);
        onPhotoChange(event.target.result);
      };
      reader.readAsDataURL(file);
      toast.success("Photo uploaded successfully!");
    } catch (error) {
      console.error("Error uploading photo:", error);
      toast.error("Failed to upload photo");
    } finally {
      setUploading(false);
    }
  }, [onPhotoChange]);

  const {getRootProps, getInputProps, isDragActive} = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif']
    },
    maxFiles: 1
  });

  return (
    <div>
      <div
        {...getRootProps()}
        className={`relative border-2 border-dashed rounded-md p-4 ${isDragActive ? 'border-custom-red' : 'border-gray-300'} transition-colors duration-200`}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center justify-center">
          <ImageIcon className="h-6 w-6 text-gray-500 mb-2" />
          <p className="text-sm text-gray-500">
            {isDragActive ? "Drop the image here..." : "Drag 'n' drop an image here, or click to select files"}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            (Only *.jpeg, *.jpg, *.png and *.gif images will be accepted)
          </p>
        </div>
        {uploading && (
          <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center bg-gray-100 bg-opacity-50 rounded-md">
            <p>Uploading...</p>
          </div>
        )}
      </div>
      {photoPreview && (
        <div className="mt-4">
          <Label>Photo Preview:</Label>
          <img src={photoPreview} alt="Cafe Preview" className="mt-2 rounded-md max-h-48 object-cover" />
        </div>
      )}
    </div>
  );
};
