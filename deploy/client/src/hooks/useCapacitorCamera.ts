import { useState } from 'react';
import { dataURLtoFile } from '@/lib/imageUtils';

// Interface for camera options
interface CameraOptions {
  quality?: number;
  allowEditing?: boolean;
  resultType?: 'base64' | 'uri';
  saveToGallery?: boolean;
}

// Return type for the hook
interface UseCapacitorCameraResult {
  takePicture: (options?: CameraOptions) => Promise<File | null>;
  isLoading: boolean;
  error: string | null;
  isCapacitorAvailable: boolean;
}

export function useCapacitorCamera(): UseCapacitorCameraResult {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Check if Capacitor is available
  const isCapacitorAvailable = window.hasOwnProperty('Capacitor');

  const takePicture = async (options: CameraOptions = {}): Promise<File | null> => {
    setIsLoading(true);
    setError(null);
    
    try {
      // If Capacitor is available, use the native camera
      if (isCapacitorAvailable) {
        try {
          // @ts-ignore - Camera will be available at runtime in Capacitor environment
          const { Camera } = window.Capacitor.Plugins;
          
          // Default camera options
          const cameraOptions = {
            quality: options.quality || 90,
            allowEditing: options.allowEditing !== undefined ? options.allowEditing : true,
            resultType: options.resultType || 'base64',
            saveToGallery: options.saveToGallery !== undefined ? options.saveToGallery : false
          };
          
          // Take the picture
          const image = await Camera.getPhoto(cameraOptions);
          
          // Convert to File object
          if (image.base64String) {
            const imageName = `photo_${new Date().getTime()}.jpeg`;
            const imageFile = dataURLtoFile(`data:image/jpeg;base64,${image.base64String}`, imageName);
            setIsLoading(false);
            return imageFile;
          } else {
            throw new Error('Failed to get base64 string from camera');
          }
        } catch (capacitorError: any) {
          // If user denied permission or cancelled, don't show as error
          if (capacitorError.message && 
              (capacitorError.message.includes('User denied') || 
               capacitorError.message.includes('User cancelled'))) {
            setIsLoading(false);
            return null;
          }
          
          throw capacitorError;
        }
      } else {
        // Fallback to web file input for browsers
        return null;
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to take picture';
      setError(errorMessage);
      console.error('Camera error:', err);
      setIsLoading(false);
      return null;
    }
  };

  return {
    takePicture,
    isLoading,
    error,
    isCapacitorAvailable
  };
}