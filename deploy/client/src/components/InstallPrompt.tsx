import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { 
  DownloadIcon, 
  SmartphoneIcon, 
  XIcon, 
  InfoIcon, 
  ArrowDownIcon, 
  PhoneIcon,
  ShareIcon,
  PlusIcon
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { isIOS, isAndroid, isInstalledPWA, isRunningInCapacitor } from '@/lib/platform';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

// Global state to coordinate installation prompts
const globalInstallState = {
  showIOSInstructions: false,
  setShowIOSInstructions: (show: boolean) => {}
};

// Function to directly show iOS installation instructions
export function showIOSInstallInstructions() {
  globalInstallState.setShowIOSInstructions(true);
}

export function InstallPrompt() {
  const { t } = useTranslation();
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [promptType, setPromptType] = useState<'android' | 'ios' | 'standard'>('standard');
  const [showMinimalButton, setShowMinimalButton] = useState(false);
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);
  
  // Register the state setter with the global object
  useEffect(() => {
    globalInstallState.setShowIOSInstructions = setShowIOSInstructions;
    return () => {
      globalInstallState.setShowIOSInstructions = () => {};
    };
  }, []);
  
  // Use refs to store images of iOS install instructions
  const iosInstructionsRef = useRef<HTMLImageElement | null>(null);
  
  useEffect(() => {
    // Don't show prompts in these conditions
    if (isInstalledPWA() || isRunningInCapacitor()) {
      return;
    }

    // iOS-specific prompt
    if (isIOS()) {
      // Set the prompt type to iOS
      setPromptType('ios');
      
      // Only show iOS prompt if not already shown in this session
      if (!localStorage.getItem('iosPromptShown')) {
        setShowInstallPrompt(true);
      } else {
        // Show minimalist button for iOS
        setShowMinimalButton(true);
      }
      return;
    }

    // Android / PWA install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent Chrome from automatically showing the prompt
      e.preventDefault();
      // Store the event for later use
      setDeferredPrompt(e);
      setPromptType(isAndroid() ? 'android' : 'standard');
      
      // Check if user has previously dismissed the full prompt
      const promptDismissed = localStorage.getItem('installPromptDismissed');
      if (promptDismissed) {
        // Show minimal button instead
        setShowMinimalButton(true);
      } else {
        // Show the full prompt
        setShowInstallPrompt(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Show minimal install button even if the event hasn't fired yet
    if (!isIOS() && !localStorage.getItem('appInstalled')) {
      setTimeout(() => {
        if (!showInstallPrompt && !showMinimalButton) {
          setShowMinimalButton(true);
        }
      }, 3000);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, [showInstallPrompt, showMinimalButton]);

  const handleInstallClick = () => {
    // For iOS, open detailed install instructions
    if (promptType === 'ios') {
      // Mark as shown so the full prompt doesn't appear again
      localStorage.setItem('iosPromptShown', 'true');
      
      // Hide the initial prompt
      setShowInstallPrompt(false);
      
      // Show the detailed iOS instructions dialog
      setShowIOSInstructions(true);
      
      // Keep showing the minimal button for future access to instructions
      setShowMinimalButton(true);
      return;
    }

    // For Android/standard web, show the native install prompt
    if (!deferredPrompt) return;

    // Show the install prompt
    deferredPrompt.prompt();

    // Wait for the user to respond to the prompt
    deferredPrompt.userChoice.then((choiceResult: { outcome: string }) => {
      if (choiceResult.outcome === 'accepted') {
        console.log('User accepted the install prompt');
        localStorage.setItem('appInstalled', 'true');
        setShowMinimalButton(false);
      } else {
        console.log('User dismissed the install prompt');
        localStorage.setItem('installPromptDismissed', 'true');
        setShowMinimalButton(true);
      }
      // Clear the saved prompt as it can't be used again
      setDeferredPrompt(null);
      setShowInstallPrompt(false);
    });
  };

  const handleDismiss = () => {
    localStorage.setItem('installPromptDismissed', 'true');
    setShowInstallPrompt(false);
    setShowMinimalButton(true);
  };

  // iOS installation instructions dialog
  const IosInstructionsDialog = () => (
    <Dialog open={showIOSInstructions} onOpenChange={(open) => setShowIOSInstructions(open)}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <PhoneIcon className="mr-2 h-5 w-5 text-primary" />
            Install Reportr App on iOS
          </DialogTitle>
          <DialogDescription>
            Follow these steps to add Reportr to your Home Screen for faster access and offline support.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 my-2 text-sm">
          <div className="flex items-start space-x-2 p-2 rounded-md bg-gray-50">
            <div className="flex-shrink-0 bg-primary text-white rounded-full p-1.5">
              <span className="text-xs font-bold">1</span>
            </div>
            <div>
              <p className="font-medium">Tap the Share button in Safari</p>
              <p className="text-xs text-gray-500 mt-1">Find the Share icon <ShareIcon className="inline h-3 w-3" /> at the bottom of your screen (iPhone) or top of your screen (iPad)</p>
            </div>
          </div>
          
          <div className="flex items-start space-x-2 p-2 rounded-md bg-gray-50">
            <div className="flex-shrink-0 bg-primary text-white rounded-full p-1.5">
              <span className="text-xs font-bold">2</span>
            </div>
            <div>
              <p className="font-medium">Scroll down and tap "Add to Home Screen"</p>
              <p className="text-xs text-gray-500 mt-1">Look for the option with a <PlusIcon className="inline h-3 w-3" /> icon</p>
            </div>
          </div>
          
          <div className="flex items-start space-x-2 p-2 rounded-md bg-gray-50">
            <div className="flex-shrink-0 bg-primary text-white rounded-full p-1.5">
              <span className="text-xs font-bold">3</span>
            </div>
            <div>
              <p className="font-medium">Tap "Add" in the top right corner</p>
              <p className="text-xs text-gray-500 mt-1">The Reportr app will be added to your Home Screen</p>
            </div>
          </div>
        </div>
        
        <div className="mt-4">
          <Button 
            className="w-full" 
            onClick={() => setShowIOSInstructions(false)}
          >
            Got it
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );

  // No more floating install buttons
  if (showMinimalButton && !showInstallPrompt) {
    return (
      <>
        {/* iOS instructions dialog */}
        <IosInstructionsDialog />
      </>
    );
  }

  // Don't render anything if no prompts are active
  if (!showInstallPrompt && !showIOSInstructions) return null;
  
  // Render iOS instructions dialog if open
  if (showIOSInstructions) {
    return <IosInstructionsDialog />;
  }

  // Render the full prompt banner
  return (
    <div className="fixed bottom-20 inset-x-0 px-4 z-50 animate-in fade-in slide-in-from-bottom-5 duration-300">
      <div className="bg-white border border-primary/20 text-gray-800 rounded-xl p-4 shadow-lg max-w-md mx-auto">
        <div className="flex items-start">
          <div className="mr-3 mt-1 text-primary">
            {promptType === 'ios' ? (
              <PhoneIcon className="h-5 w-5 text-blue-500" />
            ) : promptType === 'android' ? (
              <SmartphoneIcon className="h-5 w-5 text-green-500" />
            ) : (
              <DownloadIcon className="h-5 w-5" />
            )}
          </div>
          
          <div className="flex-1">
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-semibold text-gray-900">
                {promptType === 'ios' 
                  ? t('install.ios.title', 'Install on iOS') 
                  : promptType === 'android'
                    ? t('install.android.title', 'Install on Android')
                    : t('install.title', 'Install Municipality App')}
              </h3>
              <button 
                onClick={handleDismiss} 
                className="text-gray-400 hover:text-gray-600"
                aria-label="Dismiss"
              >
                <XIcon className="h-4 w-4" />
              </button>
            </div>
            
            <p className="text-sm text-gray-600 mb-3">
              {promptType === 'ios' 
                ? t('install.ios.description', 'Install this app on your iPhone/iPad for faster access and offline support') 
                : t('install.description', 'Add to your home screen for offline access and faster performance')}
            </p>
            
            {/* Platform-specific buttons */}
            <div className="flex flex-wrap justify-end gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleDismiss}
                className="text-sm"
              >
                {t('install.dismiss', 'Not now')}
              </Button>
              
              {/* iOS Button */}
              {isIOS() && (
                <Button 
                  className="bg-blue-500 hover:bg-blue-600 text-white text-sm"
                  size="sm"
                  onClick={handleInstallClick}
                >
                  <PhoneIcon className="mr-1 h-3 w-3" />
                  {t('install.ios.button', 'Show iOS Steps')}
                </Button>
              )}
              
              {/* Android Button */}
              {isAndroid() && (
                <Button 
                  className="bg-green-500 hover:bg-green-600 text-white text-sm"
                  size="sm"
                  onClick={handleInstallClick}
                >
                  <SmartphoneIcon className="mr-1 h-3 w-3" />
                  {t('install.android.button', 'Install on Android')}
                </Button>
              )}
              
              {/* Generic Button */}
              {!isIOS() && !isAndroid() && (
                <Button 
                  className="bg-primary hover:bg-primary/90 text-white text-sm"
                  size="sm"
                  onClick={handleInstallClick}
                >
                  {t('install.button', 'Install App')}
                  <ArrowDownIcon className="ml-1 h-3 w-3" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default InstallPrompt;