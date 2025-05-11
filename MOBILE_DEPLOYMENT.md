# Lokisa Mobile Deployment Guide

This guide explains how to deploy the Lokisa app to Android and iOS platforms using Capacitor.

## Prerequisites

Before proceeding with mobile deployment, ensure you have the following installed:

### For Android:
- [Android Studio](https://developer.android.com/studio)
- Android SDK
- Java Development Kit (JDK)
- Gradle

### For iOS:
- macOS operating system
- [Xcode](https://developer.apple.com/xcode/)
- CocoaPods

## Preparing for Deployment

1. Build the web application and sync with Capacitor:
   ```bash
   ./cap-sync.sh
   ```

2. Add the Android and iOS platforms (only needed once):
   ```bash
   ./cap-add-platforms.sh
   ```

## Android Deployment

### Development and Testing

1. Open the Android project in Android Studio:
   ```bash
   npx cap open android
   ```

2. Run the app on an emulator or physical device from Android Studio.

### Production Build

1. Update the `android/app/build.gradle` file to set the app version and build number.

2. Generate a signed APK or App Bundle:
   - In Android Studio, go to Build > Generate Signed Bundle/APK
   - Follow the prompts to create or use an existing keystore
   - Select the build variant (release)
   - Complete the signing process

3. The APK or AAB file will be generated in the `android/app/build/outputs/` directory.

4. Upload the AAB file to the Google Play Console to publish your app.

## iOS Deployment

### Development and Testing

1. Open the iOS project in Xcode:
   ```bash
   npx cap open ios
   ```

2. Set your Team ID and Bundle Identifier in Xcode.

3. Run the app on a simulator or physical device from Xcode.

### Production Build

1. Update the version and build number in Xcode under the app target's General tab.

2. Configure the app's signing settings in Xcode:
   - Select the appropriate provisioning profile
   - Ensure you have a valid distribution certificate

3. Archive the app for distribution:
   - Select Product > Archive in Xcode
   - In the Archives window, click Distribute App
   - Follow the prompts to create an IPA file or upload directly to App Store Connect

4. Upload the build to TestFlight or App Store via Xcode or App Store Connect.

## Updating the App

When you make changes to the web application, follow these steps to update the mobile apps:

1. Build the web app and sync with Capacitor:
   ```bash
   ./cap-sync.sh
   ```

2. Open the platform-specific projects and build:
   ```bash
   npx cap open android  # For Android
   npx cap open ios      # For iOS
   ```

3. Test thoroughly before releasing a new version.

## Troubleshooting

- **Build Errors**: Make sure all native dependencies are properly installed.
- **Splash Screen Issues**: Verify images in the resources directory meet the requirements.
- **Plugin Problems**: Check that any Capacitor plugins are properly configured in capacitor.config.ts.

## Additional Resources

- [Capacitor Documentation](https://capacitorjs.com/docs)
- [Android Developer Documentation](https://developer.android.com/docs)
- [iOS Developer Documentation](https://developer.apple.com/documentation/)