import { getIssueTypeById, getCategoryById } from '@/data/issueTypes';

// Helper function to create an SVG marker icon
export function createSvgMarkerIcon(iconName: string, color: string): string {
  // Get issue type details
  const issueType = getIssueTypeById(iconName);
  
  // If it's a valid issue type, use its color and get icon name
  let iconColor = color;
  let iconToUse = 'circle'; // Default fallback icon
  
  if (issueType) {
    // Use the issue type color
    iconColor = issueType.color;
    iconToUse = issueType.icon || iconToUse;
  } else {
    // If not an issue type ID, check if it's a category ID
    const category = getCategoryById(iconName);
    if (category) {
      iconColor = category.color;
      iconToUse = category.icon || iconToUse;
    }
  }
  
  // SVG path definitions for different icons
  const iconPaths: Record<string, string> = {
    // Road & Traffic
    road: 'M12 4v16M4 4l2 16h12l2-16',
    pothole: 'M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 18a8 8 0 1 1 8-8 8 8 0 0 1-8 8zm-2-9a1 1 0 1 0 1-1 1 1 0 0 0-1 1zm6 0a1 1 0 1 0-1 1 1 1 0 0 0 1-1z',
    paintBucket: 'M14 6.19V4a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v15a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V9M9 10V8h6m-6 6v-2h6',
    signpost: 'M3 3L21 21M9 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-4M13 3l6 6v4m0-4h-6m4-6v6',
    trafficLight: 'M12 2a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2 2 2 0 0 0 2-2V4a2 2 0 0 0-2-2zm0 5a1 1 0 1 1 0 2 1 1 0 0 1 0-2zm0 5a1 1 0 1 1 0 2 1 1 0 0 1 0-2zm0 5a1 1 0 1 1 0 2 1 1 0 0 1 0-2z',
    footprints: 'M2 12h10m-10-4h10m0 8h10m-10-4h10',
    
    // Street Lighting
    lightbulb: 'M9 18h6m-6-4h6m-6-2v-2a6 6 0 1 1 6 0v2M12 2v1',
    lightbulbOff: 'M9 18h6m-6-4h6m-6-2v-2a6 6 0 1 1 6 0v2M16.5 7.5l.5-.5M4 20L20 4',
    
    // Water & Sanitation
    droplets: 'M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5C11 5.5 9.5 8 7.5 9.5S4 13 4 15a7 7 0 0 0 7 7z',
    pipe: 'M12 4v4m-2 6h4m-2 6v-4m-6-6h12',
    gauge: 'M12 14l4-4m-8 0h12a9 9 0 1 1-12 0z',
    toilet: 'M5 22h14M5 2h14m-7 10v5m-2.5-1h5M6 13l6-11 6 11a5 5 0 0 1-12 0z',
    
    // Electricity
    zap: 'M13 2L3 14h9l-1 8 10-12h-9l1-8z',
    bolt: 'M13 2L3 14h9l-1 8 10-12h-9l1-8z',
    
    // Waste Management
    trash: 'M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M10 11v6M14 11v6',
    trashFull: 'M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m-6 5v6m4-6v6',
    wasteBasket: 'M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M8 13h.01M12 13h.01M16 13h.01',
    
    // Public Facilities & Urban Infrastructure
    building: 'M3 21h18M5 21V7l8-4v18m6-14v14M9 9h.01M9 13h.01M9 17h.01M15 9h.01M15 13h.01M15 17h.01',
    playground: 'M8 20v-7l-2-2l2-2V4m8 0v5l2 2l-2 2v7',
    shower: 'M4 22h16M3 10h3v10M18 10h3v10M4 10h16M4 14h16M8 18h8',
    brush: 'M9.06 11.9l8.07-8.06a2.85 2.85 0 1 1 4.04 4.04l-8.06 8.08M7.07 16.97L3 21l5.5-.02 8.55-8.55-4.04-4.04-5.94 8.58z',
    
    // Parks & Recreation
    palmtree: 'M21 8L19 6l-4 4V4l4 4 2-2-4-4-8 8-8-8 6 6v10l4-4v10',
    scissors: 'M6 9a3 3 0 1 1 0 6 3 3 0 0 1 0-6zm12 0a3 3 0 1 1 0 6 3 3 0 0 1 0-6zM6 6V3m0 16v-3m12 3v-3m0-13v3m-18 1l22 7m-22 0l22-7',
    fence: 'M5 21v-7m4 7v-7m4 7v-7m4 7v-7m4 7v-7M4 10h16v4H4z',
    route: 'M9 17H7m8-12l-4 10M9 5H7m12 0h-4l-3 7-4-7H4',
    
    // Environmental & Animal Control
    mountain: 'M8 3l4 8 5-5 5 15H2L8 3z',
    wave: 'M2 6c.5 2 2 4 5 4 4 0 5 2 8 6s2.5 4 5 4c3 0 6-2 6-6',
    paw: 'M19.7 7.5c.3-1 .5-2 .8-3-1-.7-2.3-.3-3.3 1.4-1 1.6-1 4.2 0 5.8 1 1.6 2.3 2 3.3 1.4M4.3 7.5c-.3-1-.5-2-.8-3 1-.7 2.3-.3 3.3 1.4 1 1.6 1 4.2 0 5.8-1 1.6-2.3 2-3.3 1.4m1.8-6.7c1-1.7 2.5-1.2 3.5-.2 1 1 1.8 2.7 1.3 4.7-.5 2-2.5 3.5-4 2.5-1.6-1-1.8-5.3-1-7zm12 0c-1-1.7-2.4-1.2-3.5-.2-1 1-1.8 2.7-1.3 4.7.4 2 2.5 3.5 4 2.5 1.6-1 1.8-5.3 1-7zM12 16c-3.5 0-6 2-6 5h12c0-3-2.5-5-6-5z',
    skull: 'M9 9h.01M15 9h.01M8 14h8m-8 4l2-2h4l2 2M4 6a8 8 0 1 1 16 0v3a8 8 0 0 1-6 7.8V18H10v-1.2A8 8 0 0 1 4 9V6z',
    
    // Misc & UI
    circle: 'M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 18a8 8 0 1 1 8-8 8 8 0 0 1-8 8z',
    grid: 'M10 3H3v7h7V3zm11 0h-7v7h7V3zm0 11h-7v7h7v-7zm-11 0H3v7h7v-7z',
    hammer: 'M15 12l-8.5 8.5c-.83.83-2.17.83-3 0 0 0 0 0 0 0a2.12 2.12 0 0 1 0-3L12 9m5.64-6.99L21 6.37V9h-2.63l-3.99-3.99',
    home: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 0 0 1 1h3m10-11l2 2m-2-2v10a1 1 0 0 1-1 1h-3m-6 0a1 1 0 0 0 1-1v-4a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v4a1 1 0 0 0 1 1h2a1 1 0 0 0 1-1',
    wind: 'M9.59 4.59A2 2 0 1 1 11 8H2m10.59 11.41A2 2 0 1 0 14 16H2m15.73-8.27A2.5 2.5 0 1 1 19.5 12H2',
    info: 'M12 16v-4m0-4h.01M12 22a10 10 0 1 1 0-20 10 10 0 0 1 0 20z'
  };
  
  // Get the path or use default
  const iconPath = iconPaths[iconToUse] || iconPaths.circle;
  
  // Create SVG string with the icon path and color
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="30" height="30">
      <circle cx="12" cy="12" r="10" fill="${iconColor}" opacity="0.85" />
      <path d="${iconPath}" fill="white" stroke="white" stroke-width="0.4" transform="scale(0.75) translate(4, 4)" />
    </svg>
  `;
  
  // Convert SVG to a data URL
  return `data:image/svg+xml;base64,${btoa(svg)}`;
}

// Function to generate an SVG marker icon for an issue
export function getIssueMarkerIcon(issueType: string): any {
  if (!window.google) {
    // If Google Maps API isn't loaded yet, return a placeholder
    return { url: '' };
  }
  
  const issueTypeInfo = getIssueTypeById(issueType);
  const color = issueTypeInfo?.color || '#6b7280'; // Default gray
  const svgUrl = createSvgMarkerIcon(issueType, color);
  
  return {
    url: svgUrl,
    scaledSize: new window.google.maps.Size(30, 30),
    anchor: new window.google.maps.Point(15, 15), // Center the icon
    labelOrigin: new window.google.maps.Point(15, 35) // Position label below the icon
  };
}

// Create a cache object to store markers by issue type
export const markerIconCache: Record<string, any> = {};
