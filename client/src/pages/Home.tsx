import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { useGeolocation } from '@/hooks/useGeolocation';
import { reverseGeocode } from '@/lib/geocode';
import BottomNavigation from '@/components/BottomNavigation';
import IssueDetailsPanel from '@/components/IssueDetailsPanel';
import NearbyIssuesPanel from '@/components/NearbyIssuesPanel';
import SuccessOverlay from '@/components/SuccessOverlay';
import LocationPermissionModal from '@/components/LocationPermissionModal';
import { Issue } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { AlertTriangle, MapPin, ThumbsUp, Megaphone } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { getIssueTypeById } from '@/data/issueTypes';
import { useTranslation } from 'react-i18next';
import LanguageSelector from '@/components/LanguageSelector';

export default function Home() {
  const { t } = useTranslation();
  
  // State variables
  const [issueDetailsPanelActive, setIssueDetailsPanelActive] = useState(false);
  const [nearbyIssuesPanelActive, setNearbyIssuesPanelActive] = useState(false);
  const [successOverlayActive, setSuccessOverlayActive] = useState(false);
  const [locationModalActive, setLocationModalActive] = useState(false);
  const [selectedIssueId, setSelectedIssueId] = useState<number | null>(null);
  const [address, setAddress] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState({
    title: t('success.support.title'),
    message: t('success.support.message')
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
    enabled: true, // Always fetch issues regardless of location status
  });

  // Sort issues by upvotes to get top issues
  const topIssues = [...(issues || [])].sort((a, b) => b.upvotes - a.upvotes).slice(0, 5);

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
  const handleIssueClick = (issueId: number) => {
    setSelectedIssueId(issueId);
    setIssueDetailsPanelActive(true);
    setNearbyIssuesPanelActive(false);
  };

  // Show success overlay
  const showSuccessOverlay = (title: string, message: string) => {
    setSuccessMessage({ title, message });
    setSuccessOverlayActive(true);
  };

  // Handle support success
  const handleSupportSuccess = () => {
    showSuccessOverlay(
      t('success.support.title'),
      t('success.support.message')
    );
  };
  
  // Handle report button click with permission check
  const handleReportButtonClick = () => {
    // If location permission is not granted, show permission modal
    if (geolocation.permissionStatus !== 'granted') {
      setLocationModalActive(true);
      return;
    }
    
    setLocation('/create');
  };

  // Format issue type display
  const formatIssueType = (type: string) => {
    const issueType = getIssueTypeById(type);
    if (issueType) {
      return issueType.name;
    }
    return type.charAt(0).toUpperCase() + type.slice(1).replace(/-/g, ' ');
  };

  // Get badge color for an issue
  const getBadgeColor = (type: string) => {
    const issueType = getIssueTypeById(type);
    if (issueType) {
      return issueType.color;
    }
    return '#6b7280'; // Default gray
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-primary text-white p-6">
        <div className="container mx-auto">
          <div className="flex justify-between items-center mb-2">
            <div className="flex items-center">
              <img 
                src="/assets/lokisa-logo.png" 
                alt="Lokisa Logo" 
                className="h-10 w-auto"
              />
            </div>
            <LanguageSelector />
          </div>
          <p className="text-sm mb-4">{t('app.tagline')}</p>
          
          {/* Welcome message with location */}
          <div className="mt-4">
            {address ? (
              <div className="flex items-center">
                <MapPin className="h-4 w-4 mr-1" />
                <p className="text-sm">{t('home.location.current', { address })}</p>
              </div>
            ) : geolocation.loading ? (
              <p className="text-sm">{t('home.location.loading')}</p>
            ) : (
              <p className="text-sm">{t('home.location.unavailable')}</p>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        {/* Hero Section with CTA */}
        <section className="mb-8">
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="p-6">
              <h2 className="text-xl font-bold mb-2">{t('home.cta.title')}</h2>
              <p className="text-gray-600 mb-4">
                {t('home.cta.description')}
              </p>
              <Button 
                onClick={handleReportButtonClick} 
                className="w-full py-6 text-lg font-semibold"
              >
                <AlertTriangle className="mr-2 h-5 w-5" />
                {t('home.cta.button')}
              </Button>
            </div>
          </div>
        </section>

        {/* Top Issues Section */}
        <section className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">{t('home.topIssues.title')}</h2>
            <Button 
              variant="outline" 
              onClick={() => setNearbyIssuesPanelActive(true)}
              size="sm"
            >
              {t('home.topIssues.viewAll')}
            </Button>
          </div>

          {isLoading ? (
            <div className="text-center py-8">
              <p>{t('home.topIssues.loading')}</p>
            </div>
          ) : error ? (
            <div className="bg-red-50 text-red-600 p-4 rounded-lg">
              <p>{t('home.topIssues.error')}</p>
            </div>
          ) : topIssues.length === 0 ? (
            <div className="bg-gray-100 p-6 rounded-lg text-center">
              <Megaphone className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-medium mb-2">{t('home.topIssues.empty.title')}</h3>
              <p className="text-gray-500 mb-4">{t('home.topIssues.empty.description')}</p>
              <Button onClick={handleReportButtonClick}>
                {t('home.topIssues.empty.button')}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {topIssues.map(issue => (
                <div
                  key={issue.id}
                  className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => handleIssueClick(issue.id)}
                >
                  <div className="flex items-start">
                    {issue.photoUrl ? (
                      <div className="w-20 h-20 rounded-lg overflow-hidden mr-4 bg-gray-200">
                        <img 
                          src={issue.photoUrl} 
                          alt={`${issue.type} issue`} 
                          className="w-full h-full object-cover" 
                        />
                      </div>
                    ) : (
                      <div className="w-20 h-20 rounded-lg flex items-center justify-center mr-4" 
                        style={{backgroundColor: `${getBadgeColor(issue.type)}25`}}>
                        <img 
                          src="/assets/lokisa-logo.png" 
                          alt="Lokisa Logo" 
                          className="h-10 w-auto" 
                          style={{opacity: 0.8}}
                        />
                      </div>
                    )}
                    
                    <div className="flex-1">
                      <div className="flex items-center mb-1">
                        <span 
                          className="inline-block px-2 py-1 text-white text-xs rounded-full mr-2" 
                          style={{backgroundColor: getBadgeColor(issue.type)}}
                        >
                          {formatIssueType(issue.type)}
                        </span>
                        <span className="text-xs text-gray-500">
                          {formatDistanceToNow(new Date(issue.createdAt), { addSuffix: true })}
                        </span>
                      </div>
                      <h3 className="font-medium mb-1 line-clamp-1">{issue.address}</h3>
                      <p className="text-sm text-gray-600 mb-2 line-clamp-1">
                        {issue.notes || 'No additional details provided.'}
                      </p>
                      
                      <div className="flex items-center">
                        <div className="flex items-center">
                          <ThumbsUp className="text-primary mr-1 h-4 w-4" />
                          <span className="font-medium">{issue.upvotes} {issue.upvotes === 1 ? 'supporter' : 'supporters'}</span>
                        </div>
                      </div>
                    </div>

                    <Button variant="ghost" size="sm" className="self-end">
                      {t('home.topIssues.supportButton')}
                    </Button>
                  </div>
                </div>
              ))}

              <Button 
                variant="outline" 
                className="w-full mt-4" 
                onClick={() => setNearbyIssuesPanelActive(true)}
              >
                {t('issues.nearby.viewAll')}
              </Button>
            </div>
          )}
        </section>
      </main>
      
      {/* Bottom Navigation */}
      <BottomNavigation 
        onReportButtonClick={handleReportButtonClick}
        onMapButtonClick={() => setLocation('/create')}
        onNearbyButtonClick={() => setNearbyIssuesPanelActive(true)}
      />
      
      {/* Issue Details Panel */}
      <IssueDetailsPanel 
        issue={selectedIssue}
        isOpen={issueDetailsPanelActive}
        onClose={() => setIssueDetailsPanelActive(false)}
        onSuccess={handleSupportSuccess}
      />
      
      {/* Nearby Issues Panel */}
      <NearbyIssuesPanel 
        issues={issues}
        isOpen={nearbyIssuesPanelActive}
        onClose={() => setNearbyIssuesPanelActive(false)}
        onIssueClick={handleIssueClick}
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
        <div className="fixed bottom-20 left-4 right-4 bg-destructive text-white p-3 rounded-lg z-50">
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