import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri } from 'expo-auth-session';
import { useEffect } from 'react';
import { auth } from '../firebase/config'; // Your Firebase auth setup
import { GoogleAuthProvider, signInWithCredential } from 'firebase/auth';

WebBrowser.maybeCompleteAuthSession();

export default function useGoogleAuth() {
  const [request, response, promptAsync] = Google.useAuthRequest({
    expoClientId: '1075499022021-7pv1l5m9e5lg822mbgvk74eo11gib6sf.apps.googleusercontent.com',
    webClientId: '1075499022021-7pv1l5m9e5lg822mbgvk74eo11gib6sf.apps.googleusercontent.com',
    iosClientId: 'YOUR_IOS_CLIENT_ID.apps.googleusercontent.com',
    androidClientId: 'YOUR_ANDROID_CLIENT_ID.apps.googleusercontent.com',
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