import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useGeolocation } from '@/hooks/useGeolocation';
import { reverseGeocode } from '@/lib/geocode';
import Map from '@/components/Map';
import BottomNavigation from '@/components/BottomNavigation';
import ReportPanel from '@/components/ReportPanel';
import IssueDetailsPanel from '@/components/IssueDetailsPanel';
import NearbyIssuesPanel from '@/components/NearbyIssuesPanel';
import SuccessOverlay from '@/components/SuccessOverlay';
import LocationPermissionModal from '@/components/LocationPermissionModal';
import { Issue } from '@/types';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

export default function Home() {
  // State variables
  const [reportPanelActive, setReportPanelActive] = useState(false);
  const [issueDetailsPanelActive, setIssueDetailsPanelActive] = useState(false);
  const [nearbyIssuesPanelActive, setNearbyIssuesPanelActive] = useState(false);
  const [successOverlayActive, setSuccessOverlayActive] = useState(false);
  const [locationModalActive, setLocationModalActive] = useState(false);
  const [selectedIssueId, setSelectedIssueId] = useState<number | null>(null);
  const [heatmapActive, setHeatmapActive] = useState(false);
  const [address, setAddress] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState({
    title: 'Report Submitted!',
    message: 'Your report has been sent to the relevant authorities.'
  });
  const { toast } = useToast();

  // Get user's geolocation with enhanced permissions handling
  const geolocation = useGeolocation();

  // Show location permission modal on first load if permission is not granted
  useEffect(() => {
    if (geolocation.permissionStatus === 'prompt') {
      setLocationModalActive(true);
    } else if (geolocation.permissionStatus === 'denied') {
      toast({
        title: "Location Access Denied",
        description: "Please enable location access in your browser settings to use all features of Lokisa.",
        variant: "destructive",
      });
    }
  }, [geolocation.permissionStatus, toast]);

  // Handle requesting location permission
  const handleRequestLocationPermission = () => {
    setLocationModalActive(false);
    
    geolocation.requestLocationAccess()
      .then(() => {
        toast({
          title: "Location Access Granted",
          description: "Lokisa can now accurately identify the location of reported issues.",
        });
      })
      .catch((error) => {
        console.error("Location access error:", error);
        
        if (error.code === 1) { // PERMISSION_DENIED
          toast({
            title: "Location Access Denied",
            description: "Some features may not work correctly. You can enable location access in your browser settings.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Location Error",
            description: "Unable to get your location. Please try again later.",
            variant: "destructive",
          });
        }
      });
  };

  // Fetch issues data
  const { data: issues = [], isLoading, error } = useQuery<Issue[]>({
    queryKey: ['/api/issues'],
    enabled: !geolocation.loading && !!geolocation.latitude && !!geolocation.longitude,
  });

  // Get selected issue details
  const selectedIssue = selectedIssueId 
    ? issues.find((issue) => issue.id === selectedIssueId) || null
    : null;

  // Reverse geocode coordinates to get address
  useEffect(() => {
    if (geolocation.latitude && geolocation.longitude && !address) {
      reverseGeocode(geolocation.latitude, geolocation.longitude)
        .then(result => {
          setAddress(result.address);
        })
        .catch(error => {
          console.error("Geocoding error:", error);
          setAddress(`${geolocation.latitude?.toFixed(6)}, ${geolocation.longitude?.toFixed(6)}`);
        });
    }
  }, [geolocation.latitude, geolocation.longitude, address]);

  // Handle marker click
  const handleMarkerClick = (issueId: number) => {
    setSelectedIssueId(issueId);
    setIssueDetailsPanelActive(true);
    setNearbyIssuesPanelActive(false);
  };

  // Show success overlay
  const showSuccessOverlay = (title: string, message: string) => {
    setSuccessMessage({ title, message });
    setSuccessOverlayActive(true);
  };

  // Handle report success
  const handleReportSuccess = () => {
    showSuccessOverlay(
      'Report Submitted!',
      'Your report has been sent to the relevant authorities.'
    );
  };

  // Handle upvote success
  const handleUpvoteSuccess = () => {
    showSuccessOverlay(
      'Issue Upvoted!',
      'Thank you for confirming this issue. It helps prioritize repairs.'
    );
  };
  
  // Handle report button click with permission check
  const handleReportButtonClick = () => {
    // If location permission is not granted, show permission modal
    if (geolocation.permissionStatus !== 'granted') {
      setLocationModalActive(true);
      return;
    }
    
    setReportPanelActive(true);
  };

  return (
    <div className="relative h-screen overflow-hidden">
      {/* Map View */}
      <div className="map-container relative">
        <Map 
          center={
            geolocation.latitude && geolocation.longitude 
              ? { lat: geolocation.latitude, lng: geolocation.longitude } 
              : null
          }
          issues={issues}
          heatmapActive={heatmapActive}
          onMarkerClick={handleMarkerClick}
        />
        
        {/* Map Controls */}
        <div className="absolute top-4 left-4 right-4 flex justify-between items-center">
          <div className="bg-white shadow-md rounded-md p-2 flex items-center">
            <h1 className="font-bold text-lg text-primary">Lokisa</h1>
          </div>
          <div className="bg-white shadow-md rounded-md p-2 flex gap-2 items-center">
            <Label htmlFor="heatmap-toggle" className="mr-2 text-sm font-medium">Heatmap</Label>
            <Switch 
              id="heatmap-toggle" 
              checked={heatmapActive}
              onCheckedChange={setHeatmapActive}
            />
          </div>
        </div>
        
        {/* Loading indicator while getting location */}
        {geolocation.loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 z-10">
            <div className="bg-white p-4 rounded-lg shadow-lg">
              <p className="text-center">Getting your location...</p>
            </div>
          </div>
        )}
      </div>
      
      {/* Bottom Navigation */}
      <BottomNavigation 
        onReportButtonClick={handleReportButtonClick}
        onMapButtonClick={() => {
          setIssueDetailsPanelActive(false);
          setNearbyIssuesPanelActive(false);
        }}
        onNearbyButtonClick={() => setNearbyIssuesPanelActive(true)}
      />
      
      {/* Report Panel */}
      <ReportPanel 
        isOpen={reportPanelActive}
        onClose={() => setReportPanelActive(false)}
        onSuccess={handleReportSuccess}
        currentLocation={{
          latitude: geolocation.latitude,
          longitude: geolocation.longitude,
          address
        }}
      />
      
      {/* Issue Details Panel */}
      <IssueDetailsPanel 
        issue={selectedIssue}
        isOpen={issueDetailsPanelActive}
        onClose={() => setIssueDetailsPanelActive(false)}
        onSuccess={handleUpvoteSuccess}
      />
      
      {/* Nearby Issues Panel */}
      <NearbyIssuesPanel 
        issues={issues}
        isOpen={nearbyIssuesPanelActive}
        onClose={() => setNearbyIssuesPanelActive(false)}
        onIssueClick={handleMarkerClick}
      />
      
      {/* Success Overlay */}
      <SuccessOverlay 
        isOpen={successOverlayActive}
        onClose={() => setSuccessOverlayActive(false)}
        title={successMessage.title}
        message={successMessage.message}
      />
      
      {/* Location Permission Modal */}
      <LocationPermissionModal
        isOpen={locationModalActive}
        onClose={() => setLocationModalActive(false)}
        onRequestPermission={handleRequestLocationPermission}
      />
      
      {/* Display error if geolocation fails */}
      {geolocation.error && !geolocation.loading && (
        <div className="absolute bottom-20 left-4 right-4 bg-destructive text-white p-3 rounded-lg">
          <p>Location error: {geolocation.error}</p>
          <button 
            className="underline mt-1" 
            onClick={() => {
              if (geolocation.permissionStatus === 'denied') {
                toast({
                  title: "Location Permission Required",
                  description: "Please enable location services in your browser settings.",
                });
              } else {
                handleRequestLocationPermission();
              }
            }}
          >
            Try again
          </button>
        </div>
      )}
    </div>
  );
}
