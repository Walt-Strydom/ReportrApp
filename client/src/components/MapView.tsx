import { useEffect, useState } from 'react';
import { Issue } from '@/types';
import { useQuery } from '@tanstack/react-query';
import { useGeolocation } from '@/hooks/useGeolocation';
import { XIcon } from 'lucide-react';
import Map from '@/components/Map';

interface MapViewProps {
  isOpen: boolean;
  onClose: () => void;
  onIssueClick: (issueId: number) => void;
}

export default function MapView({ isOpen, onClose, onIssueClick }: MapViewProps) {
  const [heatmapActive, setHeatmapActive] = useState(false);
  const geolocation = useGeolocation();
  
  // Get current location as center for map
  const mapCenter = geolocation.latitude && geolocation.longitude
    ? { lat: geolocation.latitude, lng: geolocation.longitude }
    : null;
  
  // Fetch issues data
  const { data: issues = [] } = useQuery<Issue[]>({
    queryKey: ['/api/issues'],
    enabled: isOpen, // Only fetch when map is open
  });

  return (
    <div 
      className={`fixed inset-0 bg-white z-20 transform transition-transform duration-300 ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      }`}
    >
      <div className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black/60 to-transparent p-4">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-xl text-white">Issues Map</h2>
          <button 
            className="bg-white/20 backdrop-blur-sm text-white p-2 rounded-full" 
            onClick={onClose}
          >
            <XIcon className="h-6 w-6" />
          </button>
        </div>
      </div>
      
      <div className="absolute bottom-4 left-4 z-10">
        <div className="flex flex-col gap-2">
          <button 
            className={`px-4 py-2 rounded-lg text-white text-sm font-medium ${
              heatmapActive ? 'bg-primary' : 'bg-black/50 backdrop-blur-sm'
            }`}
            onClick={() => setHeatmapActive(!heatmapActive)}
          >
            {heatmapActive ? 'Hide Heatmap' : 'Show Heatmap'}
          </button>
        </div>
      </div>
      
      <div className="h-full w-full">
        <Map 
          center={mapCenter} 
          issues={issues} 
          heatmapActive={heatmapActive} 
          onMarkerClick={onIssueClick} 
        />
      </div>
    </div>
  );
}