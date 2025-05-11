import React from 'react';
import { Button } from '@/components/ui/button';
import { XIcon, MapPinIcon } from 'lucide-react';

interface LocationPermissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRequestPermission: () => void;
}

export default function LocationPermissionModal({ 
  isOpen, 
  onClose,
  onRequestPermission
}: LocationPermissionModalProps) {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-5/6 max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-bold text-xl">Location Access</h2>
          <button className="text-neutral-800" onClick={onClose}>
            <XIcon className="h-5 w-5" />
          </button>
        </div>
        
        <div className="mb-6">
          <div className="w-16 h-16 rounded-full bg-primary-50 flex items-center justify-center mx-auto mb-4">
            <MapPinIcon className="h-8 w-8 text-primary" />
          </div>
          
          <p className="text-neutral-800 mb-4">
            Lokisa needs access to your location to:
          </p>
          
          <ul className="list-disc pl-5 mb-4 text-neutral-700">
            <li>Accurately pinpoint infrastructure issues</li>
            <li>Show your current location on the map</li>
            <li>Find nearby reported issues</li>
          </ul>
          
          <p className="text-sm text-neutral-600 mb-4">
            Your location information is only used for reporting issues and is not stored or shared with third parties.
          </p>
        </div>
        
        <div className="flex gap-3">
          <Button
            variant="outline"
            className="flex-1 border border-neutral-300 text-neutral-800 py-3 rounded-lg font-medium"
            onClick={onClose}
          >
            Not Now
          </Button>
          
          <Button
            className="flex-1 bg-primary text-white py-3 rounded-lg font-medium"
            onClick={onRequestPermission}
          >
            Allow Location
          </Button>
        </div>
      </div>
    </div>
  );
}