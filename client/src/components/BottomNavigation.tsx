import { Button } from '@/components/ui/button';
import { MapPinIcon, ListFilter, PlusIcon } from 'lucide-react';

interface BottomNavigationProps {
  onReportButtonClick: () => void;
  onMapButtonClick: () => void;
  onNearbyButtonClick: () => void;
}

export default function BottomNavigation({ 
  onReportButtonClick, 
  onMapButtonClick, 
  onNearbyButtonClick 
}: BottomNavigationProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white shadow-lg flex justify-around items-center h-16 z-10">
      <button 
        onClick={onMapButtonClick}
        className="flex flex-col items-center justify-center w-1/3 h-full text-secondary"
      >
        <MapPinIcon className="h-5 w-5" />
        <span className="text-xs mt-1">Map</span>
      </button>
      
      <div className="w-1/3 flex justify-center" style={{ marginTop: '-30px' }}>
        <Button
          onClick={onReportButtonClick}
          className="w-16 h-16 rounded-full bg-primary text-white flex items-center justify-center shadow-lg"
        >
          <PlusIcon className="h-6 w-6" />
        </Button>
      </div>
      
      <button
        onClick={onNearbyButtonClick}
        className="flex flex-col items-center justify-center w-1/3 h-full text-neutral-800"
      >
        <ListFilter className="h-5 w-5" />
        <span className="text-xs mt-1">Nearby</span>
      </button>
    </div>
  );
}
