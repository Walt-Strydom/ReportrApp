import type { Issue } from '@shared/schema';

/**
 * Municipality configuration interface
 */
interface Municipality {
  name: string;
  code: string;
  boundaries: GeoBoundary[];
  emailDomains: {
    default: string;
    departments: Record<string, string[]>;
  };
}

/**
 * Geographic boundary definition
 */
interface GeoBoundary {
  type: 'polygon' | 'circle';
  coordinates?: number[][]; // For polygon: [lat, lng] pairs
  center?: { lat: number; lng: number }; // For circle
  radius?: number; // For circle in kilometers
}

/**
 * Municipality definitions with geographic boundaries
 */
const municipalities: Municipality[] = [
  {
    name: 'City of Tshwane Metropolitan Municipality',
    code: 'tshwane',
    boundaries: [
      {
        type: 'polygon',
        // Approximate boundaries of Tshwane/Pretoria metropolitan area
        coordinates: [
          [-25.4, 28.0], // Northwest
          [-25.4, 28.6], // Northeast
          [-25.9, 28.6], // Southeast
          [-25.9, 28.0], // Southwest
          [-25.4, 28.0]  // Close polygon
        ]
      }
    ],
    emailDomains: {
      default: '@tshwane.gov.za',
      departments: {
        // Potholes and road maintenance
        'pothole': ['pothole@tshwane.gov.za'],
        'damaged-road': ['pothole@tshwane.gov.za'],
        'road-damage': ['pothole@tshwane.gov.za'],
        
        // Water issues
        'burst-pipe': ['waterleaks@tshwane.gov.za'],
        'leaking-meter': ['waterleaks@tshwane.gov.za'],
        'water-leak': ['waterleaks@tshwane.gov.za'],
        'no-water': ['waterleaks@tshwane.gov.za'],
        
        // Sewer issues
        'blocked-drain': ['SewerBlockages@Tshwane.gov.za'],
        'sewage-spill': ['SewerBlockages@Tshwane.gov.za'],
        'sewer-overflow': ['SewerBlockages@Tshwane.gov.za'],
        'manhole-cover': ['SewerBlockages@Tshwane.gov.za'],
        
        // Street lighting
        'streetlight': ['streetlights@tshwane.gov.za'],
        'street-light': ['streetlights@tshwane.gov.za'],
        'broken-light': ['streetlights@tshwane.gov.za'],
        'light-out': ['streetlights@tshwane.gov.za'],
        
        // Traffic lights
        'trafficlight': ['trafficsignalfaults@tshwane.gov.za'],
        'traffic-light': ['trafficsignalfaults@tshwane.gov.za'],
        'malfunctioning-traffic': ['trafficsignalfaults@tshwane.gov.za'],
        'traffic-signal': ['trafficsignalfaults@tshwane.gov.za'],
        
        // Electricity issues
        'downed-lines': ['electricity@tshwane.gov.za'],
        'damaged-substation': ['electricity@tshwane.gov.za'],
        'open-electrical-box': ['electricity@tshwane.gov.za'],
        'broken-electrical-box': ['electricity@tshwane.gov.za'],
        'power-outage': ['electricity@tshwane.gov.za'],
        'fallen-power-line': ['electricity@tshwane.gov.za'],
        'electrical-hazard': ['electricity@tshwane.gov.za'],
        
        // Waste management
        'overflowing-bin': ['wastemanagement@tshwane.gov.za'],
        'illegal-dumping': ['wastemanagement@tshwane.gov.za'],
        'missed-collection': ['wastemanagement@tshwane.gov.za'],
        'broken-bin': ['wastemanagement@tshwane.gov.za'],
        
        // Environmental concerns
        'damaged-green-space': ['ehonestop@tshwane.gov.za'],
        'tree-damage': ['ehonestop@tshwane.gov.za'],
        'park-maintenance': ['ehonestop@tshwane.gov.za'],
        'environmental-hazard': ['ehonestop@tshwane.gov.za'],
        
        // General/fallback
        'other': ['customercare@tshwane.gov.za'],
        'general': ['customercare@tshwane.gov.za']
      }
    }
  },
  {
    name: 'City of Johannesburg Metropolitan Municipality',
    code: 'johannesburg',
    boundaries: [
      {
        type: 'polygon',
        // Approximate boundaries of Johannesburg metropolitan area (west of Ekurhuleni)
        coordinates: [
          [-25.9, 27.8], // Northwest
          [-25.9, 28.15], // Northeast (just west of Ekurhuleni)
          [-26.4, 28.15], // Southeast (just west of Ekurhuleni)
          [-26.4, 27.8], // Southwest
          [-25.9, 27.8]  // Close polygon
        ]
      }
    ],
    emailDomains: {
      default: '@joburg.org.za',
      departments: {
        // Potholes and road maintenance
        'pothole': ['roads@joburg.org.za'],
        'damaged-road': ['roads@joburg.org.za'],
        'road-damage': ['roads@joburg.org.za'],
        
        // Water issues
        'burst-pipe': ['water@joburg.org.za'],
        'leaking-meter': ['water@joburg.org.za'],
        'water-leak': ['water@joburg.org.za'],
        'no-water': ['water@joburg.org.za'],
        
        // Sewer issues
        'blocked-drain': ['wastewater@joburg.org.za'],
        'sewage-spill': ['wastewater@joburg.org.za'],
        'sewer-overflow': ['wastewater@joburg.org.za'],
        'manhole-cover': ['wastewater@joburg.org.za'],
        
        // Street lighting
        'streetlight': ['electricity@joburg.org.za'],
        'street-light': ['electricity@joburg.org.za'],
        'broken-light': ['electricity@joburg.org.za'],
        'light-out': ['electricity@joburg.org.za'],
        
        // Traffic lights
        'trafficlight': ['traffic@joburg.org.za'],
        'traffic-light': ['traffic@joburg.org.za'],
        'malfunctioning-traffic': ['traffic@joburg.org.za'],
        'traffic-signal': ['traffic@joburg.org.za'],
        
        // Electricity issues
        'downed-lines': ['electricity@joburg.org.za'],
        'damaged-substation': ['electricity@joburg.org.za'],
        'open-electrical-box': ['electricity@joburg.org.za'],
        'broken-electrical-box': ['electricity@joburg.org.za'],
        'power-outage': ['electricity@joburg.org.za'],
        'fallen-power-line': ['electricity@joburg.org.za'],
        'electrical-hazard': ['electricity@joburg.org.za'],
        
        // Waste management
        'overflowing-bin': ['waste@joburg.org.za'],
        'illegal-dumping': ['waste@joburg.org.za'],
        'missed-collection': ['waste@joburg.org.za'],
        'broken-bin': ['waste@joburg.org.za'],
        
        // Environmental concerns
        'damaged-green-space': ['environment@joburg.org.za'],
        'tree-damage': ['environment@joburg.org.za'],
        'park-maintenance': ['environment@joburg.org.za'],
        'environmental-hazard': ['environment@joburg.org.za'],
        
        // General/fallback
        'other': ['callcentre@joburg.org.za'],
        'general': ['callcentre@joburg.org.za']
      }
    }
  },
  {
    name: 'Ekurhuleni Metropolitan Municipality',
    code: 'ekurhuleni',
    boundaries: [
      {
        type: 'polygon',
        // Approximate boundaries of Ekurhuleni (East Rand)
        coordinates: [
          [-25.8, 28.15], // Northwest (east of Johannesburg)
          [-25.8, 28.8], // Northeast
          [-26.5, 28.8], // Southeast
          [-26.5, 28.15], // Southwest (east of Johannesburg)
          [-25.8, 28.15]  // Close polygon
        ]
      }
    ],
    emailDomains: {
      default: '@ekurhuleni.gov.za',
      departments: {
        // All issues route to call centre
        'pothole': ['call.centre@ekurhuleni.gov.za'],
        'damaged-road': ['call.centre@ekurhuleni.gov.za'],
        'road-damage': ['call.centre@ekurhuleni.gov.za'],
        'burst-pipe': ['call.centre@ekurhuleni.gov.za'],
        'leaking-meter': ['call.centre@ekurhuleni.gov.za'],
        'water-leak': ['call.centre@ekurhuleni.gov.za'],
        'no-water': ['call.centre@ekurhuleni.gov.za'],
        'blocked-drain': ['call.centre@ekurhuleni.gov.za'],
        'sewage-spill': ['call.centre@ekurhuleni.gov.za'],
        'sewer-overflow': ['call.centre@ekurhuleni.gov.za'],
        'manhole-cover': ['call.centre@ekurhuleni.gov.za'],
        'streetlight': ['call.centre@ekurhuleni.gov.za'],
        'street-light': ['call.centre@ekurhuleni.gov.za'],
        'broken-light': ['call.centre@ekurhuleni.gov.za'],
        'light-out': ['call.centre@ekurhuleni.gov.za'],
        'trafficlight': ['call.centre@ekurhuleni.gov.za'],
        'traffic-light': ['call.centre@ekurhuleni.gov.za'],
        'malfunctioning-traffic': ['call.centre@ekurhuleni.gov.za'],
        'traffic-signal': ['call.centre@ekurhuleni.gov.za'],
        'downed-lines': ['call.centre@ekurhuleni.gov.za'],
        'damaged-substation': ['call.centre@ekurhuleni.gov.za'],
        'open-electrical-box': ['call.centre@ekurhuleni.gov.za'],
        'broken-electrical-box': ['call.centre@ekurhuleni.gov.za'],
        'power-outage': ['call.centre@ekurhuleni.gov.za'],
        'fallen-power-line': ['call.centre@ekurhuleni.gov.za'],
        'electrical-hazard': ['call.centre@ekurhuleni.gov.za'],
        'overflowing-bin': ['call.centre@ekurhuleni.gov.za'],
        'illegal-dumping': ['call.centre@ekurhuleni.gov.za'],
        'missed-collection': ['call.centre@ekurhuleni.gov.za'],
        'broken-bin': ['call.centre@ekurhuleni.gov.za'],
        'damaged-green-space': ['call.centre@ekurhuleni.gov.za'],
        'tree-damage': ['call.centre@ekurhuleni.gov.za'],
        'park-maintenance': ['call.centre@ekurhuleni.gov.za'],
        'environmental-hazard': ['call.centre@ekurhuleni.gov.za'],
        'other': ['call.centre@ekurhuleni.gov.za'],
        'general': ['call.centre@ekurhuleni.gov.za']
      }
    }
  }
];

