import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { DownloadIcon, SmartphoneIcon, AppleIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { isIOS, isAndroid, isInstalledPWA, isRunningInCapacitor } from '@/lib/platform';

export function InstallPrompt() {
  const { t } = useTranslation();
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [promptType, setPromptType] = useState<'android' | 'ios' | 'standard'>('standard');

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
      // Show the install button
      setShowInstallPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = () => {
    // For iOS, we just need to hide the prompt and mark as shown
    if (promptType === 'ios') {
      localStorage.setItem('iosPromptShown', 'true');
      setShowInstallPrompt(false);
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
      } else {
        console.log('User dismissed the install prompt');
      }
      // Clear the saved prompt as it can't be used again
      setDeferredPrompt(null);
      setShowInstallPrompt(false);
    });
  };

  if (!showInstallPrompt) return null;

  return (
    <div className="fixed bottom-20 inset-x-0 px-4 z-50">
      <div className="bg-primary text-white rounded-lg p-4 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h3 className="font-bold">
              {promptType === 'ios' 
                ? t('install.ios.title', 'Install on iOS') 
                : promptType === 'android'
                  ? t('install.android.title', 'Install on Android')
                  : t('install.title', 'Install Lokisa App')}
            </h3>
            <p className="text-sm">
              {promptType === 'ios' 
                ? t('install.ios.description', 'Tap Share then "Add to Home Screen"') 
                : t('install.description', 'Add to your home screen for easier access')}
            </p>
          </div>
          
          {promptType === 'ios' ? (
            <Button 
              className="ml-4 bg-white text-primary hover:bg-gray-100" 
              onClick={handleInstallClick}
            >
              <span className="mr-2">✕</span>
              {t('install.got_it', 'Got it')}
            </Button>
          ) : (
            <Button 
              className="ml-4 bg-white text-primary hover:bg-gray-100" 
              onClick={handleInstallClick}
            >
              {promptType === 'android' ? (
                <SmartphoneIcon className="mr-2 h-4 w-4" />
              ) : (
                <DownloadIcon className="mr-2 h-4 w-4" />
              )}
              {t('install.button', 'Install')}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export default InstallPrompt;