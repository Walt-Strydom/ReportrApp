import { useEffect, useRef } from 'react';
import { Issue } from '@/types';

interface BasicMapProps {
  center: { lat: number; lng: number } | null;
  issues: Issue[];
  heatmapActive: boolean;
  onMarkerClick: (issueId: number) => void;
}

// Simple map styles to reduce clutter
const MAP_STYLES = [
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
];

export default function BasicMap({ center, issues, heatmapActive, onMarkerClick }: BasicMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const heatmapRef = useRef<any>(null);

  // Default center is Pretoria
  const defaultCenter = { lat: -25.7461, lng: 28.1881 };

  // Initialize map when component mounts
  useEffect(() => {
    // Load the Google Maps script
    const loadGoogleMaps = () => {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}&libraries=visualization`;
      script.async = true;
      script.defer = true;
      
      script.onload = initializeMap;
      script.onerror = () => console.error('Failed to load Google Maps');
      
      document.head.appendChild(script);
    };

    // Initialize map after script loads
    const initializeMap = () => {
      if (!mapContainerRef.current) return;
      
      // Create new map instance
      const mapOptions = {
        center: center || defaultCenter,
        zoom: 15,
        mapTypeControl: false,
        fullscreenControl: false,
        streetViewControl: false,
        styles: MAP_STYLES
      };
      
      const map = new window.google.maps.Map(mapContainerRef.current, mapOptions);
      mapInstanceRef.current = map;
      
      // Add markers for issues
      addMarkers();
      
      // Create heatmap if needed
      if (heatmapActive) {
        createHeatmap();
      }
    };

    // Add markers for each issue
    const addMarkers = () => {
      if (!mapInstanceRef.current) return;
      
      // Clear existing markers
      clearMarkers();
      
      issues.forEach(issue => {
        const markerOptions = {
          position: { lat: issue.latitude, lng: issue.longitude },
          map: mapInstanceRef.current,
          title: issue.type,
          icon: getMarkerIcon(issue.type)
        };
        
        const marker = new window.google.maps.Marker(markerOptions);
        
        // Add click handler
        marker.addListener('click', () => onMarkerClick(issue.id));
        
        // Store marker reference
        markersRef.current.push(marker);
      });
    };

    // Create heatmap layer
    const createHeatmap = () => {
      if (!mapInstanceRef.current || issues.length === 0) return;
      
      const heatmapData = issues.map(issue => ({
        location: new window.google.maps.LatLng(issue.latitude, issue.longitude),
        weight: issue.upvotes + 1
      }));
      
      const heatmap = new window.google.maps.visualization.HeatmapLayer({
        data: heatmapData,
        map: mapInstanceRef.current,
        radius: 50,
        opacity: 0.7
      });
      
      heatmapRef.current = heatmap;
    };

    // Get marker icon based on issue type
    const getMarkerIcon = (type: string) => {
      switch (type) {
        case 'pothole':
          return 'https://maps.google.com/mapfiles/ms/icons/red-dot.png';
        case 'streetlight':
          return 'https://maps.google.com/mapfiles/ms/icons/yellow-dot.png';
        case 'trafficlight':
          return 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png';
        default:
          return 'https://maps.google.com/mapfiles/ms/icons/purple-dot.png';
      }
    };

    // Clear existing markers
    const clearMarkers = () => {
      markersRef.current.forEach(marker => marker.setMap(null));
      markersRef.current = [];
    };

    // Check if Google Maps is already loaded
    if (window.google && window.google.maps) {
      initializeMap();
    } else {
      loadGoogleMaps();
    }

    // Cleanup on unmount
    return () => {
      clearMarkers();
      if (heatmapRef.current) {
        heatmapRef.current.setMap(null);
      }
    };
  }, []); // Empty dependency array - we only want to initialize once

  // Update markers when issues change
  useEffect(() => {
    if (!mapInstanceRef.current || !window.google) return;
    
    // Clear and recreate markers
    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];
    
    issues.forEach(issue => {
      const marker = new window.google.maps.Marker({
        position: { lat: issue.latitude, lng: issue.longitude },
        map: mapInstanceRef.current,
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
      markersRef.current.push(marker);
    });
    
    // Update heatmap if active
    if (heatmapActive && heatmapRef.current) {
      const heatmapData = issues.map(issue => ({
        location: new window.google.maps.LatLng(issue.latitude, issue.longitude),
        weight: issue.upvotes + 1
      }));
      
      heatmapRef.current.setData(heatmapData);
    }
  }, [issues, onMarkerClick]);

  // Update map center when it changes
  useEffect(() => {
    if (!mapInstanceRef.current || !center) return;
    mapInstanceRef.current.setCenter(center);
    
    // Add user location marker
    const userMarker = new window.google.maps.Marker({
      position: center,
      map: mapInstanceRef.current,
      icon: {
        path: window.google.maps.SymbolPath.CIRCLE,
        scale: 10,
        fillColor: "#0F71B3",
        fillOpacity: 1,
        strokeColor: "#FFFFFF",
        strokeWeight: 2
      },
      zIndex: 999
    });
    
    return () => userMarker.setMap(null);
  }, [center]);

  // Toggle heatmap
  useEffect(() => {
    if (!heatmapRef.current || !mapInstanceRef.current) return;
    
    heatmapRef.current.setMap(heatmapActive ? mapInstanceRef.current : null);
  }, [heatmapActive]);

  return (
    <div 
      ref={mapContainerRef} 
      className="w-full h-full rounded-lg overflow-hidden"
      style={{ minHeight: '300px' }}
    />
  );
}