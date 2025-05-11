import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useGeolocation } from '@/hooks/useGeolocation';
import { reverseGeocode } from '@/lib/geocode';
import Map from '@/components/Map';
import ReportPanel from '@/components/ReportPanel';
import SuccessOverlay from '@/components/SuccessOverlay';
import LocationPermissionModal from '@/components/LocationPermissionModal';
import { Issue } from '@/types';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

export default function CreatePage() {
  const { t } = useTranslation();
  
  // State variables
  const [reportPanelActive, setReportPanelActive] = useState(true);
  const [successOverlayActive, setSuccessOverlayActive] = useState(false);
  const [locationModalActive, setLocationModalActive] = useState(false);
  const [address, setAddress] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState({
    title: t('success.report.title'),
    message: t('success.report.message')
  });
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  // Get user's geolocation with enhanced permissions handling
  const geolocation = useGeolocation();

  // Show location permission modal on first load if permission is not granted
  useEffect(() => {
    if (geolocation.permissionStatus === 'prompt') {
      setLocationModalActive(true);
    } else if (geolocation.permissionStatus === 'denied') {
      toast({
        title: t('errors.location.denied'),
        description: t('errors.location.deniedDesc'),
        variant: "destructive",
      });
    }
  }, [geolocation.permissionStatus, toast, t]);

  // Handle requesting location permission
  const handleRequestLocationPermission = () => {
    setLocationModalActive(false);
    
    geolocation.requestLocationAccess()
      .then(() => {
        toast({
          title: t('errors.location.granted'),
          description: t('errors.location.grantedDesc'),
        });
      })
      .catch((error) => {
        console.error("Location access error:", error);
        
        if (error.code === 1) { // PERMISSION_DENIED
          toast({
            title: t('errors.location.denied'),
            description: t('errors.location.deniedDesc'),
            variant: "destructive",
          });
        } else {
          toast({
            title: t('errors.location.error'),
            description: t('errors.location.errorDesc'),
            variant: "destructive",
          });
        }
      });
  };

  // Fetch issues data - needed for the map to show existing issues
  const { data: issues = [] } = useQuery<Issue[]>({
    queryKey: ['/api/issues'],
    enabled: !geolocation.loading && !!geolocation.latitude && !!geolocation.longitude,
  });

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
    
    // Automatically return to home page after success
    setTimeout(() => {
      setLocation('/');
    }, 3000);
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
          heatmapActive={false}
          onMarkerClick={() => {}}
        />
        
        {/* Map Controls */}
        <div className="absolute top-4 left-4 right-4 flex justify-between items-center">
          <Button 
            variant="outline" 
            onClick={() => setLocation('/')}
            className="bg-white"
          >
            <ChevronLeft className="mr-1 h-4 w-4" />
            Back to Home
          </Button>
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
      
      {/* Report Panel */}
      <ReportPanel 
        isOpen={reportPanelActive}
        onClose={() => setLocation('/')}
        onSuccess={handleReportSuccess}
        currentLocation={{
          latitude: geolocation.latitude,
          longitude: geolocation.longitude,
          address
        }}
      />
      
      {/* Success Overlay */}
      <SuccessOverlay 
        isOpen={successOverlayActive}
        onClose={() => {
          setSuccessOverlayActive(false);
          setLocation('/');
        }}
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