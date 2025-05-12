import { useRef, useEffect, useState } from 'react';
import { Issue } from '@/types';

interface MapProps {
  center: { lat: number; lng: number } | null;
  issues: Issue[];
  heatmapActive: boolean;
  onMarkerClick: (issueId: number) => void;
  onMapInitialized?: (map: any) => void;
}

// Define map styles
const MAP_STYLES = [
  {
    featureType: 'poi',
    elementType: 'labels',
    stylers: [{ visibility: 'off' }],
  },
  {
    featureType: 'transit',
    elementType: 'labels',
    stylers: [{ visibility: 'off' }],
  },
];

export default function Map({ center, issues, heatmapActive, onMarkerClick, onMapInitialized }: MapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  
  // State variables for Google Maps objects - using 'any' to avoid type issues
  const [googleMap, setGoogleMap] = useState<any>(null);
  const [mapMarkers, setMapMarkers] = useState<any[]>([]);
  const [heatmapLayer, setHeatmapLayer] = useState<any>(null);
  
  // Initialize the map
  useEffect(() => {
    // Skip if map is already initialized or div not available
    if (googleMap || !mapRef.current) return;
    
    // Default to Pretoria central coordinates if user location not available
    const defaultCenter = { lat: -25.7461, lng: 28.1881 };
    
    // Load Google Maps script
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}&libraries=visualization`;
    script.async = true;
    script.defer = true;
    
    // Handle map initialization when script loads
    script.onload = () => {
      try {
        // Create map instance
        const newMap = new window.google.maps.Map(mapRef.current!, {
          center: center || defaultCenter,
          zoom: 15,
          mapTypeControl: false,
          fullscreenControl: false,
          streetViewControl: false,
          zoomControl: true,
          zoomControlOptions: {
            position: window.google.maps.ControlPosition.RIGHT_TOP,
          },
          gestureHandling: 'greedy', // Enable one-finger panning and two-finger zooming
          styles: MAP_STYLES,
          optimized: true,
          clickableIcons: false, // Disable default POI clicking for better performance
          disableDefaultUI: false,
          minZoom: 5,
          maxZoom: 20,
          backgroundColor: '#FFFFFF',
        });
        
        setGoogleMap(newMap);
        
        // Share the map instance with parent component if callback provided
        if (onMapInitialized) {
          onMapInitialized(newMap);
        }
        
        // Create heatmap layer
        const heatmap = new window.google.maps.visualization.HeatmapLayer({
          map: heatmapActive ? newMap : null,
          data: [],
          dissipating: true,
          radius: 50,
          opacity: 0.7,
          maxIntensity: 10,
        });
        
        setHeatmapLayer(heatmap);
        setMapLoaded(true);
      } catch (error) {
        console.error('Error initializing map:', error);
        setMapError('Failed to initialize map. Please try again later.');
      }
    };
    
    script.onerror = () => {
      setMapError('Failed to load Google Maps. Please check your internet connection.');
    };
    
    document.head.appendChild(script);
    
    // Clean up on unmount
    return () => {
      // Remove script if component unmounts before script loads
      if (document.head.contains(script)) {
        document.head.removeChild(script);
      }
      
      // Clear markers
      if (mapMarkers.length > 0) {
        mapMarkers.forEach(marker => marker.setMap(null));
      }
    };
  }, []);
  
  // Update map center when user location changes
  useEffect(() => {
    if (!googleMap || !center) return;
    
    // Add user location marker with pulse effect - center only once
    const userMarker = new window.google.maps.Marker({
      position: center,
      map: googleMap,
      icon: {
        path: window.google.maps.SymbolPath.CIRCLE,
        scale: 10,
        fillColor: "#0F71B3",
        fillOpacity: 1,
        strokeColor: "#FFFFFF",
        strokeWeight: 2,
      },
      zIndex: 999, // Keep user marker on top
    });
    
    // Add pulse animation circle
    const userMarkerRadius = new window.google.maps.Circle({
      strokeColor: "#0F71B3",
      strokeOpacity: 0.8,
      strokeWeight: 1,
      fillColor: "#0F71B3",
      fillOpacity: 0.2,
      map: googleMap,
      center: center,
      radius: 50,
      zIndex: 998,
    });
    
    // Only set the center on initial load, then let user pan freely
    const isInitialLoad = !googleMap.get('initialized');
    if (isInitialLoad) {
      googleMap.set('initialized', true);
      googleMap.setCenter(center);
      console.log('Setting initial map center, subsequent movements will be user-controlled');
    }
    
    return () => {
      userMarker.setMap(null);
      userMarkerRadius.setMap(null);
    };
  }, [googleMap, center]);
  
  // Update markers when issues change
  useEffect(() => {
    if (!googleMap || !mapLoaded || !window.google) return;
    
    // Clear existing markers
    mapMarkers.forEach(marker => marker.setMap(null));
    const newMarkers = [];
    
    // Add issue markers
    for (const issue of issues) {
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
        map: googleMap,
        icon: iconUrl,
        title: issue.type,
      });
      
      // Add click handler
      marker.addListener('click', () => {
        onMarkerClick(issue.id);
      });
      
      newMarkers.push(marker);
    }
    
    setMapMarkers(newMarkers);
    
    // Update heatmap data if available
    if (heatmapLayer && issues.length > 0) {
      const heatmapData = issues.map(issue => ({
        location: new window.google.maps.LatLng(issue.latitude, issue.longitude),
        weight: issue.upvotes + 1 // Min weight of 1
      }));
      
      heatmapLayer.setData(heatmapData);
    }
  }, [googleMap, issues, mapLoaded]);
  
  // Toggle heatmap visibility
  useEffect(() => {
    if (!heatmapLayer || !googleMap) return;
    
    heatmapLayer.setMap(heatmapActive ? googleMap : null);
  }, [heatmapLayer, heatmapActive, googleMap]);
  
  return (
    <div className="w-full h-full relative">
      <div ref={mapRef} className="w-full h-full" />
      
      {/* Display error message if map fails to load */}
      {mapError && (
        <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-90 z-10">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md text-center">
            <h3 className="font-bold text-lg text-destructive mb-2">Map Error</h3>
            <p className="text-neutral-800">{mapError}</p>
          </div>
        </div>
      )}
      
      {/* Display loading indicator while map is initializing */}
      {!mapLoaded && !mapError && (
        <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-90 z-10">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md text-center">
            <p className="text-neutral-800">Loading map...</p>
          </div>
        </div>
      )}
    </div>
  );
}