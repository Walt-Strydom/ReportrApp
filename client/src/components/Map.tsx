import { useRef, useEffect, useState } from 'react';
import { Issue } from '@/types';
import { getIssueTypeById } from '@/data/issueTypes';
import { getIssueMarkerIcon, markerIconCache } from '@/lib/markerIcons';
import { MapPin } from 'lucide-react';

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
  const [googleMap, setGoogleMap] = useState<any>(null);
  const [mapMarkers, setMapMarkers] = useState<any[]>([]);
  const [heatmapLayer, setHeatmapLayer] = useState<any>(null);
  const [userMarker, setUserMarker] = useState<any>(null);
  const [userMarkerRadius, setUserMarkerRadius] = useState<any>(null);
  
  // Format issue title for marker tooltip
  const formatIssueTitle = (issue: Issue) => {
    const issueType = getIssueTypeById(issue.type);
    const typeName = issueType ? issueType.name : issue.type.charAt(0).toUpperCase() + issue.type.slice(1).replace(/-/g, ' ');
    return `${typeName} - ${issue.address}`;
  };
  
  // Track initialization to prevent repeated mounting
  const mapInitializedRef = useRef(false);
  
  // Initialize map
  useEffect(() => {
    // Only initialize once and when we have a DOM node
    if (!mapRef.current || mapInitializedRef.current) return;
    
    const defaultCenter = { lat: -25.7461, lng: 28.1881 }; // Pretoria, South Africa
    
    // Mark as initialized to prevent re-execution
    mapInitializedRef.current = true;
    
    // Only load Google Maps if it's not already loaded
    if (!window.google) {
      // Create script element
      const script = document.createElement('script');
      const googleMapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';
      
      script.src = `https://maps.googleapis.com/maps/api/js?key=${googleMapsApiKey}&libraries=visualization`;
      script.async = true;
      script.defer = true;
      
      // Handle script load error
      script.onerror = () => {
        setMapError("Failed to load Google Maps. Please check your connection and try again.");
      };
      
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
              position: window.google.maps.ControlPosition.RIGHT_BOTTOM,
            },
            myLocationButton: true,
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
            maxIntensity: 10,
            gradient: [
              'rgba(0, 255, 255, 0)',
              'rgba(0, 255, 255, 1)',
              'rgba(0, 191, 255, 1)',
              'rgba(0, 127, 255, 1)',
              'rgba(0, 63, 255, 1)',
              'rgba(0, 0, 255, 1)',
              'rgba(0, 0, 223, 1)',
              'rgba(0, 0, 191, 1)',
              'rgba(0, 0, 159, 1)',
              'rgba(0, 0, 127, 1)',
              'rgba(63, 0, 91, 1)',
              'rgba(127, 0, 63, 1)',
              'rgba(191, 0, 31, 1)',
              'rgba(255, 0, 0, 1)',
            ],
          });
          
          setHeatmapLayer(heatmap);
          setMapLoaded(true);
        } catch (error) {
          console.error("Error initializing map:", error);
          setMapError("Failed to initialize map. Please try refreshing the page.");
        }
      };
      
      // Add script to document
      document.head.appendChild(script);
    } else {
      // Google Maps already loaded, initialize map
      try {
        const newMap = new window.google.maps.Map(mapRef.current!, {
          center: center || defaultCenter,
          zoom: 15,
          mapTypeControl: false,
          fullscreenControl: false,
          streetViewControl: false,
          zoomControl: true,
          zoomControlOptions: {
            position: window.google.maps.ControlPosition.RIGHT_BOTTOM,
          },
          myLocationButton: true,
          gestureHandling: 'greedy',
          styles: MAP_STYLES,
        });
        
        setGoogleMap(newMap);
        
        if (onMapInitialized) {
          onMapInitialized(newMap);
        }
        
        const heatmap = new window.google.maps.visualization.HeatmapLayer({
          map: heatmapActive ? newMap : null,
          data: [],
          dissipating: true,
          radius: 50,
          maxIntensity: 10,
        });
        
        setHeatmapLayer(heatmap);
        setMapLoaded(true);
      } catch (error) {
        console.error("Error initializing map:", error);
        setMapError("Failed to initialize map. Please try refreshing the page.");
      }
    }
    
    // Cleanup function
    return () => {
      mapInitializedRef.current = false;
      setGoogleMap(null);
      setHeatmapLayer(null);
      setMapLoaded(false);
    };
  }, [center, heatmapActive, onMapInitialized]);
  
  // Update user location marker when center changes
  useEffect(() => {
    if (!googleMap || !mapLoaded || !window.google || !center) return;
    
    // Clear existing user marker
    if (userMarker) userMarker.setMap(null);
    if (userMarkerRadius) userMarkerRadius.setMap(null);
    
    // Create new user marker
    const newUserMarker = new window.google.maps.Marker({
      position: center,
      map: googleMap,
      icon: {
        path: window.google.maps.SymbolPath.CIRCLE,
        scale: 7,
        fillColor: '#4285F4',
        fillOpacity: 1,
        strokeColor: '#FFFFFF',
        strokeWeight: 2,
      },
      zIndex: 1000, // Always on top
    });
    
    // Create accuracy radius circle
    const newUserMarkerRadius = new window.google.maps.Circle({
      map: googleMap,
      center: center,
      radius: 50, // Arbitrary radius of 50 meters
      strokeColor: '#4285F4',
      strokeOpacity: 0.3,
      strokeWeight: 1,
      fillColor: '#4285F4',
      fillOpacity: 0.1,
    });
    
    setUserMarker(newUserMarker);
    setUserMarkerRadius(newUserMarkerRadius);
    
    return () => {
      if (newUserMarker) newUserMarker.setMap(null);
      if (newUserMarkerRadius) newUserMarkerRadius.setMap(null);
    };
  }, [googleMap, center, mapLoaded]);
  
  // Update markers when issues change
  useEffect(() => {
    if (!googleMap || !mapLoaded || !window.google) return;
    
    // Clear existing markers
    mapMarkers.forEach(marker => marker.setMap(null));
    const newMarkers = [];

    // Initialize icon cache if not already done
    Object.keys(markerIconCache).length === 0 && console.log("Initializing marker icon cache");
    
    // Add markers for all issues
    for (const issue of issues) {
      // Get icon from cache or create and cache it
      if (!markerIconCache[issue.type]) {
        markerIconCache[issue.type] = getIssueMarkerIcon(issue.type);
      }
      
      // Create marker with the cached icon
      const marker = new window.google.maps.Marker({
        position: { lat: issue.latitude, lng: issue.longitude },
        map: googleMap,
        icon: markerIconCache[issue.type],
        title: formatIssueTitle(issue),
        optimized: true,
        // Apply DROP animation only for the first few markers to avoid overwhelming the map
        animation: issues.length < 20 ? window.google.maps.Animation.DROP : null
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
  }, [googleMap, issues, mapLoaded, onMarkerClick]);
  
  // Toggle heatmap when heatmapActive changes
  useEffect(() => {
    if (!heatmapLayer) return;
    
    heatmapLayer.setMap(heatmapActive ? googleMap : null);
  }, [heatmapActive, googleMap, heatmapLayer]);

  // Add custom location button to re-center map on user's location
  const handleMyLocationClick = () => {
    if (!googleMap || !center) return;
    
    // Pan to user's location
    googleMap.panTo(center);
    googleMap.setZoom(15);
    
    // Prompt for location if not available (especially important for iOS)
    if (!center.lat || !center.lng) {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const pos = {
              lat: position.coords.latitude,
              lng: position.coords.longitude
            };
            googleMap.panTo(pos);
          },
          (error) => {
            console.error("Error getting location:", error);
            alert("Please enable location services in your device settings to use this feature.");
          },
          { enableHighAccuracy: true, timeout: 30000, maximumAge: 0 }
        );
      }
    }
  };

  return (
    <div className="relative w-full h-full">
      {mapError && (
        <div className="absolute top-0 left-0 right-0 z-10 bg-red-500 text-white p-2 text-center">
          {mapError}
        </div>
      )}
      <div 
        ref={mapRef} 
        className="w-full h-full"
        aria-label="Google Map showing infrastructure issues"
      />
      
      {/* Custom my location button */}
      <button 
        className="absolute bottom-5 right-5 z-10 bg-white rounded-full p-3 shadow-md hover:bg-gray-100 transition-colors"
        onClick={handleMyLocationClick}
        aria-label="Center map on my location"
        title="My Location"
      >
        <MapPin className="h-5 w-5 text-blue-500" />
      </button>
    </div>
  );
}