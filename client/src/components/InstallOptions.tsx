import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { InfoIcon } from 'lucide-react';
import { FaApple, FaAndroid } from 'react-icons/fa';
import { isIOS, isAndroid, isInstalledPWA } from '@/lib/platform';
import { showIOSInstallInstructions } from './InstallPrompt';

interface InstallOptionsProps {
  minimal?: boolean;
  className?: string;
}

export function InstallOptions({ minimal = false, className = '' }: InstallOptionsProps) {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  
  // Don't show anything if already installed as PWA
  if (isInstalledPWA()) {
    return null;
  }
  
  const handleIOSInstall = () => {
    showIOSInstallInstructions();
  };
  
  const handleAndroidInstall = () => {
    // For Android, we need to show the native install prompt
    if (!deferredPrompt) {
      // If Android installation prompt not available, show an alert
      alert("To install on Android, please use Chrome browser");
      return;
    }
    
    // Show the install prompt immediately
    deferredPrompt.prompt();
    
    // Wait for the user to respond to the prompt
    deferredPrompt.userChoice.then((choiceResult: { outcome: string }) => {
      if (choiceResult.outcome === 'accepted') {
        console.log('User accepted the install prompt');
      } else {
        console.log('User dismissed the install prompt');
      }
      // Clear the saved prompt as it can't be used again
      setDeferredPrompt(null);
    });
  };
  
  // Capture the beforeinstallprompt event for Android
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent Chrome from automatically showing the prompt
      e.preventDefault();
      // Store the event for later use
      setDeferredPrompt(e);
    };
    
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);
  
  if (minimal) {
    // Minimal version shows both iOS and Android buttons as icons
    return (
      <div className={`flex gap-2 ${className}`}>
        <button 
          className="bg-white text-blue-500 hover:bg-gray-100 p-2 rounded-full shadow-sm border border-gray-100 transition-all hover:scale-110"
          onClick={handleIOSInstall}
          aria-label="Install on iOS"
          title="Install on iOS"
        >
          <FaApple className="h-5 w-5" />
        </button>
        
        <button 
          className="bg-white text-green-500 hover:bg-gray-100 p-2 rounded-full shadow-sm border border-gray-100 transition-all hover:scale-110"
          onClick={handleAndroidInstall}
          aria-label="Install on Android"
          title="Install on Android"
        >
          <FaAndroid className="h-5 w-5" />
        </button>
      </div>
    );
  }
  
  // Full version shows both iOS and Android buttons with text
  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      <Button 
        variant="outline"
        className="border-blue-500 text-blue-500 hover:bg-blue-50"
        onClick={handleIOSInstall}
        size="sm"
      >
        <FaApple className="mr-2 h-4 w-4" />
        Install on iOS
      </Button>
      
      <Button 
        variant="outline"
        className="border-green-500 text-green-500 hover:bg-green-50"
        onClick={handleAndroidInstall}
        size="sm"
      >
        <FaAndroid className="mr-2 h-4 w-4" />
        Install on Android
      </Button>
    </div>
  );
}

export default InstallOptions;