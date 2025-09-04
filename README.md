# Google Sign-In (Expo SDK 53) — iOS & Android Simulators

This README is a step-by-step, production-quality reference for integrating Google Sign-In into the `google-poc` app using the Google Cloud Console. It covers two supported approaches and explains how to test on iOS Simulator and Android Emulator.

- App slug: `google-poc`
- Bundle IDs: iOS `com.mattenarle10.googlepoc`, Android `com.mattenarle10.googlepoc`
- Current scheme in `app.json`: `googlepoc`
- Expo SDK: 53

If you follow this guide exactly, you will be able to sign in with a Google account on both iOS and Android simulators.

## Approaches

- Recommended (native): `@react-native-google-signin/google-signin`
  - Officially recommended by Expo for Google auth.
  - Requires an Expo Development Build (can’t run in Expo Go).
  - Best long-term path for production.

- Alternative (web OAuth): `expo-auth-session/providers/google`
  - Browser-based OAuth flow.
  - Can run in Expo Go and dev builds.
  - Useful for quick iteration; fewer native config steps.

Both work on iOS Simulator and Android Emulator when configured correctly.

---

## 1) Google Cloud Console Setup (do this first)

You can set up with or without Firebase. These steps use Google Cloud Console directly (no Firebase), which works great with both approaches.

1. Create a project (or select an existing one) in Google Cloud Console.
2. Configure the OAuth consent screen (External or Internal) and add your test users if needed.
3. Create OAuth client IDs:
   - iOS: set Bundle ID to `com.mattenarle10.googlepoc`.
   - Android: set Package name to `com.mattenarle10.googlepoc` and provide a SHA-1 certificate fingerprint.
     - Android debug keystore SHA-1 (typical for local builds):
       ```bash
       keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android
       ```
       Copy the SHA1 line into the Android OAuth client ID config.
   - Optional Web Client (only needed for server auth/refresh tokens): create a Web application client and record its Client ID.

**Current project debug fingerprints (local dev build)**

- Android package: `com.mattenarle10.googlepoc`
- Debug SHA-1 (app module keystore used by this build):
  `5E:8F:16:06:2E:A3:CD:2C:4A:0D:54:78:76:BA:A6:F3:8C:AB:F6:25`
- Alternative debug SHA-1 (default keystore at `~/.android/debug.keystore`):
  `02:4B:B3:A5:B4:86:4C:B4:A6:9A:C5:D4:C7:B4:05:6E:93:31:FA:36`

Use the first SHA-1 for this project’s current Android OAuth client in Google Cloud Console. If you ever build/sign using the default `~/.android/debug.keystore`, add the second SHA-1 to another Android OAuth client.

Keep the resulting Client IDs handy:
- iOS Client ID: looks like `1234567890-xxxxxxx.apps.googleusercontent.com`
- Android Client ID: looks like `1234567890-yyyyyyy.apps.googleusercontent.com`
- Web Client ID (optional): looks like `1234567890-zzzzzzz.apps.googleusercontent.com`

> Tip: For the native library, iOS also needs an iOS URL scheme that corresponds to the iOS Client ID (often called the “reversed client ID”). The config plugin takes care of this for you when you pass `iosUrlScheme`.

---

## 2) Recommended: Native Google Sign-In library

Docs:
- Expo guide (Using Google authentication): https://docs.expo.dev/guides/google-authentication/
- Library (Expo setup): https://react-native-google-signin.github.io/docs/setting-up/expo

### Install

```bash
npm i @react-native-google-signin/google-signin
```

### Add the config plugin

Update your `app.json` to add the plugin. You are NOT using Firebase files in this path, so pass `iosUrlScheme` from your iOS client configuration.

`app.json` snippet:
```json
{
  "expo": {
    "name": "google-poc",
    "slug": "google-poc",
    "scheme": "googlepoc",
    "ios": { "bundleIdentifier": "com.mattenarle10.googlepoc" },
    "android": { "package": "com.mattenarle10.googlepoc" },
    "plugins": [
      "expo-router",
      [
        "@react-native-google-signin/google-signin",
        { "iosUrlScheme": "com.googleusercontent.apps.<YOUR_IOS_CLIENT_ID_SUFFIX>" }
      ]
    ]
  }
}
```

How to get `iosUrlScheme`:
- From the Google Cloud Console iOS OAuth client, take the iOS Client ID and use it as the URL scheme value (it often already starts with `com.googleusercontent.apps.`). If you’ve used Firebase before, this is the same as `REVERSED_CLIENT_ID` from `GoogleService-Info.plist`.
- If you instead integrate via Firebase, place `GoogleService-Info.plist` (iOS) and `google-services.json` (Android) into your project and use the plugin without `iosUrlScheme` (see the library docs for the Firebase variant).