/**
 * Check if a point is inside a polygon using ray casting algorithm
 */
function pointInPolygon(lat: number, lng: number, polygon: number[][]): boolean {
  let inside = false;
  
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [xi, yi] = polygon[i];
    const [xj, yj] = polygon[j];
    
    if (((yi > lng) !== (yj > lng)) && (lat < (xj - xi) * (lng - yi) / (yj - yi) + xi)) {
      inside = !inside;
    }
  }
  
  return inside;
}

/**
 * Calculate distance between two points in kilometers
 */
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Determine which municipality a coordinate belongs to
 */
export function getMunicipalityByCoordinates(latitude: number, longitude: number): Municipality | null {
  for (const municipality of municipalities) {
    for (const boundary of municipality.boundaries) {
      if (boundary.type === 'polygon' && boundary.coordinates) {
        if (pointInPolygon(latitude, longitude, boundary.coordinates)) {
          return municipality;
        }
      } else if (boundary.type === 'circle' && boundary.center && boundary.radius) {
        const distance = calculateDistance(
          latitude,
          longitude,
          boundary.center.lat,
          boundary.center.lng
        );
        if (distance <= boundary.radius) {
          return municipality;
        }
      }
    }
  }
  
  return null; // Location not in any defined municipality
}

/**
 * Get department email addresses for an issue based on location and type
 */
