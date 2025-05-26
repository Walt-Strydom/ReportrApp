import { useEffect, useState } from 'react';
import { Issue } from '@/types';
import { useQuery } from '@tanstack/react-query';
import { useGeolocation } from '@/hooks/useGeolocation';
import { XIcon, ArrowUpIcon, MapPinIcon, CalendarIcon, Clock3Icon, MessageSquareIcon, ThumbsUp, ThumbsDown, Loader2 } from 'lucide-react';
import Map from '@/components/Map';
import { formatDistanceToNow } from 'date-fns';
import { getIssueTypeById } from '@/data/issueTypes';
import { Button } from '@/components/ui/button';
import { generateDeviceId } from '@/lib/imageUtils';
import { queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import Icon from '@/components/Icon';

interface MapViewProps {
  isOpen: boolean;
  onClose: () => void;
  onIssueClick: (issueId: number) => void;
}

export default function MapView({ isOpen, onClose, onIssueClick }: MapViewProps) {
  const [heatmapActive, setHeatmapActive] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  const [isSupporting, setIsSupporting] = useState(false);
  const [isRevoking, setIsRevoking] = useState(false);
  const [deviceId, setDeviceId] = useState<string>('');
  const [hasSupported, setHasSupported] = useState(false);
  const { toast } = useToast();
  const geolocation = useGeolocation();
  
  // Get current location as center for map but only use it initially
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number } | null>(null);
  const [googleMap, setGoogleMap] = useState<any>(null);
  
  // Only use geolocation for initial centering when map first opens
  useEffect(() => {
    if (isOpen && geolocation.latitude && geolocation.longitude && !mapCenter) {
      setMapCenter({ lat: geolocation.latitude, lng: geolocation.longitude });
      console.log('Initial map center set:', { lat: geolocation.latitude, lng: geolocation.longitude });
    }
  }, [isOpen, geolocation.latitude, geolocation.longitude, mapCenter]);
  
  // Reset selected issue when map is closed
  useEffect(() => {
    if (!isOpen) {
      setSelectedIssue(null);
    }
  }, [isOpen]);
  
  // Fetch issues data
  const { data: issues = [] } = useQuery<Issue[]>({
    queryKey: ['/api/issues'],
    enabled: isOpen,
  });

  // Generate device ID on mount
  useEffect(() => {
    const id = generateDeviceId();
    setDeviceId(id);
  }, []);

  // Check if current device has already supported this issue
  useEffect(() => {
    if (selectedIssue && deviceId) {
      fetch(`/api/issues/${selectedIssue.id}/support/${deviceId}`)
        .then(res => res.json())
        .then(data => {
          setHasSupported(data.hasSupported);
        })
        .catch(err => {
          console.error('Error checking support status:', err);
          setHasSupported(false);
        });
    }
  }, [selectedIssue, deviceId]);

  const handleMarkerClick = (issue: Issue) => {
    setSelectedIssue(issue);
  };

  const handleSupportClick = async () => {
    if (!selectedIssue || !deviceId) return;
    
    setIsSupporting(true);
    try {
      const response = await fetch(`/api/issues/${selectedIssue.id}/support`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          deviceId: deviceId,
        }),
      });

      if (response.ok) {
        const updatedIssue = await response.json();
        
        // Update the selected issue
        setSelectedIssue(updatedIssue);
        setHasSupported(true);
        
        // Invalidate the issues cache to refresh the list
        await queryClient.invalidateQueries({ queryKey: ['/api/issues'] });
        
        toast({
          title: "Support Added!",
          description: "Your support has been recorded for this issue.",
        });
      } else {
        throw new Error('Failed to support issue');
      }
    } catch (error) {
      console.error('Error supporting issue:', error);
      toast({
        title: "Error",
        description: "Failed to support this issue. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSupporting(false);
    }
  };

  const handleRevokeSupport = async () => {
    if (!selectedIssue || !deviceId) return;
    
    setIsRevoking(true);
    try {
      const response = await fetch(`/api/issues/${selectedIssue.id}/support`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          deviceId: deviceId,
        }),
      });

      if (response.ok) {
        const updatedIssue = await response.json();
        
        // Update the selected issue
        setSelectedIssue(updatedIssue);
        setHasSupported(false);
        
        // Invalidate the issues cache to refresh the list
        await queryClient.invalidateQueries({ queryKey: ['/api/issues'] });
        
        toast({
          title: "Support Removed",
          description: "Your support has been revoked for this issue.",
        });
      } else {
        throw new Error('Failed to revoke support');
      }
    } catch (error) {
      console.error('Error revoking support:', error);
      toast({
        title: "Error",
        description: "Failed to revoke support. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsRevoking(false);
    }
  };

  return (
    <div 
      className={`fixed inset-0 bg-white z-20 transform transition-transform duration-300 ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      }`}
      style={{height: '100dvh'}}
    >
      {/* Mobile-optimized header with safe area */}
      <div 
        className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black/80 to-transparent"
        style={{paddingTop: 'max(16px, env(safe-area-inset-top))', paddingBottom: '16px', paddingLeft: '16px', paddingRight: '16px'}}
      >
        <div className="flex items-center justify-between" style={{marginTop: '24px'}}>
          <h2 className="font-bold text-xl text-white">Map</h2>
          <button 
            className="p-2 rounded-full bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 transition-colors"
            onClick={onClose}
            style={{minWidth: '44px', minHeight: '44px'}}
            aria-label="Close map"
          >
            <XIcon className="h-6 w-6" />
          </button>
        </div>
      </div>
      
      {/* Map Controls - positioned together on the left */}
      <div className="absolute top-32 left-4 z-10 flex flex-col gap-2">
        <button 
          className={`px-3 py-2 rounded-lg text-white text-sm font-medium shadow-lg ${
            heatmapActive ? 'bg-orange-500' : 'bg-black/70 backdrop-blur-sm'
          }`}
          onClick={() => setHeatmapActive(!heatmapActive)}
          style={{minWidth: '44px', minHeight: '44px'}}
        >
          {heatmapActive ? 'Hide Heat' : 'Show Heat'}
        </button>
        
        {/* Location Button - directly under Show Heat button */}
        {mapCenter && (
          <button 
            className="p-3 rounded-full bg-blue-600 text-white shadow-lg flex items-center justify-center touch-manipulation"
            onClick={() => {
              if (mapCenter && googleMap) {
                googleMap.panTo(mapCenter);
                googleMap.setZoom(15);
                toast({
                  title: "Location Reset",
                  description: "Map centered on your location",
                });
              }
            }}
            style={{minWidth: '44px', minHeight: '44px'}}
            aria-label="My Location"
          >
            <MapPinIcon className="h-5 w-5" />
          </button>
        )}
      </div>
      
      {/* Issue Details Panel - Mobile optimized with better support button visibility */}
      {selectedIssue && (
        <div 
          className="absolute bottom-0 left-0 right-0 z-10 bg-white rounded-t-xl shadow-lg"
          style={{
            paddingTop: '16px',
            paddingBottom: 'max(120px, env(safe-area-inset-bottom))',
            paddingLeft: '16px',
            paddingRight: '16px',
            maxHeight: '75vh',
            minHeight: '420px',
            overflowY: 'auto'
          }}
        >
          <div className="w-12 h-1 bg-neutral-300 rounded-full mx-auto mb-4"></div>
          
          <div className="flex items-start mb-4">
            {selectedIssue.photoUrl ? (
              <div className="w-20 h-20 rounded-lg overflow-hidden mr-4 bg-gray-200">
                <img 
                  src={selectedIssue.photoUrl} 
                  alt={`${selectedIssue.type} issue`} 
                  className="w-full h-full object-cover" 
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              </div>
            ) : (
              <div className="w-20 h-20 rounded-lg mr-4 bg-gray-100 flex items-center justify-center">
                <Icon name={selectedIssue.type} className="h-8 w-8 text-gray-400" />
              </div>
            )}
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center mb-2">
                <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium text-white ${getIssueTypeById(selectedIssue.type)?.color || 'bg-gray-500'}`}>
                  {getIssueTypeById(selectedIssue.type)?.name}
                </span>
              </div>
              
              <h3 className="font-semibold text-lg text-gray-900 mb-1 line-clamp-2">
                {getIssueTypeById(selectedIssue.type)?.name || 'Infrastructure Issue'}
              </h3>
              
              <p className="text-sm text-gray-600 mb-2 line-clamp-1">
                {selectedIssue.address}
              </p>
              
              <div className="flex items-center text-sm text-gray-500">
                <ArrowUpIcon className="h-4 w-4 mr-1" />
                <span className="font-medium">{selectedIssue.upvotes} supporters</span>
                <span className="mx-2">•</span>
                <span>
                  {selectedIssue.createdAt ? formatDistanceToNow(new Date(selectedIssue.createdAt), { addSuffix: true }) : 'Recently'}
                </span>
              </div>
            </div>
          </div>
          
          {selectedIssue.notes && (
            <div className="mb-4">
              <p className="text-sm text-gray-700 leading-relaxed">
                {selectedIssue.notes}
              </p>
            </div>
          )}
          
          <div className="grid grid-cols-3 gap-4 mb-4 p-3 bg-gray-50 rounded-lg">
            <div className="flex items-start">
              <ArrowUpIcon className="h-5 w-5 text-neutral-500 mr-2 mt-0.5" />
              <div>
                <p className="text-sm font-medium">Supporters</p>
                <p className="text-sm text-neutral-600">{selectedIssue.upvotes}</p>
              </div>
            </div>
            
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
          
          {/* Support Instructions */}
          <div className="mb-6 p-3 bg-yellow-50 rounded-lg border border-yellow-100 text-center">
            <p className="text-sm font-medium text-yellow-800">
              Tap the button below to support this issue
            </p>
          </div>
          
          {/* Support/Revoke Button with extra bottom spacing */}
          <div className="pb-4">
            {!hasSupported ? (
              <Button
                onClick={handleSupportClick}
                className="w-full py-4 rounded-lg font-medium bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white shadow-md text-lg"
                disabled={isSupporting}
              >
                {isSupporting ? (
                  <>
                    <div className="mr-2 h-6 w-6 animate-spin border-2 border-white border-t-transparent rounded-full" />
                    Supporting...
                  </>
                ) : (
                  <>
                    <ThumbsUp className="mr-2 h-6 w-6" />
                    <span className="tracking-wide">SUPPORT THIS ISSUE</span>
                  </>
                )}
              </Button>
            ) : (
              <Button
                onClick={handleRevokeSupport}
                className="w-full py-4 rounded-lg font-medium bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white shadow-md text-lg"
                disabled={isRevoking}
              >
                {isRevoking ? (
                  <>
                    <div className="mr-2 h-6 w-6 animate-spin border-2 border-white border-t-transparent rounded-full" />
                    Revoking...
                  </>
                ) : (
                  <>
                    <ThumbsDown className="mr-2 h-6 w-6" />
                    <span className="tracking-wide">REVOKE SUPPORT</span>
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      )}
      
      <div className="h-full w-full">
        <Map 
          center={mapCenter} 
          issues={issues}
          showHeatmap={heatmapActive}
          onMarkerClick={handleMarkerClick}
          onMapReady={setGoogleMap}
        />
      </div>
    </div>
  );
}