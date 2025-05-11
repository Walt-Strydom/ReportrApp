import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { DownloadIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export function InstallPrompt() {
  const { t } = useTranslation();
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent Chrome 67 and earlier from automatically showing the prompt
      e.preventDefault();
      // Store the event for later use
      setDeferredPrompt(e);
      // Show the install button
      setShowInstallPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = () => {
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
            <h3 className="font-bold">{t('install.title', 'Install Lokisa App')}</h3>
            <p className="text-sm">{t('install.description', 'Add to your home screen for easier access')}</p>
          </div>
          <Button 
            className="ml-4 bg-white text-primary hover:bg-gray-100" 
            onClick={handleInstallClick}
          >
            <DownloadIcon className="mr-2 h-4 w-4" />
            {t('install.button', 'Install')}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default InstallPrompt;