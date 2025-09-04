import React, { useEffect, useState } from 'react';
import { Button, Platform, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';

// Client IDs provided by the user
const IOS_CLIENT_ID = '99604197598-s1f2s14gtoffdt3rtkmu479275etl5l4.apps.googleusercontent.com';
// This is typically a Web client ID (has a client secret file in GCP). It's safe to include the ID (not the secret) in app code.
const WEB_CLIENT_ID = '99604197598-njco2u6op9f73d6qpjo779fkkkrka826.apps.googleusercontent.com';

export default function Index() {
  const [user, setUser] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    GoogleSignin.configure({
      iosClientId: IOS_CLIENT_ID,
      // Setting webClientId enables getting idToken on Android (and iOS) without Firebase config files
      webClientId: WEB_CLIENT_ID,
      scopes: ['profile', 'email'],
    });
  }, []);

  const onSignIn = async () => {
    setError(null);
    try {
      if (Platform.OS === 'android') {
        await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      }
      const info = await GoogleSignin.signIn();
      setUser(info);
      // If you need tokens:
      // const tokens = await GoogleSignin.getTokens();
      // console.log('Tokens:', tokens);
    } catch (e: any) {
      if (e?.code === statusCodes.SIGN_IN_CANCELLED) {
        setError('Sign in cancelled');
      } else if (e?.code === statusCodes.IN_PROGRESS) {
        setError('Sign in in progress');
      } else if (e?.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        setError('Google Play Services not available or outdated');
      } else {
        setError(e?.message || 'Unknown error');
      }
    }
  };

  const onSignOut = async () => {
    try {
      await GoogleSignin.signOut();
      setUser(null);
      setError(null);
    } catch (e: any) {
      setError(e?.message || 'Error signing out');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Google Sign-In Demo</Text>
        {!user ? (
          <Button title="Sign in with Google" onPress={onSignIn} />
        ) : (
          <>
            <Text style={styles.text}>
              Signed in as: {user?.user?.email ?? user?.user?.name ?? '(no email returned)'}
            </Text>
            {!user?.user?.email ? (
              <Text style={styles.hint}>
                Hint: Ensure the 'email' scope is enabled and the Google account shares email.
              </Text>
            ) : null}
            <View style={{ height: 12 }} />
            <Button title="Sign out" onPress={onSignOut} />
          </>
        )}
        {error ? <Text style={styles.error}>{error}</Text> : null}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  title: { fontSize: 22, fontWeight: '600', marginBottom: 16 },
  text: { marginTop: 12, fontSize: 16 },
  hint: { marginTop: 4, fontSize: 12, color: '#666' },
  error: { marginTop: 12, color: 'red' },
});
