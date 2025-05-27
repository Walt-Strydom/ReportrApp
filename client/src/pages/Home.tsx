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
import MapView from '@/components/MapView';
import InstallOptions from '@/components/InstallOptions';
import AdBanner from '@/components/AdBanner';
import { Issue } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { 
  AlertTriangle, 
  MapPin, 
  ThumbsUp, 
  Megaphone, 
  X, 
  ArrowRight, 
  ChevronRight,
  Download
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { getIssueTypeById } from '@/data/issueTypes';
import { useTranslation } from 'react-i18next';
import LanguageSelector from '@/components/LanguageSelector';
import { isInstalledPWA } from '@/lib/platform';

export default function Home() {
  const { t } = useTranslation();
  const [location] = useLocation();
  
  // Parse URL query parameters
  const params = new URLSearchParams(location.split('?')[1]);
  const issueIdParam = params.get('issueId');
  
  // State variables
  const [issueDetailsPanelActive, setIssueDetailsPanelActive] = useState(!!issueIdParam);
  const [nearbyIssuesPanelActive, setNearbyIssuesPanelActive] = useState(false);
  const [mapViewActive, setMapViewActive] = useState(false);
  const [successOverlayActive, setSuccessOverlayActive] = useState(false);
  const [locationModalActive, setLocationModalActive] = useState(false);
  const [selectedIssueId, setSelectedIssueId] = useState<number | null>(issueIdParam ? parseInt(issueIdParam) : null);
  const [address, setAddress] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState({
    title: t('success.support.title'),
    message: t('success.support.message')
  });
  const [isAppInstalled, setIsAppInstalled] = useState(false);
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  
  // Check if app is installed (PWA)
  useEffect(() => {
    setIsAppInstalled(isInstalledPWA());
  }, []);

  // Get user's geolocation with enhanced permissions handling
  const geolocation = useGeolocation();

  // Show location permission modal on first load if permission is not granted
  useEffect(() => {
    if (geolocation.permissionStatus === 'prompt') {
      setLocationModalActive(true);
    } else if (geolocation.permissionStatus === 'denied') {
      toast({
        title: "Location Access Denied",
        description: "Please enable location access in your browser settings to use all features of this app.",
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
          description: "The app can now accurately identify the location of reported issues.",
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
  const { 
    data: issues = [], 
    isLoading, 
    error,
    refetch: refetchIssues 
  } = useQuery<Issue[]>({
    queryKey: ['/api/issues'],
    enabled: true, // Always fetch issues regardless of location status
    refetchInterval: 30000, // Automatically refresh every 30 seconds (30,000 ms)
  });
  
  // Function to refresh issues data
  const handleRefreshIssues = async () => {
    try {
      await refetchIssues();
      return Promise.resolve();
    } catch (error) {
      console.error("Error refreshing issues:", error);
      toast({
        title: "Refresh Failed",
        description: "Unable to refresh issues. Please try again.",
        variant: "destructive",
      });
      return Promise.reject(error);
    }
  };

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
    <div className="min-h-screen bg-gray-50 pb-36">
      {/* Modern Header with Logo Only */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            <div className="flex-1 flex justify-start">
              <img 
                src="/logo-orange.png" 
                alt="Reportr Logo" 
                className="h-10 w-auto"
              />
            </div>
            <div className="flex-1 flex justify-end items-center">
              <LanguageSelector />
            </div>
          </div>
        </div>
      </header>
      
      {/* Location Bar - Mobile Optimized */}
      <div className="bg-gradient-to-r from-orange-50 to-amber-50 border-b border-orange-100 py-2 px-3">
        <div className="container mx-auto max-w-sm">
          {address ? (
            <div className="flex items-center justify-center">
              <div className="inline-flex items-center px-2.5 py-1.5 rounded-full bg-white/80 backdrop-blur-sm border border-orange-200/50 shadow-sm text-gray-700 max-w-full">
                <MapPin className="h-3.5 w-3.5 mr-1.5 text-orange-500 flex-shrink-0" />
                <p className="truncate text-xs font-medium leading-tight max-w-[250px]">
                  Current location: {address.split(',').slice(0, 2).join(',').trim()}
                </p>
              </div>
            </div>
          ) : geolocation.loading ? (
            <div className="flex justify-center">
              <div className="inline-flex items-center px-2.5 py-1.5 rounded-full bg-white/80 backdrop-blur-sm border border-gray-200/50 shadow-sm">
                <div className="animate-spin h-3.5 w-3.5 mr-1.5 border-b border-gray-500 rounded-full"></div>
                <p className="text-xs text-gray-600 font-medium">Getting location...</p>
              </div>
            </div>
          ) : (
            <div className="flex justify-center">
              <div className="inline-flex items-center px-2.5 py-1.5 rounded-full bg-white/80 backdrop-blur-sm border border-red-200/50 shadow-sm">
                <MapPin className="h-3.5 w-3.5 mr-1.5 text-red-400 flex-shrink-0" />
                <p className="text-xs text-red-500 font-medium">Location unavailable</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        {/* How-to Guide */}
        <section className="mb-6">
          <div className="bg-white rounded-xl overflow-hidden border border-orange-100">
            <div className="pt-3 pb-2 px-4 bg-gradient-to-r from-orange-500/10 to-orange-600/10 border-b border-orange-100">
              <h2 className="text-base font-medium text-gray-800">{t('guide.title', 'How to use this app')}</h2>
            </div>
            <div className="p-4">
              <div className="flex items-start space-x-4 mb-3">
                <div className="bg-orange-100 rounded-full p-2 text-orange-600 mt-1 flex-shrink-0">
                  <AlertTriangle className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-800 mb-1">{t('guide.report.title', 'Report an issue')}</h3>
                  <p className="text-xs text-gray-600">{t('guide.report.description', 'Tap the Report button and fill in details about the problem you found. Add a photo if possible for better visibility.')}</p>
                </div>
              </div>
              <div className="flex items-start space-x-4 mb-3">
                <div className="bg-orange-100 rounded-full p-2 text-orange-600 mt-1 flex-shrink-0">
                  <ThumbsUp className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-800 mb-1">{t('guide.support.title', 'Support existing issues')}</h3>
                  <p className="text-xs text-gray-600">{t('guide.support.description', 'Tap on any issue to view details. Click the Support button to increase priority. More supporters mean faster resolution.')}</p>
                </div>
              </div>
              <div className="flex items-start space-x-4 mb-3">
                <div className="bg-orange-100 rounded-full p-2 text-orange-600 mt-1 flex-shrink-0">
                  <MapPin className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-800 mb-1">{t('guide.map.title', 'View the map')}</h3>
                  <p className="text-xs text-gray-600">{t('guide.map.description', 'Use the map to see all reported issues in your area. Tap on markers to view specific issues.')}</p>
                </div>
              </div>

              {/* Show install section only if not already installed as PWA */}
              {!isInstalledPWA() && (
                <div className="flex items-start space-x-4">
                  <div className="bg-orange-100 rounded-full p-2 text-orange-600 mt-1 flex-shrink-0">
                    <Download className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-800 mb-1">{t('guide.install.title', 'Install Reportr on your device')}</h3>
                    <p className="text-xs text-gray-600 mb-2">{t('guide.install.description', 'Get the best experience by installing Reportr on your device. Tap the buttons below to install on iOS or Android.')}</p>
                    <div className="mt-2">
                      <InstallOptions />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Static Banner Ad Section */}
        <section className="mb-6">
          <div className="bg-white rounded-xl overflow-hidden border border-gray-100 shadow-sm">
            <div className="pt-2 pb-1 px-4 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-xs font-medium text-gray-500">Sponsored</h2>
            </div>
            <div className="p-4 flex justify-center items-center">
              <div className="bg-gray-100 rounded w-full h-20 flex items-center justify-center">
                <p className="text-sm text-gray-500">Ad Banner Space</p>
              </div>
            </div>
          </div>
        </section>

        {/* Hero Section with CTA */}
        <section className="mb-6">
          <div onClick={handleReportButtonClick} className="relative bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl shadow-sm overflow-hidden cursor-pointer group">
            <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative p-5 flex items-center">
              <div className="bg-white/20 rounded-full p-3 mr-4">
                <AlertTriangle className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1 text-white">
                <h2 className="text-lg font-medium mb-1">{t('home.cta.title')}</h2>
                <p className="text-sm text-white/80">
                  {t('home.cta.description')}
                </p>
              </div>
              <div className="ml-2 bg-white/20 rounded-full p-2">
                <ArrowRight className="h-5 w-5 text-white" />
              </div>
            </div>
          </div>
        </section>
        
        {/* Top Issues Section */}
        <section className="mb-6">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-base font-medium text-gray-800">{t('home.topIssues.title')}</h2>
            <button 
              className="text-sm text-primary font-medium flex items-center"
              onClick={() => setNearbyIssuesPanelActive(true)}
            >
              {t('home.topIssues.viewAll')}
              <ChevronRight className="h-4 w-4 ml-0.5" />
            </button>
          </div>

          {isLoading ? (
            <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100">
              <div className="flex justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
              <p className="text-center text-sm text-gray-500 mt-2">{t('home.topIssues.loading')}</p>
            </div>
          ) : error ? (
            <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-100">
              <p className="text-sm font-medium">{t('home.topIssues.error')}</p>
            </div>
          ) : topIssues.length === 0 ? (
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 text-center">
              <div className="bg-gray-50 rounded-full p-3 inline-flex mx-auto mb-4">
                <Megaphone className="h-6 w-6 text-gray-400" />
              </div>
              <h3 className="text-base font-medium mb-2">{t('home.topIssues.empty.title')}</h3>
              <p className="text-sm text-gray-500 mb-4">{t('home.topIssues.empty.description')}</p>
              <Button 
                onClick={handleReportButtonClick}
                className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700"
              >
                {t('home.topIssues.empty.button')}
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {topIssues.map(issue => (
                <div
                  key={issue.id}
                  className="bg-white p-3 rounded-xl shadow-sm border border-gray-100 cursor-pointer hover:border-orange-200 transition-colors"
                  onClick={() => handleIssueClick(issue.id)}
                >
                  <div className="flex gap-3">
                    {issue.photoUrl ? (
                      <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                        <img 
                          src={issue.photoUrl} 
                          alt={`${issue.type} issue`} 
                          className="w-full h-full object-cover" 
                          onError={(e) => {
                            e.currentTarget.src = '/logo-orange.png';
                            e.currentTarget.style.padding = '5px';
                            e.currentTarget.style.objectFit = 'contain';
                          }}
                        />
                      </div>
                    ) : (
                      <div className="w-16 h-16 rounded-lg flex items-center justify-center flex-shrink-0" 
                        style={{backgroundColor: `${getBadgeColor(issue.type)}15`}}>
                        <img 
                          src="/logo-orange.png" 
                          alt="Municipality Logo" 
                          className="h-8 w-auto" 
                          style={{opacity: 0.7}}
                        />
                      </div>
                    )}
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span 
                          className="inline-block px-2 py-0.5 text-xs font-medium rounded-full" 
                          style={{backgroundColor: getBadgeColor(issue.type), color: 'white'}}
                        >
                          {formatIssueType(issue.type)}
                        </span>
                        <span className="text-xs text-gray-400">
                          {formatDistanceToNow(new Date(issue.createdAt), { addSuffix: true })}
                        </span>
                      </div>
                      <h3 className="font-medium text-sm text-gray-800 mb-1 truncate">{issue.address}</h3>
                      <p className="text-xs text-gray-500 line-clamp-1 mb-1">
                        {issue.notes || 'No additional details provided.'}
                      </p>
                      
                      <div className="flex items-center justify-between mt-1">
                        <div className="flex items-center">
                          <ThumbsUp className="text-primary mr-1 h-3.5 w-3.5" />
                          <span className="text-xs font-medium">{issue.upvotes} {issue.upvotes === 1 ? 'supporter' : 'supporters'}</span>
                        </div>
                        <button className="text-xs text-primary font-medium">
                          {t('home.topIssues.supportButton')} →
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              <button 
                className="w-full py-2.5 text-sm text-center text-primary font-medium border border-orange-200 rounded-lg hover:bg-orange-50 transition-colors"
                onClick={() => setNearbyIssuesPanelActive(true)}
              >
                {t('issues.nearby.viewAll')}
              </button>
            </div>
          )}
        </section>

        {/* Rotating Banner Ad Section */}
        <section className="mb-6">
          <div className="bg-white rounded-xl overflow-hidden border border-gray-100 shadow-sm">
            <div className="pt-2 pb-1 px-4 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-xs font-medium text-gray-500">Sponsored Content</h2>
              <span className="text-xs text-gray-400">Rotating</span>
            </div>
            <div className="p-4 flex justify-center items-center">
              <div className="bg-gray-100 rounded w-full h-32 flex items-center justify-center">
                <p className="text-sm text-gray-500">Rotating Ad Banner Space</p>
              </div>
            </div>
          </div>
        </section>
      </main>
      
      {/* Bottom Navigation */}
      <BottomNavigation 
        onReportButtonClick={() => {
          // Close map view if it's open
          if (mapViewActive) {
            setMapViewActive(false);
          }
          handleReportButtonClick();
        }}
        onMapButtonClick={() => {
          // If location permission is not granted, show permission modal
          if (geolocation.permissionStatus !== 'granted') {
            setLocationModalActive(true);
            return;
          }
          setMapViewActive(true);
        }}
        onNearbyButtonClick={() => {
          // Close map view if it's open
          if (mapViewActive) {
            setMapViewActive(false);
          }
          setNearbyIssuesPanelActive(true);
        }}
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
        onRefresh={handleRefreshIssues}
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
      
      {/* Map View */}
      <MapView
        isOpen={mapViewActive}
        onClose={() => setMapViewActive(false)}
        onIssueClick={(issueId) => {
          // This is now handled internally in the MapView component
          // We leave the prop for compatibility, but it's not used anymore
        }}
      />
      
      {/* Display error if geolocation fails */}
      {geolocation.error && !locationModalActive && (
        <div className="fixed bottom-24 inset-x-0 px-4 z-40">
          <div className="bg-red-50 border border-red-200 text-red-800 p-3 rounded-lg shadow-md">
            <p className="text-sm">
              <strong>Location Error:</strong> {geolocation.error}. Some features may be limited.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
