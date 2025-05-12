import { useRef, useEffect, useState } from 'react';
import { Issue } from '@/types';
import { Loader2 } from 'lucide-react';

// Define the window.google type for TypeScript
declare global {
  interface Window {
    google: any;
  }
}

interface GoogleMapProps {
  center: { lat: number; lng: number } | null;
  issues: Issue[];
  onMarkerClick: (issueId: number) => void;
}

export default function GoogleMap({ center, issues, onMarkerClick }: GoogleMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<any>(null);
  const [markers, setMarkers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Default center (Pretoria)
  const defaultCenter = { lat: -25.7461, lng: 28.1881 };
  
  // Load Google Maps API
  useEffect(() => {
    // Skip if already loaded
    if (window.google && window.google.maps) {
      initializeMap();
      return;
    }
    
    console.log('Loading Google Maps API...');
    
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      console.error('Google Maps API key is missing');
      setError('Google Maps API key is missing');
      setLoading(false);
      return;
    }
    
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=visualization`;
    script.async = true;
    script.defer = true;
    script.id = 'google-maps-script';
    
    // Handle successful load
    script.onload = () => {
      console.log('Google Maps API loaded successfully');
      initializeMap();
    };
    
    // Handle load error
    script.onerror = () => {
      console.error('Failed to load Google Maps API');
      setError('Failed to load Google Maps. Please check your internet connection.');
      setLoading(false);
    };
    
    document.head.appendChild(script);
    
    return () => {
      // Clean up on unmount
      if (document.getElementById('google-maps-script')) {
        document.head.removeChild(script);
      }
    };
  }, []);
  
  // Initialize map
  const initializeMap = () => {
    if (!mapRef.current) return;
    
    try {
      console.log('Initializing map...');
      const googleMap = new window.google.maps.Map(mapRef.current, {
        center: center || defaultCenter,
        zoom: 14,
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
        ],
        mapTypeControl: false,
        fullscreenControl: false,
        streetViewControl: false,
      });
      
      setMap(googleMap);
      setLoading(false);
    } catch (err) {
      console.error('Error initializing map:', err);
      setError('Error initializing map. Please refresh the page.');
      setLoading(false);
    }
  };
  
  // Update center when it changes
  useEffect(() => {
    if (!map || !center) return;
    
    // Center map on user's location
    map.setCenter(center);
    
    // Add a marker for user's location
    const userMarker = new window.google.maps.Marker({
      position: center,
      map: map,
      icon: {
        path: window.google.maps.SymbolPath.CIRCLE,
        fillColor: '#4285F4',
        fillOpacity: 1,
        strokeColor: '#FFFFFF',
        strokeWeight: 2,
        scale: 8
      },
      title: 'Your Location'
    });
    
    // Add animated circle to represent accuracy
    const userCircle = new window.google.maps.Circle({
      strokeColor: '#4285F4',
      strokeOpacity: 0.8,
      strokeWeight: 1,
      fillColor: '#4285F4',
      fillOpacity: 0.2,
      map: map,
      center: center,
      radius: 50
    });
    
    return () => {
      userMarker.setMap(null);
      userCircle.setMap(null);
    };
  }, [map, center]);
  
  // Handle markers for issues
  useEffect(() => {
    if (!map || !issues.length) return;
    
    // Clear existing markers
    markers.forEach(marker => marker.setMap(null));
    
    // Create new markers for issues
    const newMarkers = issues.map(issue => {
      // Choose marker color based on issue type
      let iconUrl;
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
      
      // Create the marker
      const marker = new window.google.maps.Marker({
        position: { lat: issue.latitude, lng: issue.longitude },
        map: map,
        icon: iconUrl,
        title: issue.type,
        animation: window.google.maps.Animation.DROP
      });
      
      // Add click handler
      marker.addListener('click', () => {
        console.log('Marker clicked:', issue.id);
        
        // Animate marker when clicked
        if (marker.getAnimation() !== null) {
          marker.setAnimation(null);
        } else {
          marker.setAnimation(window.google.maps.Animation.BOUNCE);
          setTimeout(() => {
            marker.setAnimation(null);
          }, 750);
        }
        
        onMarkerClick(issue.id);
      });
      
      return marker;
    });
    
    setMarkers(newMarkers);
    
    return () => {
      newMarkers.forEach(marker => marker.setMap(null));
    };
  }, [map, issues, onMarkerClick]);
  
  return (
    <div className="relative w-full h-full rounded-lg overflow-hidden">
      <div 
        ref={mapRef} 
        className="w-full h-full" 
        style={{ minHeight: '400px' }} 
      />
      
      {/* Loading indicator */}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-80 z-10">
          <div className="text-center p-4">
            <Loader2 className="h-8 w-8 mx-auto animate-spin text-orange-500 mb-2" />
            <p className="text-gray-800 font-medium">Loading map...</p>
          </div>
        </div>
      )}
      
      {/* Error message */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-90 z-10">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md text-center">
            <h3 className="font-bold text-lg text-red-500 mb-2">Map Error</h3>
            <p className="text-neutral-800">{error}</p>
          </div>
        </div>
      )}
    </div>
  );
}