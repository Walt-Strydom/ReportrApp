import { useRef, useEffect, useState } from 'react';
import { Issue, MapMarker, HeatmapData } from '@/types';
import { Loader } from '@googlemaps/js-api-loader';

interface MapProps {
  center: { lat: number; lng: number } | null;
  issues: Issue[];
  heatmapActive: boolean;
  onMarkerClick: (issueId: number) => void;
}

// Types for Google Maps
type GoogleMapsType = any;
type GoogleMapType = any;
type GoogleMapMarkerType = any;
type GoogleMapHeatmapType = any;

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
  const [googleMapsLoaded, setGoogleMapsLoaded] = useState(false);
  const [googleMaps, setGoogleMaps] = useState<GoogleMapsType>(null);
  const [map, setMap] = useState<GoogleMapType>(null);
  const [markers, setMarkers] = useState<GoogleMapMarkerType[]>([]);
  const [heatmap, setHeatmap] = useState<GoogleMapHeatmapType>(null);
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
        setGoogleMaps(google);
        setGoogleMapsLoaded(true);
        setMapLoaded(true);
        
        const mapOptions = {
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
        try {
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
        } catch (error) {
          console.error("Error creating heatmap layer:", error);
        }
      })
      .catch((error) => {
        console.error("Error loading Google Maps:", error);
        setMapError("Failed to load Google Maps. Please try again later.");
      });

    return () => {
      // Clean up markers on unmount
      if (markers.length > 0) {
        markers.forEach(marker => marker.setMap(null));
      }
    };
  }, [mapRef]);

  // Update map center when user location changes
  useEffect(() => {
    if (!map || !center || !googleMaps || !googleMapsLoaded) return;
    
    map.setCenter(center);
    
    // Add user location marker
    const userMarker = new googleMaps.maps.Marker({
      position: center,
      map: map,
      icon: {
        path: googleMaps.maps.SymbolPath.CIRCLE,
        scale: 10,
        fillColor: "#0F71B3",
        fillOpacity: 1,
        strokeColor: "#FFFFFF",
        strokeWeight: 2,
      },
      zIndex: 999, // Keep user marker on top
    });
    
    // Add pulse animation
    const userMarkerRadius = new googleMaps.maps.Circle({
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
  }, [map, center, googleMaps, googleMapsLoaded]);

  // Update markers when issues change
  useEffect(() => {
    if (!map || !googleMaps || !googleMapsLoaded) return;
    
    // Clear old markers
    markers.forEach(marker => marker.setMap(null));
    const newMarkers: GoogleMapMarkerType[] = [];
    
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
      
      try {
        const marker = new googleMaps.maps.Marker({
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
      } catch (error) {
        console.error('Error creating marker:', error);
      }
    });
    
    setMarkers(newMarkers);
    
    // Update heatmap data
    if (heatmap) {
      try {
        const heatmapPoints = issues.map(issue => ({
          location: new googleMaps.maps.LatLng(issue.latitude, issue.longitude),
          weight: issue.upvotes + 1, // Weight by upvotes (min weight of 1)
        }));
        
        heatmap.setData(heatmapPoints);
      } catch (error) {
        console.error('Error updating heatmap:', error);
      }
    }
  }, [map, issues, googleMaps, googleMapsLoaded]);

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
