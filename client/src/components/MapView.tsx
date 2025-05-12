import { useEffect, useState, useRef } from 'react';
import { Issue } from '@/types';
import { useQuery } from '@tanstack/react-query';
import { useGeolocation } from '@/hooks/useGeolocation';
import { X as XIcon, ArrowUp as ArrowUpIcon, MapPin as MapPinIcon, Calendar as CalendarIcon, Clock3 as Clock3Icon, MessageSquare as MessageSquareIcon, Heart, HeartOff, Loader2, RotateCw, Flame } from 'lucide-react';
import PullToRefresh from 'react-pull-to-refresh';
import MapFixed from '@/components/MapFixed';
import { formatDistanceToNow } from 'date-fns';
import { getIssueTypeById } from '@/data/issueTypes';
import { Button } from '@/components/ui/button';
import { generateDeviceId } from '@/lib/imageUtils';
import { queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import Icon from '@/components/Icon';

// Add window.google type for TypeScript
declare global {
  interface Window {
    google: any;
  }
}

interface MapViewProps {
  isOpen: boolean;
  onClose: () => void;
  onIssueClick: (issueId: number) => void;
  onRefresh?: () => Promise<any>;
}

interface SimpleMapProps {
  center: { lat: number; lng: number } | null;
  issues: Issue[];
  heatmapActive: boolean;
  onMarkerClick: (issueId: number) => void;
}

// Simple Map component with direct DOM manipulation
function SimpleMap({ center, issues, heatmapActive, onMarkerClick }: SimpleMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const markers = useRef<any[]>([]);
  const heatmap = useRef<any>(null);
  
  // Default to Pretoria central coordinates if user location not available
  const defaultCenter = { lat: -25.7461, lng: 28.1881 };
  
  // Initialize the map
  useEffect(() => {
    if (!mapRef.current) return;
    
    // Load Google Maps API
    const loadGoogleMaps = () => {
      // Check if already loaded
      if (window.google && window.google.maps) {
        initMap();
        return;
      }
      
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}&libraries=visualization`;
      script.async = true;
      script.defer = true;
      script.onload = initMap;
      document.head.appendChild(script);
    };
    
    // Initialize map after API loads
    const initMap = () => {
      // Create new map instance
      mapInstance.current = new window.google.maps.Map(mapRef.current!, {
        center: center || defaultCenter,
        zoom: 15,
        mapTypeControl: false,
        fullscreenControl: false,
        streetViewControl: false,
        zoomControl: true,
        styles: [
          {
            featureType: 'poi',
            elementType: 'labels',
            stylers: [{ visibility: 'off' }]
          },
          {
            featureType: 'transit',
            elementType: 'labels',
            stylers: [{ visibility: 'off' }]
          }
        ]
      });
      
      // Add markers
      addMarkers();
      
      // Add heatmap if needed
      if (heatmapActive) {
        createHeatmap();
      }
    };
    
    loadGoogleMaps();
    
    // Cleanup
    return () => {
      if (markers.current) {
        markers.current.forEach(marker => marker.setMap(null));
      }
      
      if (heatmap.current) {
        heatmap.current.setMap(null);
      }
    };
  }, []);
  
  // Update markers when issues change
  useEffect(() => {
    if (!mapInstance.current || !window.google) return;
    
    // Clear existing markers
    markers.current.forEach(marker => marker.setMap(null));
    markers.current = [];
    
    // Add markers for each issue
    issues.forEach(issue => {
      let iconUrl;
      
      // Set marker icon based on issue type
      switch (issue.type) {
        case 'pothole':
          iconUrl = 'https://maps.google.com/mapfiles/ms/icons/red-dot.png';
          break;
        case 'streetlight':
          iconUrl = 'https://maps.google.com/mapfiles/ms/icons/yellow-dot.png';
          break;
        case 'trafficlight':
          iconUrl = 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png';
          break;
        default:
          iconUrl = 'https://maps.google.com/mapfiles/ms/icons/purple-dot.png';
      }
      
      // Create marker
      const marker = new window.google.maps.Marker({
        position: { lat: issue.latitude, lng: issue.longitude },
        map: mapInstance.current,
        icon: iconUrl,
        title: issue.type
      });
      
      // Add click handler
      marker.addListener('click', () => onMarkerClick(issue.id));
      
      markers.current.push(marker);
    });
    
    // Update heatmap if active
    if (heatmap.current && heatmapActive) {
      const heatmapData = issues.map(issue => ({
        location: new window.google.maps.LatLng(issue.latitude, issue.longitude),
        weight: issue.upvotes + 1
      }));
      
      heatmap.current.setData(heatmapData);
    }
  }, [issues, onMarkerClick]);
  
  // Update center when it changes
  useEffect(() => {
    if (!mapInstance.current || !center) return;
    mapInstance.current.setCenter(center);
  }, [center]);
  
  // Toggle heatmap visibility
  useEffect(() => {
    if (!heatmap.current || !mapInstance.current) return;
    heatmap.current.setMap(heatmapActive ? mapInstance.current : null);
  }, [heatmapActive]);
  
  // Create heatmap helper
  const createHeatmap = () => {
    if (!mapInstance.current || !window.google || !window.google.maps.visualization) return;
    
    const heatmapData = issues.map(issue => ({
      location: new window.google.maps.LatLng(issue.latitude, issue.longitude),
      weight: issue.upvotes + 1
    }));
    
    heatmap.current = new window.google.maps.visualization.HeatmapLayer({
      data: heatmapData,
      map: heatmapActive ? mapInstance.current : null,
      radius: 50,
      opacity: 0.7
    });
  };
  
  // Add markers helper
  const addMarkers = () => {
    if (!mapInstance.current || !window.google) return;
    
    issues.forEach(issue => {
      const marker = new window.google.maps.Marker({
        position: { lat: issue.latitude, lng: issue.longitude },
        map: mapInstance.current,
        title: issue.type,
        icon: (() => {
          switch (issue.type) {
            case 'pothole': return 'https://maps.google.com/mapfiles/ms/icons/red-dot.png';
            case 'streetlight': return 'https://maps.google.com/mapfiles/ms/icons/yellow-dot.png';
            case 'trafficlight': return 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png';
            default: return 'https://maps.google.com/mapfiles/ms/icons/purple-dot.png';
          }
        })()
      });
      
      marker.addListener('click', () => onMarkerClick(issue.id));
      markers.current.push(marker);
    });
  };
  
  return <div ref={mapRef} className="w-full h-full rounded-lg" style={{ minHeight: '350px' }} />;
}

export default function MapView({ isOpen, onClose, onIssueClick, onRefresh = async () => {} }: MapViewProps) {
  const [heatmapActive, setHeatmapActive] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  const [isSupporting, setIsSupporting] = useState(false);
  const [isRevoking, setIsRevoking] = useState(false);
  const [deviceId, setDeviceId] = useState<string>('');
  const [hasSupported, setHasSupported] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
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
  const handleMarkerClick = async (issueId: number) => {
    const issue = issues.find(i => i.id === issueId);
    if (issue) {
      setSelectedIssue(issue);
      
      // Check if user has already supported this issue
      if (deviceId) {
        try {
          const response = await fetch(`/api/issues/${issueId}/support/${deviceId}`, {
            method: 'GET'
          });
          
          if (response.ok) {
            // User has already supported this issue
            setHasSupported(true);
          } else {
            // User has not supported this issue yet
            setHasSupported(false);
          }
        } catch (error) {
          console.error('Error checking support status:', error);
          setHasSupported(false);
        }
      }
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
      setHasSupported(true);
      
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
  
  // Handle revoke support button click
  const handleRevokeSupport = async () => {
    if (!selectedIssue || isRevoking) return;
    
    try {
      setIsRevoking(true);
      
      // Use fetch with DELETE method to revoke support
      const response = await fetch(`/api/issues/${selectedIssue.id}/support`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ deviceId })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to revoke support');
      }
      
      // Update the issue with the new upvote count
      queryClient.invalidateQueries({ queryKey: ['/api/issues'] });
      
      toast({
        title: "Support Revoked",
        description: "Your support has been withdrawn.",
      });
      
      // Update selected issue with new upvote count
      const updatedIssue = {...selectedIssue, upvotes: Math.max(0, selectedIssue.upvotes - 1)};
      setSelectedIssue(updatedIssue);
      setHasSupported(false);
      
    } catch (error) {
      console.error('Revoke support error:', error);
      toast({
        title: "Failed to Revoke Support",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive"
      });
    } finally {
      setIsRevoking(false);
    }
  };
  
  // Handle pull-to-refresh action
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      // Refresh data by invalidating the query cache
      await queryClient.invalidateQueries({ queryKey: ['/api/issues'] });
      await onRefresh();
      
      // Show a small toast notification
      toast({
        title: "Updated",
        description: "Issue data has been refreshed",
      });
    } catch (error) {
      console.error("Error refreshing data:", error);
      toast({
        title: "Refresh Failed",
        description: "Could not update the map data",
        variant: "destructive"
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div 
      className={`fixed inset-0 bg-white z-20 transform transition-transform duration-300 ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      }`}
    >
      <div className="absolute top-0 left-0 right-0 z-30 bg-gradient-to-b from-black/60 to-transparent p-4">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-xl text-white">Map</h2>
          <button 
            className="bg-white/20 hover:bg-white/40 backdrop-blur-sm text-white p-2 rounded-full transition-colors" 
            onClick={onClose}
            aria-label="Close map view"
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
            {heatmapActive ? 'Hide Heat' : 'Show Heat'}
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
                <div 
                  className="flex items-center px-3 py-1.5 rounded-full mr-3 text-white text-xs font-medium"
                  style={{backgroundColor: getBadgeColor(selectedIssue.type)}}
                >
                  <Icon name={selectedIssue.type} className="mr-1.5 h-3.5 w-3.5" />
                  {formatIssueType(selectedIssue.type)}
                </div>
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
                <p className="text-sm font-medium">Address</p>
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
                  <p className="text-sm font-medium">Notes</p>
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
          
          {/* Support/Revoke Button */}
          {!hasSupported ? (
            <Button
              onClick={handleSupportClick}
              className="w-full py-2 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700"
              disabled={isSupporting}
            >
              {isSupporting ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin border-2 border-white border-t-transparent rounded-full" />
                  Supporting...
                </>
              ) : (
                <>
                  <ArrowUpIcon className="mr-2 h-4 w-4" />
                  Support
                </>
              )}
            </Button>
          ) : (
            <Button
              onClick={handleRevokeSupport}
              className="w-full py-2 bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800"
              disabled={isRevoking}
            >
              {isRevoking ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin border-2 border-white border-t-transparent rounded-full" />
                  Revoking...
                </>
              ) : (
                <>
                  <ArrowUpIcon className="mr-2 h-4 w-4 transform rotate-180" />
                  Revoke Support
                </>
              )}
            </Button>
          )}
        </div>
      )}
      
      <div className="h-full w-full">
        <PullToRefresh
          onRefresh={handleRefresh}
          distanceToRefresh={80}
          resistance={2.5}
          pullingContent={
            <div className="refresh-box">
              <RotateCw className="h-6 w-6 text-orange-500" />
            </div>
          }
          refreshingContent={
            <div className="refresh-box">
              <RotateCw className="h-6 w-6 text-orange-500 animate-spin" />
            </div>
          }
        >
          <div className="w-full h-full relative" style={{ minHeight: '400px' }}>
            <MapFixed
              center={mapCenter} 
              issues={issues} 
              heatmapActive={heatmapActive} 
              onMarkerClick={handleMarkerClick} 
            />
          </div>
        </PullToRefresh>
      </div>
    </div>
  );
}