### Make a dev build

This library requires a development build (won’t work in Expo Go):

```bash
npm run ios   # or: npx expo run:ios
npm run android   # or: npx expo run:android
```

### Minimal usage

```ts
import { useEffect } from 'react';
import { Button, Platform } from 'react-native';
import { GoogleSignin } from '@react-native-google-signin/google-signin';

export default function SignInButton() {
  useEffect(() => {
    GoogleSignin.configure({
      // Provide platform client IDs from Cloud Console
      iosClientId: '<YOUR_IOS_CLIENT_ID>.apps.googleusercontent.com',
      // webClientId is optional unless you need server-side refresh tokens
      // webClientId: '<YOUR_WEB_CLIENT_ID>.apps.googleusercontent.com',
    });
  }, []);

  const onPress = async () => {
    if (Platform.OS === 'android') {
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    }
    const user = await GoogleSignin.signIn();
    const tokens = await GoogleSignin.getTokens(); // { idToken, accessToken }
    // TODO: use tokens.idToken to verify in your backend, or access Google APIs with accessToken
  };

  return <Button title="Sign in with Google" onPress={onPress} />;
}
```

### iOS & Android testing notes

- iOS: The config plugin injects the URL scheme so the Google SDK can return to your app. If sign-in closes immediately, double-check `iosUrlScheme` matches your iOS Client ID.
- Android: Ensure the exact package name and SHA-1 fingerprint are in the Android OAuth client. If you see `DEVELOPER_ERROR`, it’s almost always the SHA-1.

---

## 3) Alternative: Expo AuthSession (browser-based)

Docs:
- AuthSession API: https://docs.expo.dev/versions/latest/sdk/auth-session/
- Authentication guide (providers): https://docs.expo.dev/guides/authentication/

This approach works in Expo Go and dev builds and is quick to wire up. Provide the native client IDs you created in Cloud Console.

```ts
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { useEffect } from 'react';

WebBrowser.maybeCompleteAuthSession();

export default function GoogleAuthSessionButton() {
  const [request, response, promptAsync] = Google.useAuthRequest({
    iosClientId: '<YOUR_IOS_CLIENT_ID>.apps.googleusercontent.com',
    androidClientId: '<YOUR_ANDROID_CLIENT_ID>.apps.googleusercontent.com',
    scopes: ['profile', 'email']
  });

  useEffect(() => {
    if (response?.type === 'success') {
      // response.authentication contains accessToken / idToken
      // e.g., response.authentication?.idToken
    }
  }, [response]);

  return (
    <Button
      title="Sign in with Google"
      disabled={!request}
      onPress={() => promptAsync()}
    />
  );
}
```

Redirects on native are handled automatically (no proxy needed) using your app’s scheme (`googlepoc`). For web support you would add authorized origins/redirect URIs for your dev server.

> Note on the legacy auth proxy: Expo’s `auth.expo.io` proxy is deprecated for security reasons and is not recommended. If you must reference it, it follows `https://auth.expo.io/@<account>/<project>`. For your account it would be `https://auth.expo.io/@mattenarle10/google-poc`, but prefer the native redirect flow above.

---

## 4) Troubleshooting checklist

- iOS:
  - App opens and immediately closes the Google sheet: your `iosUrlScheme` probably doesn’t match the iOS Client ID.
  - “App not configured” style errors: ensure the iOS OAuth client’s Bundle ID is `com.mattenarle10.googlepoc`.
- Android:
  - `DEVELOPER_ERROR` or `10`: verify the SHA-1 fingerprint used for the Android OAuth client.
  - On first run, ensure Google Play Services are available (`hasPlayServices`).
- General:
  - Make sure device date/time are correct.
  - If you changed `app.json` plugins or identifiers, rebuild your dev client (`expo run:ios` / `expo run:android`).

---

## 5) Quick start commands

```bash
# Install the native library (recommended path)
npm i @react-native-google-signin/google-signin

# Rebuild dev clients after editing app.json plugins
npm run ios
npm run android
```

---

## 6) References (authoritative)

- Expo — Using Google authentication: https://docs.expo.dev/guides/google-authentication/
- React Native Google Sign-In — Expo setup: https://react-native-google-signin.github.io/docs/setting-up/expo
- Expo — AuthSession API: https://docs.expo.dev/versions/latest/sdk/auth-session/
- Expo — Authentication guide (OAuth providers): https://docs.expo.dev/guides/authentication/
- Google Cloud Console — OAuth consent screen and credentials: https://console.cloud.google.com/apis/credentials
