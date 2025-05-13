import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { 
  DownloadIcon, 
  SmartphoneIcon, 
  XIcon, 
  InfoIcon, 
  ArrowDownIcon, 
  PhoneIcon
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { isIOS, isAndroid, isInstalledPWA, isRunningInCapacitor } from '@/lib/platform';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function InstallPrompt() {
  const { t } = useTranslation();
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [promptType, setPromptType] = useState<'android' | 'ios' | 'standard'>('standard');
  const [showMinimalButton, setShowMinimalButton] = useState(false);
  
  useEffect(() => {
    // Don't show prompts in these conditions
    if (isInstalledPWA() || isRunningInCapacitor()) {
      return;
    }

    // iOS-specific prompt
    if (isIOS()) {
      // Only show iOS prompt if not already shown in this session
      if (!localStorage.getItem('iosPromptShown')) {
        setPromptType('ios');
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
    // For iOS, we just need to hide the prompt and mark as shown
    if (promptType === 'ios') {
      localStorage.setItem('iosPromptShown', 'true');
      setShowInstallPrompt(false);
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

  // Render the minimal floating action button
  if (showMinimalButton && !showInstallPrompt) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <button 
              className="fixed right-4 top-20 z-50 bg-white text-primary hover:bg-gray-100 p-3 rounded-full shadow-lg border border-gray-100 transition-all hover:scale-110"
              onClick={handleInstallClick}
              aria-label="Install App"
            >
              {promptType === 'ios' ? (
                <PhoneIcon className="h-5 w-5" />
              ) : promptType === 'android' ? (
                <SmartphoneIcon className="h-5 w-5" />
              ) : (
                <DownloadIcon className="h-5 w-5" />
              )}
            </button>
          </TooltipTrigger>
          <TooltipContent side="left">
            <p>{t('install.minimal_tooltip', 'Install app for easier access')}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // Don't render anything if no prompts are active
  if (!showInstallPrompt) return null;

  // Render the full prompt banner
  return (
    <div className="fixed bottom-20 inset-x-0 px-4 z-50 animate-in fade-in slide-in-from-bottom-5 duration-300">
      <div className="bg-white border border-primary/20 text-gray-800 rounded-xl p-4 shadow-lg max-w-md mx-auto">
        <div className="flex items-start">
          <div className="mr-3 mt-1 text-primary">
            {promptType === 'ios' ? (
              <PhoneIcon className="h-5 w-5" />
            ) : promptType === 'android' ? (
              <SmartphoneIcon className="h-5 w-5" />
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
                ? t('install.ios.description', 'Tap Share then "Add to Home Screen" for easier access') 
                : t('install.description', 'Add to your home screen for offline access and faster performance')}
            </p>
            
            <div className="flex justify-end gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleDismiss}
                className="text-sm"
              >
                {t('install.dismiss', 'Not now')}
              </Button>
              
              <Button 
                className="bg-primary hover:bg-primary/90 text-white text-sm"
                size="sm"
                onClick={handleInstallClick}
              >
                {promptType === 'ios' ? t('install.got_it', 'Got it') : t('install.button', 'Install App')}
                <ArrowDownIcon className="ml-1 h-3 w-3" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default InstallPrompt;