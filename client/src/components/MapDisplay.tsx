import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useGeolocation } from '@/hooks/useGeolocation';
import { X as XIcon, Flame } from 'lucide-react';
import { Issue } from '@/types';
import GoogleMap from './GoogleMap';
import PullToRefresh from 'react-pull-to-refresh';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow } from 'date-fns';
import { getIssueTypeById } from '@/data/issueTypes';
import Icon from '@/components/Icon';

interface MapDisplayProps {
  isOpen: boolean;
  onClose: () => void;
  onIssueClick: (issueId: number) => void;
  onRefresh?: () => Promise<any>;
}

export default function MapDisplay({ 
  isOpen, 
  onClose, 
  onIssueClick, 
  onRefresh = async () => {} 
}: MapDisplayProps) {
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  
  // Get user's current location
  const geolocation = useGeolocation();
  const mapCenter = geolocation.latitude && geolocation.longitude 
    ? { lat: geolocation.latitude, lng: geolocation.longitude } 
    : null;
  
  // Fetch all issues
  const { data: issues = [], isLoading, refetch } = useQuery<Issue[]>({
    queryKey: ['/api/issues'],
    enabled: isOpen
  });
  
  // Close issue details when map view is closed
  useEffect(() => {
    if (!isOpen) {
      setSelectedIssue(null);
    }
  }, [isOpen]);
  
  // Handler for clicking a marker on the map
  const handleMarkerClick = (issueId: number) => {
    console.log('Issue clicked:', issueId);
    const issue = issues.find((i: Issue) => i.id === issueId);
    if (issue) {
      setSelectedIssue(issue);
    }
  };
  
  // Handler for pull-to-refresh
  const handleRefresh = async () => {
    await refetch();
    await onRefresh();
    return Promise.resolve();
  };
  
  // Handler for clicking "View Details" button
  const handleViewDetails = () => {
    if (selectedIssue) {
      onIssueClick(selectedIssue.id);
      onClose();
    }
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col">
      {/* Header */}
      <div className="bg-orange-500 py-3 px-4 flex justify-between items-center shadow-md">
        <h2 className="text-xl font-semibold text-white">Map View</h2>
        <button 
          onClick={onClose}
          className="p-1 rounded-full hover:bg-orange-600 transition-colors"
          aria-label="Close"
        >
          <XIcon className="h-6 w-6 text-white" />
        </button>
      </div>
      
      {/* Map Container with Pull to Refresh */}
      <div className="flex-grow overflow-hidden relative">
        <PullToRefresh
          onRefresh={handleRefresh}
          pullingContent={
            <div className="refresh-box">
              <Flame className="h-6 w-6 text-orange-500" />
            </div>
          }
          refreshingContent={
            <div className="refresh-box">
              <Flame className="h-6 w-6 text-orange-500 animate-spin" />
            </div>
          }
        >
          {/* Map */}
          <div className="relative w-full h-full" style={{ minHeight: '400px' }}>
            <GoogleMap
              center={mapCenter}
              issues={issues}
              onMarkerClick={handleMarkerClick}
            />
            
            {/* Selected Issue Overlay */}
            {selectedIssue && (
              <div className="absolute bottom-0 left-0 right-0 mx-4 mb-4 bg-white rounded-lg shadow-lg overflow-hidden">
                <div className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="bg-orange-100 p-2 rounded-full">
                        <Icon
                          name={getIssueTypeById(selectedIssue.type)?.icon || 'circle'}
                          className="h-6 w-6 text-orange-500"
                        />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {getIssueTypeById(selectedIssue.type)?.name || selectedIssue.type}
                        </h3>
                        <p className="text-sm text-gray-500">{selectedIssue.address}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedIssue(null)}
                      className="text-gray-500 hover:text-gray-700"
                      aria-label="Close issue details"
                    >
                      <XIcon className="h-5 w-5" />
                    </button>
                  </div>
                  
                  <div className="mt-3 space-y-2">
                    <div className="flex items-center text-sm text-gray-500">
                      <Flame className="h-4 w-4 mr-1 text-orange-500" />
                      <span>{selectedIssue.upvotes} supporters</span>
                    </div>
                    
                    {selectedIssue.notes && (
                      <p className="text-sm text-gray-700 mt-2">{selectedIssue.notes}</p>
                    )}
                    
                    <div className="text-xs text-gray-500">
                      Reported {formatDistanceToNow(new Date(selectedIssue.createdAt), { addSuffix: true })}
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <Button
                      onClick={handleViewDetails}
                      className="w-full bg-orange-500 hover:bg-orange-600 text-white"
                    >
                      View Full Details
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </PullToRefresh>
      </div>
    </div>
  );
}