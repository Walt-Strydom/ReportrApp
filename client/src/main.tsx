import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import { Workbox } from 'workbox-window';
// Import i18n configuration
import './lib/i18n';

// Register the service worker
if ('serviceWorker' in navigator) {
  const wb = new Workbox('/sw.js');
  
  wb.addEventListener('activated', (event) => {
    if (event.isUpdate) {
      console.log('Service worker updated');
      // Force reload to ensure new content is displayed
      window.location.reload();
    } else {
      console.log('Service worker activated for the first time');
    }
  });

  // Handle installation prompt for mobile devices
  let deferredPrompt: any;
  window.addEventListener('beforeinstallprompt', (e) => {
    // Prevent Chrome 67 and earlier from automatically showing the prompt
    e.preventDefault();
    // Stash the event so it can be triggered later
    deferredPrompt = e;
    
    // Show your own UI to notify the user they can install the PWA
    console.log('App can be installed - showing install prompt');
    // You could show an install button here
  });
  
  wb.register().catch(error => {
    console.error('Service worker registration failed:', error);
  });
}

createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <App />
    </TooltipProvider>
  </QueryClientProvider>
);
