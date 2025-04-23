import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri } from 'expo-auth-session';
import { useEffect } from 'react';
import { auth } from '../firebase/config'; // Your Firebase auth setup
import { GoogleAuthProvider, signInWithCredential } from 'firebase/auth';

WebBrowser.maybeCompleteAuthSession();

export default function useGoogleAuth() {
  const [request, response, promptAsync] = Google.useAuthRequest({
    expoClientId: process.env.EXPO_GOOGLE_CLIENT_ID,
    webClientId: process.env.WEB_GOOGLE_CLIENT_ID,
    iosClientId: process.env.IOS_GOOGLE_CLIENT_ID,
    androidClientId: process.env.ANDROID_CLIENT_ID,
    useProxy: true,
    redirectUri: makeRedirectUri({ useProxy: true }),
  });

  useEffect(() => {
    if (response?.type === 'success') {
      const { id_token } = response.authentication;
      const credential = GoogleAuthProvider.credential(id_token);
      signInWithCredential(auth, credential)
        .then(() => console.log('✅ Firebase login success'))
        .catch((e) => console.error('❌ Firebase login error', e));
    }
  }, [response]);

  return { promptAsync };
}