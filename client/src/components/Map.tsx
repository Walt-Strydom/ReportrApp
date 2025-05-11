import { useRef, useEffect, useState } from 'react';
import { Issue, MapMarker, HeatmapData } from '@/types';
import { Loader } from '@googlemaps/js-api-loader';

interface MapProps {
  center: { lat: number; lng: number } | null;
  issues: Issue[];
  heatmapActive: boolean;
  onMarkerClick: (issueId: number) => void;
}

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

export default function Map({ center, issues, heatmapActive, onMarkerClick }: MapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [markers, setMarkers] = useState<google.maps.Marker[]>([]);
  const [heatmap, setHeatmap] = useState<google.maps.visualization.HeatmapLayer | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);

  // Initialize the map
  useEffect(() => {
    if (!mapRef.current || map || mapLoaded) return;

    // Default to Pretoria central coordinates if user location is not available
    const defaultCenter = { lat: -25.7461, lng: 28.1881 };
    
    const loader = new Loader({
      apiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
      version: "weekly",
      libraries: ["visualization"]
    });

    loader.load()
      .then((google) => {
        setMapLoaded(true);
        
        const mapOptions: google.maps.MapOptions = {
          center: center || defaultCenter,
          zoom: 15,
          mapTypeControl: false,
          fullscreenControl: false,
          streetViewControl: false,
          zoomControl: true,
          zoomControlOptions: {
            position: google.maps.ControlPosition.RIGHT_TOP,
          },
          styles: MAP_STYLES,
        };

        const newMap = new google.maps.Map(mapRef.current!, mapOptions);
        setMap(newMap);

        // Create the heatmap layer
        const heatmapLayer = new google.maps.visualization.HeatmapLayer({
          map: newMap,
          data: [],
          dissipating: true,
          radius: 50,
          opacity: 0.7,
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
            'rgba(255, 0, 0, 1)'
          ]
        });
        
        heatmapLayer.setMap(null); // Initially hidden
        setHeatmap(heatmapLayer);
      })
      .catch((error) => {
        console.error("Error loading Google Maps:", error);
        setMapError("Failed to load Google Maps. Please try again later.");
      });

    return () => {
      // Clean up markers on unmount
      markers.forEach(marker => marker.setMap(null));
    };
  }, [mapRef, center]);

  // Update map center when user location changes
  useEffect(() => {
    if (!map || !center) return;
    map.setCenter(center);
    
    // Add user location marker
    const userMarker = new google.maps.Marker({
      position: center,
      map: map,
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 10,
        fillColor: "#0F71B3",
        fillOpacity: 1,
        strokeColor: "#FFFFFF",
        strokeWeight: 2,
      },
      zIndex: 999, // Keep user marker on top
    });
    
    // Add pulse animation
    const userMarkerRadius = new google.maps.Circle({
      strokeColor: "#0F71B3",
      strokeOpacity: 0.8,
      strokeWeight: 1,
      fillColor: "#0F71B3",
      fillOpacity: 0.2,
      map: map,
      center: center,
      radius: 50,
      zIndex: 998,
    });
    
    return () => {
      userMarker.setMap(null);
      userMarkerRadius.setMap(null);
    };
  }, [map, center]);

  // Update markers when issues change
  useEffect(() => {
    if (!map) return;
    
    // Clear old markers
    markers.forEach(marker => marker.setMap(null));
    const newMarkers: google.maps.Marker[] = [];
    
    // Create marker for each issue
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
      
      const marker = new google.maps.Marker({
        position: { lat: issue.latitude, lng: issue.longitude },
        map: map,
        icon: iconUrl,
        title: issue.type,
      });
      
      // Add click listener
      marker.addListener('click', () => {
        onMarkerClick(issue.id);
      });
      
      newMarkers.push(marker);
    });
    
    setMarkers(newMarkers);
    
    // Update heatmap data
    if (heatmap) {
      const heatmapPoints = issues.map(issue => ({
        location: new google.maps.LatLng(issue.latitude, issue.longitude),
        weight: issue.upvotes + 1, // Weight by upvotes (min weight of 1)
      }));
      
      heatmap.setData(heatmapPoints);
    }
  }, [map, issues]);

  // Toggle heatmap visibility
  useEffect(() => {
    if (!heatmap) return;
    heatmap.setMap(heatmapActive ? map : null);
  }, [heatmap, heatmapActive, map]);

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
