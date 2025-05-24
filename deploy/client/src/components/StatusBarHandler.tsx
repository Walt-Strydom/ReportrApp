import { useEffect } from 'react';

interface StatusBarHandlerProps {
  children: React.ReactNode;
}

const StatusBarHandler = ({ children }: StatusBarHandlerProps) => {
  useEffect(() => {
    // Configure status bar for mobile apps when running in Capacitor
    const setupStatusBar = async () => {
      // Check if we're in a browser environment first to avoid errors
      if (typeof window === 'undefined') return;
      
      // Check for Capacitor safely
      if (window.hasOwnProperty('Capacitor')) {
        try {
          // @ts-ignore - StatusBar will be available at runtime in Capacitor environment
          const { StatusBar } = window.Capacitor.Plugins;
          
          // First check if StatusBar plugin is available
          if (!StatusBar) {
            console.warn('StatusBar plugin not available');
            return;
          }
          
          console.log('Configuring status bar for mobile app...');
          
          // Configure with a small delay to ensure device is ready
          setTimeout(async () => {
            try {
              // Set status bar color to match app theme (orange)
              await StatusBar.setBackgroundColor({ color: '#FF8C00' });
              
              // Set white text for better contrast on the orange background
              await StatusBar.setStyle({ style: 'LIGHT' });
              
              // Make the status bar translucent to blend with the app
              await StatusBar.setOverlaysWebView({ overlay: true });
              
              console.log('Status bar configured successfully');
            } catch (innerError) {
              console.error('Error in status bar configuration:', innerError);
            }
          }, 500);
        } catch (error) {
          console.error('Error accessing StatusBar plugin:', error);
        }
      } else {
        console.log('Not running in Capacitor environment, status bar unchanged');
      }
    };

    setupStatusBar();
    
    // No cleanup needed for StatusBar
  }, []);

  return <>{children}</>;
};

export default StatusBarHandler;