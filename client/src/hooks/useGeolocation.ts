import { useState, useEffect } from 'react';

interface GeolocationState {
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  error: string | null;
  loading: boolean;
}

export function useGeolocation() {
  const [location, setLocation] = useState<GeolocationState>({
    latitude: null,
    longitude: null,
    accuracy: null,
    error: null,
    loading: true
  });

  useEffect(() => {
    if (!navigator.geolocation) {
      setLocation(prev => ({
        ...prev,
        error: 'Geolocation is not supported by your browser',
        loading: false
      }));
      return;
    }

    const geoSuccess = (position: GeolocationPosition) => {
      setLocation({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        error: null,
        loading: false
      });
    };

    const geoError = (error: GeolocationPositionError) => {
      setLocation(prev => ({
        ...prev,
        error: error.message,
        loading: false
      }));
    };

    const options = {
      enableHighAccuracy: true,
      maximumAge: 30000,
      timeout: 27000
    };

    // Get initial position
    navigator.geolocation.getCurrentPosition(geoSuccess, geoError, options);

    // Set up watch position
    const watchId = navigator.geolocation.watchPosition(
      geoSuccess,
      geoError,
      options
    );

    // Clean up
    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  return location;
}
