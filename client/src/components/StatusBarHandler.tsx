import { useEffect } from 'react';

interface StatusBarHandlerProps {
  children: React.ReactNode;
}

const StatusBarHandler: React.FC<StatusBarHandlerProps> = ({ children }) => {
  useEffect(() => {
    // Configure status bar for mobile apps when running in Capacitor
    const setupStatusBar = async () => {
      if (window.hasOwnProperty('Capacitor')) {
        try {
          // @ts-ignore - StatusBar will be available at runtime in Capacitor environment
          const { StatusBar } = window.Capacitor.Plugins;
          
          // Set status bar color to match app theme
          await StatusBar.setBackgroundColor({ color: '#FF8C00' });
          
          // Set white text for the status bar
          await StatusBar.setStyle({ style: 'LIGHT' });
          
          // Make the status bar translucent
          await StatusBar.setOverlaysWebView({ overlay: true });
        } catch (error) {
          console.error('Error configuring status bar:', error);
        }
      }
    };

    setupStatusBar();
  }, []);

  return <>{children}</>;
};

export default StatusBarHandler;