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
import { Issue } from '@/types';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

export default function Home() {
  // State variables
  const [reportPanelActive, setReportPanelActive] = useState(false);
  const [issueDetailsPanelActive, setIssueDetailsPanelActive] = useState(false);
  const [nearbyIssuesPanelActive, setNearbyIssuesPanelActive] = useState(false);
  const [successOverlayActive, setSuccessOverlayActive] = useState(false);
  const [selectedIssueId, setSelectedIssueId] = useState<number | null>(null);
  const [heatmapActive, setHeatmapActive] = useState(false);
  const [address, setAddress] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState({
    title: 'Report Submitted!',
    message: 'Your report has been sent to the relevant authorities.'
  });

  // Get user's geolocation
  const geolocation = useGeolocation();

  // Fetch issues data
  const { data: issues = [], isLoading, error } = useQuery({
    queryKey: ['/api/issues'],
    enabled: !geolocation.loading && !!geolocation.latitude && !!geolocation.longitude,
  });

  // Get selected issue details
  const selectedIssue = selectedIssueId 
    ? issues.find((issue: Issue) => issue.id === selectedIssueId) || null
    : null;

  // Reverse geocode coordinates to get address
  useEffect(() => {
    if (geolocation.latitude && geolocation.longitude && !address) {
      reverseGeocode(geolocation.latitude, geolocation.longitude)
        .then(result => {
          setAddress(result.address);
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
        onReportButtonClick={() => setReportPanelActive(true)}
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
    </div>
  );
}
