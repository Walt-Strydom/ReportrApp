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
    backgroundColor: "#FFFFFF",
    appendUserAgent: "MunicipalityApp/1.0"
  },
  ios: {
    contentInset: 'always',
    allowsLinkPreview: false,
    scrollEnabled: true
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: "#FF8C00",
      androidSplashResourceName: "splash",
      androidScaleType: "CENTER_CROP",
      showSpinner: false
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
    },
    StatusBar: {
      style: "LIGHT",
      backgroundColor: "#FF8C00",
      overlaysWebView: true
    },
    Keyboard: {
      resize: "body",
      style: "DARK",
      resizeOnFullScreen: true
    },
    App: {
      backgroundColor: "#FFFFFF"
    },
    Geolocation: {
      permissions: {
        android: {
          alias: "COARSE"
        }
      }
    }
  }
};

export default config;