import { useEffect, useState } from 'react';
import { Issue } from '@/types';
import { useQuery } from '@tanstack/react-query';
import { useGeolocation } from '@/hooks/useGeolocation';
import { XIcon, ArrowUpIcon, MapPinIcon, CalendarIcon, Clock3Icon, MessageSquareIcon } from 'lucide-react';
import Map from '@/components/Map';
import { formatDistanceToNow } from 'date-fns';
import { getIssueTypeById } from '@/data/issueTypes';
import { Button } from '@/components/ui/button';
import { generateDeviceId } from '@/lib/imageUtils';
import { queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface MapViewProps {
  isOpen: boolean;
  onClose: () => void;
  onIssueClick: (issueId: number) => void;
}

export default function MapView({ isOpen, onClose, onIssueClick }: MapViewProps) {
  const [heatmapActive, setHeatmapActive] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  const [isSupporting, setIsSupporting] = useState(false);
  const [deviceId, setDeviceId] = useState<string>('');
  const { toast } = useToast();
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

  // Initialize device ID for supporting issues
  useEffect(() => {
    const id = localStorage.getItem('deviceId') || generateDeviceId();
    localStorage.setItem('deviceId', id);
    setDeviceId(id);
  }, []);

  // Handle marker click
  const handleMarkerClick = (issueId: number) => {
    const issue = issues.find(i => i.id === issueId);
    if (issue) {
      setSelectedIssue(issue);
    }
  };

  // Format issue type
  const formatIssueType = (type: string) => {
    const issueType = getIssueTypeById(type);
    if (issueType) {
      return issueType.name;
    }
    return type.charAt(0).toUpperCase() + type.slice(1).replace(/-/g, ' ');
  };

  // Get badge color
  const getBadgeColor = (type: string) => {
    const issueType = getIssueTypeById(type);
    if (issueType) {
      return issueType.color;
    }
    return '#6b7280'; // Default gray
  };

  // Handle support button click
  const handleSupportClick = async () => {
    if (!selectedIssue || isSupporting) return;
    
    try {
      setIsSupporting(true);
      
      // Use fetch instead of apiRequest to avoid type issues
      await fetch(`/api/issues/${selectedIssue.id}/support`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ deviceId })
      });
      
      // Update the issue with the new upvote count
      queryClient.invalidateQueries({ queryKey: ['/api/issues'] });
      
      toast({
        title: "Thank you!",
        description: "Your support has been recorded.",
      });
      
      // Update selected issue with new upvote count
      const updatedIssue = {...selectedIssue, upvotes: selectedIssue.upvotes + 1};
      setSelectedIssue(updatedIssue);
      
    } catch (error) {
      console.error('Support error:', error);
      toast({
        title: "Support Failed",
        description: "You may have already supported this issue.",
        variant: "destructive"
      });
    } finally {
      setIsSupporting(false);
    }
  };

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
            onClick={() => {
              setSelectedIssue(null);
              onClose();
            }}
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
      
      {/* Issue Details Panel */}
      {selectedIssue && (
        <div className="absolute bottom-0 left-0 right-0 z-10 bg-white rounded-t-xl shadow-lg p-4 max-h-[50vh] overflow-y-auto">
          <div className="w-12 h-1 bg-neutral-300 rounded-full mx-auto mb-4"></div>
          
          <div className="flex items-start mb-4">
            {selectedIssue.photoUrl ? (
              <div className="w-20 h-20 rounded-lg overflow-hidden mr-4 bg-gray-200">
                <img 
                  src={selectedIssue.photoUrl} 
                  alt={`${selectedIssue.type} issue`} 
                  className="w-full h-full object-cover" 
                  onError={(e) => {
                    // If image fails to load, replace with logo
                    e.currentTarget.src = '/logo-orange.png';
                    e.currentTarget.style.padding = '5px';
                    e.currentTarget.style.objectFit = 'contain';
                  }}
                />
              </div>
            ) : (
              <div className="w-20 h-20 rounded-lg flex items-center justify-center mr-4" 
                style={{backgroundColor: `${getBadgeColor(selectedIssue.type)}25`}}>
                <img 
                  src="/logo-orange.png" 
                  alt="Municipality Logo" 
                  className="h-10 w-auto" 
                  style={{opacity: 0.8}}
                />
              </div>
            )}
            
            <div className="flex-1">
              <div className="flex items-center mb-1">
                <span 
                  className="inline-block px-2 py-1 text-white text-xs rounded-full mr-2" 
                  style={{backgroundColor: getBadgeColor(selectedIssue.type)}}
                >
                  {formatIssueType(selectedIssue.type)}
                </span>
                <span className="text-xs text-gray-500">
                  {formatDistanceToNow(new Date(selectedIssue.createdAt), { addSuffix: true })}
                </span>
              </div>
              <h3 className="font-medium mb-2">{selectedIssue.address}</h3>
              
              <div className="flex items-center text-sm text-gray-600 mb-2">
                <ArrowUpIcon className="text-primary mr-1 h-4 w-4" />
                <span>{selectedIssue.upvotes} {selectedIssue.upvotes === 1 ? 'supporter' : 'supporters'}</span>
              </div>
            </div>
            
            <button 
              className="p-2 rounded-full"
              onClick={() => setSelectedIssue(null)}
            >
              <XIcon className="h-5 w-5 text-gray-400" />
            </button>
          </div>
          
          {/* Additional Details */}
          <div className="space-y-3 mb-4">
            <div className="flex items-start">
              <MapPinIcon className="h-5 w-5 text-neutral-500 mr-2 mt-0.5" />
              <div>
                <p className="text-sm font-medium">Location</p>
                <p className="text-sm text-neutral-600">{selectedIssue.address}</p>
                <p className="text-xs text-neutral-500">
                  {selectedIssue.latitude.toFixed(6)}, {selectedIssue.longitude.toFixed(6)}
                </p>
              </div>
            </div>
            
            {selectedIssue.notes && (
              <div className="flex items-start">
                <MessageSquareIcon className="h-5 w-5 text-neutral-500 mr-2 mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Additional Notes</p>
                  <p className="text-sm text-neutral-600">{selectedIssue.notes}</p>
                </div>
              </div>
            )}
            
            <div className="flex items-start">
              <CalendarIcon className="h-5 w-5 text-neutral-500 mr-2 mt-0.5" />
              <div>
                <p className="text-sm font-medium">Reported</p>
                <p className="text-sm text-neutral-600">
                  {new Date(selectedIssue.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
            
            <div className="flex items-start">
              <Clock3Icon className="h-5 w-5 text-neutral-500 mr-2 mt-0.5" />
              <div>
                <p className="text-sm font-medium">Status</p>
                <div className="flex items-center">
                  <span className="inline-block w-2 h-2 rounded-full bg-yellow-500 mr-1"></span>
                  <p className="text-sm text-neutral-600 capitalize">{selectedIssue.status}</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Support Button */}
          <Button
            onClick={handleSupportClick}
            className="w-full py-2"
            disabled={isSupporting}
          >
            <ArrowUpIcon className="mr-2 h-4 w-4" />
            {isSupporting ? 'Supporting...' : 'Support This Issue'}
          </Button>
        </div>
      )}
      
      <div className="h-full w-full">
        <Map 
          center={mapCenter} 
          issues={issues} 
          heatmapActive={heatmapActive} 
          onMarkerClick={handleMarkerClick} 
        />
      </div>
    </div>
  );
}