export function getDepartmentEmailsByLocation(latitude: number, longitude: number, issueType: string): string[] {
  const defaultEmails = ['waltstrydom@gmail.com']; // Always include Walt's email
  
  // Get the municipality for this location
  const municipality = getMunicipalityByCoordinates(latitude, longitude);
  
  if (!municipality) {
    // If location is not in any defined municipality, use Tshwane as fallback
    console.warn(`Location ${latitude}, ${longitude} not found in any municipality, using Tshwane as fallback`);
    return [
      ...defaultEmails,
      `customercare@tshwane.gov.za` // Generic fallback
    ];
  }
  
  // Get department-specific emails for this municipality
  const departmentEmails = municipality.emailDomains.departments[issueType] || 
                          municipality.emailDomains.departments['general'] ||
                          [`customercare${municipality.emailDomains.default}`];
  
  return [...defaultEmails, ...departmentEmails];
}

/**
 * Get municipality information for display purposes
 */
export function getMunicipalityInfo(latitude: number, longitude: number): {
  name: string;
  code: string;
  found: boolean;
} {
  const municipality = getMunicipalityByCoordinates(latitude, longitude);
  
  if (municipality) {
    return {
      name: municipality.name,
      code: municipality.code,
      found: true
    };
  }
  
  return {
    name: 'Unknown Municipality',
    code: 'unknown',
    found: false
  };
}

/**
 * Get all supported municipalities
 */
export function getAllMunicipalities(): Pick<Municipality, 'name' | 'code'>[] {
  return municipalities.map(m => ({
    name: m.name,
    code: m.code
  }));
}