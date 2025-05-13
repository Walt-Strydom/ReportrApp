import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { 
  SmartphoneIcon, 
  PhoneIcon,
  InfoIcon
} from 'lucide-react';
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
      // If we don't have the deferred prompt, we need to show the instructions
      showIOSInstallInstructions(); // Reuse the iOS instructions dialog
      return;
    }
    
    // Show the install prompt
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
    // Minimal version shows just the buttons with an icon
    return (
      <div className={`flex gap-2 ${className}`}>
        {isIOS() && (
          <button 
            className="bg-white text-blue-500 hover:bg-gray-100 p-2 rounded-full shadow-sm border border-gray-100 transition-all hover:scale-110"
            onClick={handleIOSInstall}
            aria-label="Install on iOS"
          >
            <PhoneIcon className="h-5 w-5" />
          </button>
        )}
        
        {isAndroid() && (
          <button 
            className="bg-white text-green-500 hover:bg-gray-100 p-2 rounded-full shadow-sm border border-gray-100 transition-all hover:scale-110"
            onClick={handleAndroidInstall}
            aria-label="Install on Android"
          >
            <SmartphoneIcon className="h-5 w-5" />
          </button>
        )}
      </div>
    );
  }
  
  // Full version shows buttons with text
  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {isIOS() && (
        <Button 
          variant="outline"
          className="border-blue-500 text-blue-500 hover:bg-blue-50"
          onClick={handleIOSInstall}
          size="sm"
        >
          <PhoneIcon className="mr-2 h-4 w-4" />
          Install on iOS
        </Button>
      )}
      
      {isAndroid() && (
        <Button 
          variant="outline"
          className="border-green-500 text-green-500 hover:bg-green-50"
          onClick={handleAndroidInstall}
          size="sm"
        >
          <SmartphoneIcon className="mr-2 h-4 w-4" />
          Install on Android
        </Button>
      )}
      
      {!isIOS() && !isAndroid() && (
        <Button 
          variant="outline"
          className="border-primary text-primary hover:bg-primary/10"
          onClick={handleIOSInstall} // Fallback to showing iOS instructions
          size="sm"
        >
          <InfoIcon className="mr-2 h-4 w-4" />
          How to Install
        </Button>
      )}
    </div>
  );
}

export default InstallOptions;