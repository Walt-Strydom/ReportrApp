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
  
  return (
    <div className={`bg-white rounded-xl overflow-hidden border border-gray-100 shadow-sm ${className}`}>
      <div className="pt-2 pb-1 px-4 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
        <h2 className="text-xs font-medium text-gray-500">
          {type === 'rotating' ? 'Sponsored Content' : 'Sponsored'}
        </h2>
        {type === 'rotating' && (
          <span className="text-xs text-gray-400">Rotating</span>
        )}
      </div>
      <div className="p-4 flex justify-center items-center">
        <div className={`bg-gray-100 rounded w-full ${heightClass} flex items-center justify-center`}>
          <p className="text-sm text-gray-500">
            {type === 'rotating' ? 'Rotating Ad Banner' : 'Ad Banner'}
          </p>
        </div>
      </div>
    </div>
  );
}