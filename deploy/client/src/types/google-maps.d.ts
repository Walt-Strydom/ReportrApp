/// <reference types="google.maps" />

declare global {
  interface Window {
    google: typeof google;
  }
}

// This is needed for the @googlemaps/js-api-loader
declare module '@googlemaps/js-api-loader' {
  export interface LoaderOptions {
    apiKey: string;
    version?: string;
    libraries?: string[];
    language?: string;
    region?: string;
    retries?: number;
    channel?: string;
    mapIds?: string[];
    authReferrerPolicy?: string;
  }
  
  export class Loader {
    constructor(options: LoaderOptions);
    load(): Promise<typeof google>;
  }
}