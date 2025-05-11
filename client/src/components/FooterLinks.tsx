import React from 'react';

const FooterLinks = () => {
  return (
    <div className="fixed bottom-0 left-0 right-0 flex justify-center items-center p-2 z-10 text-xs text-gray-500 bg-white/80 backdrop-blur-sm border-t border-gray-100">
      <div className="flex space-x-5">
        <a 
          href="/mobile-guide.html" 
          target="_blank" 
          rel="noopener noreferrer" 
          className="hover:text-orange-500 transition-colors"
        >
          Mobile Guide
        </a>
        <span>|</span>
        <a 
          href="/privacy.html" 
          target="_blank" 
          rel="noopener noreferrer" 
          className="hover:text-orange-500 transition-colors"
        >
          Privacy Policy
        </a>
        <span>|</span>
        <a 
          href="/terms.html" 
          target="_blank" 
          rel="noopener noreferrer" 
          className="hover:text-orange-500 transition-colors"
        >
          Terms of Service
        </a>
        <span>|</span>
        <span className="text-gray-400">© 2025 Lokisa</span>
      </div>
    </div>
  );
};

export default FooterLinks;