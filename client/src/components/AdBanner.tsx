import React from 'react';

export type AdBannerType = 'static' | 'rotating';
export type AdBannerSize = 'small' | 'medium' | 'large';

interface AdBannerProps {
  type: AdBannerType;
  size?: AdBannerSize;
  className?: string;
}

export default function AdBanner({ 
  type = 'static', 
  size = 'medium',
  className = ''
}: AdBannerProps) {
  // Determine height based on size
  const heightClass = 
    size === 'small' ? 'h-16' : 
    size === 'large' ? 'h-32' : 
    'h-20';

  const handleAdClick = () => {
    window.location.href = 'mailto:waltstrydom@gmail.com?subject=Advertising Inquiry - Reportr App';
  };
  
  return (
    <div 
      className={`bg-white rounded-xl overflow-hidden border border-gray-100 shadow-sm cursor-pointer hover:shadow-md transition-shadow ${className}`}
      onClick={handleAdClick}
    >
      <div className="pt-2 pb-1 px-4 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
        <h2 className="text-xs font-medium text-gray-500">
          {type === 'rotating' ? 'Sponsored Content' : 'Sponsored'}
        </h2>
        {type === 'rotating' && (
          <span className="text-xs text-gray-400">Rotating</span>
        )}
      </div>
      <div className="p-4 flex justify-center items-center">
        <div className={`bg-gray-100 rounded w-full ${heightClass} flex items-center justify-center hover:bg-gray-200 transition-colors`}>
          <p className="text-sm text-gray-600 font-medium">
            Advertise here
          </p>
        </div>
      </div>
    </div>
  );
}