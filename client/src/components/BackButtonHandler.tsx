import { useEffect } from 'react';
import { useLocation } from 'wouter';

interface BackButtonHandlerProps {
  children: React.ReactNode;
}

const BackButtonHandler: React.FC<BackButtonHandlerProps> = ({ children }) => {
  const [location, setLocation] = useLocation();
  
  useEffect(() => {
    // Handle the hardware back button on Android devices
    const handleBackButton = () => {
      if (location !== '/') {
        setLocation('/');
        return true; // Prevent default behavior
      }
      return false; // Allow default behavior (exit app)
    };

    // Check if we're running in a Capacitor environment with the Android platform
    const setupBackButtonHandler = async () => {
      // The condition checks if the global 'Capacitor' object exists and if the platform is Android
      if (window.hasOwnProperty('Capacitor') && 
          // @ts-ignore - Capacitor will be available at runtime in native apps
          window.Capacitor.getPlatform() === 'android') {
        try {
          // @ts-ignore - App will be available at runtime in Capacitor environment
          const { App } = window.Capacitor.Plugins;
          App.addListener('backButton', handleBackButton);
          
          return () => {
            App.removeAllListeners();
          };
        } catch (error) {
          console.error('Error setting up back button handler:', error);
        }
      }
    };

    setupBackButtonHandler();
    
    // Cleanup
    return () => {
      if (window.hasOwnProperty('Capacitor')) {
        try {
          // @ts-ignore - App will be available at runtime in Capacitor environment
          const { App } = window.Capacitor.Plugins;
          App.removeAllListeners();
        } catch (error) {
          console.error('Error cleaning up back button handler:', error);
        }
      }
    };
  }, [location, setLocation]);

  return <>{children}</>;
};

export default BackButtonHandler;