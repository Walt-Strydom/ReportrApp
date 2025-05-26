import { useTranslation } from 'react-i18next';
import { MapPin, ListFilter, AlertTriangle, Map } from 'lucide-react';

interface BottomNavigationProps {
  onReportButtonClick: () => void;
  onMapButtonClick: () => void;
  onNearbyButtonClick: () => void;
}

export default function BottomNavigation({ 
  onReportButtonClick, 
  onMapButtonClick, 
  onNearbyButtonClick 
}: BottomNavigationProps) {
  const { t } = useTranslation();
  
  return (
    <div 
      className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50"
      style={{paddingBottom: 'max(16px, env(safe-area-inset-bottom))'}}
    >
      {/* Floating action button for reporting */}
      <div className="absolute left-1/2 -translate-x-1/2 -top-6">
        <button
          onClick={onReportButtonClick}
          className="flex items-center justify-center rounded-full bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg transform transition-transform hover:scale-105 active:scale-95 touch-manipulation"
          style={{width: '56px', height: '56px', minWidth: '44px', minHeight: '44px'}}
          aria-label={t('nav.report', 'Report Issue')}
        >
          <AlertTriangle className="h-6 w-6" />
        </button>
      </div>
      
      {/* Navigation bar */}
      <div className="flex items-center px-4" style={{height: '64px'}}>
        {/* Map button */}
        <button 
          onClick={onMapButtonClick}
          className="flex flex-col items-center justify-center flex-1 h-full text-gray-600 hover:text-primary transition-colors touch-manipulation"
          style={{minWidth: '44px', minHeight: '44px'}}
          aria-label={t('nav.map', 'View Map')}
        >
          <Map className="h-5 w-5" />
          <span className="text-xs mt-1 font-medium">{t('nav.map', 'Map')}</span>
        </button>
        
        {/* Empty space for the center button */}
        <div className="w-16"></div>
        
        {/* Nearby button */}
        <button
          onClick={onNearbyButtonClick}
          className="flex flex-col items-center justify-center flex-1 h-full text-gray-600 hover:text-primary transition-colors touch-manipulation"
          style={{minWidth: '44px', minHeight: '44px'}}
          aria-label={t('nav.nearby', 'Nearby Issues')}
        >
          <ListFilter className="h-5 w-5" />
          <span className="text-xs mt-1 font-medium">{t('nav.nearby', 'Nearby')}</span>
        </button>
      </div>
    </div>
  );
}
