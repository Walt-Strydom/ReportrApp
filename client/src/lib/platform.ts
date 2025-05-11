/**
 * Helper functions to detect platform and environment conditions
 */

/**
 * Check if the app is running in a Capacitor native container
 */
export function isRunningInCapacitor(): boolean {
  return window.hasOwnProperty('Capacitor');
}

/**
 * Check if the current browser supports the Web Share API
 */
export function supportsWebShare(): boolean {
  return navigator.share !== undefined;
}

/**
 * Check if the app is running on iOS
 */
export function isIOS(): boolean {
  return /iPhone|iPad|iPod/i.test(navigator.userAgent);
}

/**
 * Check if the app is running on Android
 */
export function isAndroid(): boolean {
  return /Android/i.test(navigator.userAgent);
}

/**
 * Check if the app is opened from the iOS App Store
 */
export function isFromAppStore(): boolean {
  return (window.navigator as any).standalone === true;
}

/**
 * Check if the app is opened from the Google Play Store
 */
export function isFromPlayStore(): boolean {
  if (!isAndroid()) return false;
  
  // This is a basic check - in a real app, you might need a more comprehensive solution
  return isRunningInCapacitor() || window.matchMedia('(display-mode: standalone)').matches;
}

/**
 * Check if the app is installed as a PWA
 */
export function isInstalledPWA(): boolean {
  return window.matchMedia('(display-mode: standalone)').matches || 
         (window.navigator as any).standalone === true;
}

/**
 * Check if the device supports native camera access
 */
export function supportsNativeCamera(): boolean {
  return isRunningInCapacitor() || ('mediaDevices' in navigator && 'getUserMedia' in navigator.mediaDevices);
}