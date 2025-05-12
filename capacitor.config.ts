import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.municipality.app',
  appName: 'Municipality',
  webDir: 'client/dist',
  server: {
    androidScheme: 'https',
    iosScheme: 'https',
    hostname: 'municipality.app'
  },
  android: {
    allowMixedContent: true,
    captureInput: true,
    webContentsDebuggingEnabled: true,
    backgroundColor: "#FFFFFF"
  },
  ios: {
    contentInset: 'always',
    allowsLinkPreview: false,
    scrollEnabled: true
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 3000,
      backgroundColor: "#FF8C00",
      androidSplashResourceName: "splash",
      androidScaleType: "CENTER_CROP"
    },
    CapacitorHttp: {
      enabled: true
    },
    CapacitorCookies: {
      enabled: true
    },
    WebView: {
      allowFileAccess: true,
      allowFileAccessFromFileURLs: true,
      allowUniversalAccessFromFileURLs: true
    }
  }
};

export default config;
