import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { WifiOffIcon } from 'lucide-react';
import { triggerSync } from '@/lib/db';

export function OfflineIndicator() {
  const { t } = useTranslation();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [hasPendingChanges, setHasPendingChanges] = useState(false);

  // Check for pending offline changes in IndexedDB
  const checkForPendingChanges = async () => {
    try {
      // This is a placeholder for actual IndexedDB operation
      // In a real implementation, we would check if there are any
      // pending reports or support actions in the database
      const db = await window.indexedDB.open('lokisa', 1);
      // Logic to check for pending changes
    } catch (error) {
      console.error('Error checking for pending changes:', error);
    }
  };

  useEffect(() => {
    // Initialize network status
    setIsOnline(navigator.onLine);
    
    // Check for pending changes
    checkForPendingChanges();
    
    // Set up event listeners for online/offline status
    const handleOnline = () => {
      setIsOnline(true);
      // When we come online, attempt to sync any pending changes
      triggerSync();
    };
    
    const handleOffline = () => {
      setIsOnline(false);
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // If online and no pending changes, don't show anything
  if (isOnline && !hasPendingChanges) {
    return null;
  }

  return (
    <div className={`fixed bottom-20 inset-x-0 z-50 flex justify-center pointer-events-none`}>
      <div 
        className={`
          ${isOnline ? 'bg-blue-500' : 'bg-gray-700'} 
          text-white px-4 py-2 rounded-full shadow-lg
          flex items-center space-x-2 pointer-events-auto
        `}
      >
        <WifiOffIcon className="h-4 w-4" />
        <span className="text-sm font-medium">
          {isOnline 
            ? t('offline.queuedChanges') 
            : t('offline.status')}
        </span>
      </div>
    </div>
  );
}

export default OfflineIndicator;