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
        error: 'Location services not available on this device',
        loading: false,
        permissionStatus: 'denied'
      }));
      return Promise.reject('Geolocation not supported');
    }

    return new Promise<GeolocationPosition>((resolve, reject) => {
      // Detect iOS Safari specifically
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      const isSafari = /Safari/.test(navigator.userAgent) && !/Chrome|CriOS|FxiOS/.test(navigator.userAgent);
      
      // Safari iOS specific settings for better compatibility
      const options = {
        enableHighAccuracy: true, // Essential for infrastructure reporting
        maximumAge: isIOS && isSafari ? 0 : 10000, // Fresh location for Safari iOS
        timeout: isIOS && isSafari ? 30000 : 25000 // Extended timeout for Safari iOS
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
          
          // Safari iOS specific error handling
          if (isIOS && isSafari) {
            if (error.code === error.PERMISSION_DENIED) {
              permissionStatus = 'denied';
              errorMessage = 'Please enable location in Safari settings: Settings > Safari > Location Services';
            } else if (error.code === error.TIMEOUT) {
              permissionStatus = 'prompt';
              errorMessage = 'Location unavailable. Please enable precise location in Safari settings.';
            } else {
              errorMessage = 'Location services unavailable. Check Safari location settings.';
            }
          } else {
            // Standard error messages for other browsers
            if (error.code === error.PERMISSION_DENIED) {
              permissionStatus = 'denied';
              errorMessage = 'Location access denied. Please enable location services.';
            } else if (error.code === error.TIMEOUT) {
              permissionStatus = 'prompt';
              errorMessage = 'Location request timed out. Please try again.';
            } else if (error.code === error.POSITION_UNAVAILABLE) {
              errorMessage = 'Location unavailable. Please check device settings.';
            }
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
    // iOS Safari has different behavior
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    const isSafari = /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent);
    
    if (location.permissionStatus !== 'granted') {
      // Always check permission status on mount, but handle Safari iOS carefully
      checkPermissionStatus();
      return;
    }
    
    const options = {
      enableHighAccuracy: true, // Always enable for precise infrastructure reporting
      maximumAge: isIOS ? 30000 : 10000, // Allow some caching to prevent timeouts
      timeout: isIOS ? 25000 : 30000 // Longer timeout to handle high accuracy requests
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
      
      // Handle Safari iOS timeout errors more gracefully
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
      const isSafari = /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent);
      
      // For Safari iOS timeout errors, show a helpful message instead of generic error
      if (isIOS && isSafari && error.code === error.TIMEOUT) {
        setLocation(prev => ({
          ...prev,
          error: 'Tap "Allow" when Safari asks for location permission',
          loading: false
        }));
        return;
      }
      
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
