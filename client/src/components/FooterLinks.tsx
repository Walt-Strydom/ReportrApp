import React from 'react';

const FooterLinks = () => {
  return (
    <div className="fixed bottom-16 left-0 right-0 flex justify-center items-center p-2 z-10 text-xs text-gray-500 bg-white/90 backdrop-blur-sm border-t border-gray-100">
      <div className="flex flex-wrap justify-center space-x-3 px-2">
        <a 
          href="/mobile-guide.html" 
          target="_blank" 
          rel="noopener noreferrer" 
          className="hover:text-orange-500 transition-colors py-1"
        >
          Mobile Guide
        </a>
        <span>|</span>
        <a 
          href="/privacy.html" 
          target="_blank" 
          rel="noopener noreferrer" 
          className="hover:text-orange-500 transition-colors py-1"
        >
          Privacy Policy
        </a>
        <span>|</span>
        <a 
          href="/terms.html" 
          target="_blank" 
          rel="noopener noreferrer" 
          className="hover:text-orange-500 transition-colors py-1"
        >
          Terms of Service
        </a>
        <span>|</span>
        <span className="text-gray-400 py-1">© 2025 Lokisa</span>
      </div>
    </div>
  );
};

export default FooterLinks;