import { useState, useEffect, useCallback } from 'react';

interface GeolocationState {
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  error: string | null;
  loading: boolean;
  permissionStatus: 'granted' | 'denied' | 'prompt' | 'unknown';
}

export function useGeolocation() {
  const [location, setLocation] = useState<GeolocationState>({
    latitude: null,
    longitude: null,
    accuracy: null,
    error: null,
    loading: true,
    permissionStatus: 'unknown'
  });

  // Check if browser supports geolocation and permissions API
  const isGeolocationSupported = 'geolocation' in navigator;
  const isPermissionsSupported = 'permissions' in navigator;

  // Check permission status
  const checkPermissionStatus = useCallback(async () => {
    if (!isGeolocationSupported) {
      setLocation(prev => ({
        ...prev,
        error: 'Geolocation is not supported by your browser',
        loading: false,
        permissionStatus: 'denied'
      }));
      return;
    }

    if (isPermissionsSupported) {
      try {
        const permissionStatus = await navigator.permissions.query({ name: 'geolocation' as PermissionName });
        
        setLocation(prev => ({
          ...prev,
          permissionStatus: permissionStatus.state as 'granted' | 'denied' | 'prompt'
        }));

        permissionStatus.addEventListener('change', () => {
          setLocation(prev => ({
            ...prev,
            permissionStatus: permissionStatus.state as 'granted' | 'denied' | 'prompt'
          }));
        });
      } catch (error) {
        console.error('Error checking permission:', error);
      }
    }
  }, [isGeolocationSupported, isPermissionsSupported]);

  // Function to request location access
  const requestLocationAccess = useCallback(() => {
    if (!isGeolocationSupported) {
      setLocation(prev => ({
        ...prev,
        error: 'Geolocation is not supported by your browser',
        loading: false,
        permissionStatus: 'denied'
      }));
      return Promise.reject('Geolocation not supported');
    }

    return new Promise<GeolocationPosition>((resolve, reject) => {
      const options = {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 10000
      };

      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            error: null,
            loading: false,
            permissionStatus: 'granted'
          });
          resolve(position);
        },
        (error) => {
          let permissionStatus: 'denied' | 'prompt' | 'unknown' = 'unknown';
          
          if (error.code === error.PERMISSION_DENIED) {
            permissionStatus = 'denied';
          } else if (error.code === error.TIMEOUT) {
            permissionStatus = 'prompt';
          }
          
          setLocation(prev => ({
            ...prev,
            error: error.message,
            loading: false,
            permissionStatus
          }));
          reject(error);
        },
        options
      );
    });
  }, [isGeolocationSupported]);

  // Start watching position once permission is granted
  useEffect(() => {
    if (location.permissionStatus !== 'granted') {
      // Check permission status on mount
      checkPermissionStatus();
      return;
    }

    const options = {
      enableHighAccuracy: true,
      maximumAge: 30000,
      timeout: 27000
    };

    const geoSuccess = (position: GeolocationPosition) => {
      setLocation(prev => ({
        ...prev,
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        error: null,
        loading: false
      }));
    };

    const geoError = (error: GeolocationPositionError) => {
      setLocation(prev => ({
        ...prev,
        error: error.message,
        loading: false,
        permissionStatus: error.code === error.PERMISSION_DENIED ? 'denied' : prev.permissionStatus
      }));
    };

    // Set up watch position
    const watchId = navigator.geolocation.watchPosition(
      geoSuccess,
      geoError,
      options
    );

    // Clean up
    return () => navigator.geolocation.clearWatch(watchId);
  }, [location.permissionStatus, checkPermissionStatus]);

  return {
    ...location,
    requestLocationAccess
  };
}
