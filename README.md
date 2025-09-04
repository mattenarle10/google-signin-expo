# Google Sign-In (Expo SDK 53)

This repo shows how to get **Google Sign-In working on iOS + Android (simulators)** with Expo SDK 53.
It’s a repeatable guide you can follow to wire it into your own project.

---

## ✅ TODO

* [ ] Integrate Firebase user management (save user in DynamoDB)
* [ ] Add Facebook login alongside Google
* [ ] Handle logout flow 🔓
* [ ] Test on both iOS + Android physical devices


---

## 🚀 Quick Start

```bash
git clone https://github.com/<your-org>/google-poc.git
cd google-poc
npm install

# requires a dev build (not Expo Go)
npm run ios
npm run android
```

IDs used in this repo:

* iOS Bundle ID: `com.mattenarle10.googlepoc`
* Android Package: `com.mattenarle10.googlepoc`
* Scheme: `googlepoc`

---

## 1️⃣ Google Cloud Console Setup

1. Go to Google Cloud Console → Credentials

2. Create OAuth client IDs:

   * iOS → Bundle ID `com.mattenarle10.googlepoc`
   * Android → Package `com.mattenarle10.googlepoc` + SHA-1 from your debug keystore:

     ```bash
     keytool -list -v \
       -keystore ~/.android/debug.keystore \
       -alias androiddebugkey \
       -storepass android -keypass android
     ```

3. Keep the client IDs handy

---

## 2️⃣ Native Google Sign-In (Recommended)

```bash
npm install @react-native-google-signin/google-signin
```

Add plugin in `app.json`:

```json
{
  "expo": {
    "scheme": "googlepoc",
    "ios": { "bundleIdentifier": "com.mattenarle10.googlepoc" },
    "android": { "package": "com.mattenarle10.googlepoc" },
    "plugins": [
      [
        "@react-native-google-signin/google-signin",
        { "iosUrlScheme": "com.googleusercontent.apps.<YOUR_IOS_CLIENT_ID_SUFFIX>" }
      ]
    ]
  }
}
```

Minimal usage:

```tsx
import { useEffect } from 'react';
import { Button, Platform } from 'react-native';
import { GoogleSignin } from '@react-native-google-signin/google-signin';

export default function SignInButton() {
  useEffect(() => {
    GoogleSignin.configure({
      iosClientId: '<YOUR_IOS_CLIENT_ID>.apps.googleusercontent.com',
    });
  }, []);

  const onPress = async () => {
    if (Platform.OS === 'android') {
      await GoogleSignin.hasPlayServices();
    }
    const user = await GoogleSignin.signIn();
    const tokens = await GoogleSignin.getTokens();
    console.log(user, tokens);
  };

  return <Button title="🔑 Sign in with Google" onPress={onPress} />;
}
```

---

## 3️⃣ Firebase Integration

If you want Firebase Auth:

```bash
npm install @react-native-firebase/app @react-native-firebase/auth
```

Add `google-services.json` + `GoogleService-Info.plist`, then:

```ts
import auth from '@react-native-firebase/auth';

const { idToken } = await GoogleSignin.getTokens();
const cred = auth.GoogleAuthProvider.credential(idToken);
await auth().signInWithCredential(cred);
```

---

## Troubleshooting

* iOS closes instantly → wrong/missing `iosUrlScheme`
* Android `DEVELOPER_ERROR` → wrong SHA-1 in GCP
* After changing `app.json` → rebuild dev client

---

## References

* [Expo: Google Auth](https://docs.expo.dev/guides/google-authentication/)
* [Google Sign-In Docs](https://react-native-google-signin.github.io/docs/setting-up/expo)
