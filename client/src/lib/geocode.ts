interface GeocodeResult {
  address: string;
  error?: string;
}

export async function reverseGeocode(latitude: number, longitude: number): Promise<GeocodeResult> {
  try {
    // Get API key from environment
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    
    if (!apiKey) {
      throw new Error('Google Maps API key is missing');
    }
    
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${apiKey}`
    );
    
    if (!response.ok) {
      throw new Error('Geocoding request failed');
    }
    
    const data = await response.json();
    
    if (data.status !== 'OK') {
      throw new Error(`Geocoding error: ${data.status}`);
    }
    
    // Get the most accurate result (usually the first one)
    const result = data.results[0];
    return {
      address: result.formatted_address
    };
  } catch (error) {
    console.error('Reverse geocoding error:', error);
    return {
      address: `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`, // Fallback to coordinates
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}
