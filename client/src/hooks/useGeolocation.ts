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
      // iOS Safari has different behavior - lower timeout, less strict high accuracy
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
      
      const options = {
        enableHighAccuracy: !isIOS, // Disable high accuracy on iOS to improve reliability
        maximumAge: isIOS ? 60000 : 0, // Increase cache time on iOS
        timeout: isIOS ? 30000 : 10000 // Longer timeout on iOS to avoid premature errors
      };

      console.log('Requesting location with options:', options);
      console.log('Device detected as iOS:', isIOS);

      navigator.geolocation.getCurrentPosition(
        (position) => {
          console.log('Location obtained successfully');
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
          console.error('Location error:', error.code, error.message);
          let permissionStatus: 'denied' | 'prompt' | 'unknown' = 'unknown';
          let errorMessage = error.message;
          
          // More descriptive error messages
          if (error.code === error.PERMISSION_DENIED) {
            permissionStatus = 'denied';
            errorMessage = 'Location access denied. Please enable location services in your device settings.';
          } else if (error.code === error.TIMEOUT) {
            permissionStatus = 'prompt';
            errorMessage = 'Location request timed out. Please check your connection and try again.';
          } else if (error.code === error.POSITION_UNAVAILABLE) {
            errorMessage = 'Unable to determine your location. Please check your device settings.';
          }
          
          setLocation(prev => ({
            ...prev,
            error: errorMessage,
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

    // iOS Safari has different behavior
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    
    const options = {
      enableHighAccuracy: !isIOS, // Disable high accuracy on iOS to improve reliability
      maximumAge: isIOS ? 60000 : 30000, // Increase cache time on iOS
      timeout: isIOS ? 30000 : 27000 // Longer timeout on iOS
    };

    console.log('Setting up watchPosition with options:', options);

    const geoSuccess = (position: GeolocationPosition) => {
      console.log('Watch position updated successfully');
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
      console.error('Watch position error:', error.code, error.message);
      let errorMessage = error.message;
      
      // More descriptive error messages
      if (error.code === error.PERMISSION_DENIED) {
        errorMessage = 'Location access denied. Please enable location services in your device settings.';
      } else if (error.code === error.TIMEOUT) {
        errorMessage = 'Location request timed out. Please check your connection and try again.';
      } else if (error.code === error.POSITION_UNAVAILABLE) {
        errorMessage = 'Unable to determine your location. Please check your device settings.';
      }
      
      setLocation(prev => ({
        ...prev,
        error: errorMessage,
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
