import React, { useState, useEffect } from 'react';
import {
  View,
  TextInput,
  Text,
  Pressable,
  StyleSheet,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { makeRedirectUri } from 'expo-auth-session';
import { logIn, signUp, googleLoginWithIdToken } from '../hooks/useFirebaseAuth';

WebBrowser.maybeCompleteAuthSession();

export default function AuthScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const [request, response, promptAsync] = Google.useAuthRequest({
    expoClientId: 'YOUR_EXPO_CLIENT_ID.apps.googleusercontent.com',
    iosClientId: 'YOUR_IOS_CLIENT_ID.apps.googleusercontent.com',
    androidClientId: 'YOUR_ANDROID_CLIENT_ID.apps.googleusercontent.com',
    webClientId: 'YOUR_WEB_CLIENT_ID.apps.googleusercontent.com',
    redirectUri: makeRedirectUri({ useProxy: true }),
    useProxy: true,
  });

  useEffect(() => {
    if (response?.type === 'success') {
      const { id_token } = response.authentication;
      setLoading(true);
      googleLoginWithIdToken(id_token).then(({ user, error }) => {
        setLoading(false);
        if (error) setErrorMsg(error.message);
        else {
          navigation.reset({
            index: 0,
            routes: [{ name: 'Tabs', params: { screen: 'Home' } }],
          });
        }
      });
    }
  }, [response]);

  const handleLogin = async () => {
    setLoading(true);
    const { user, error } = await logIn(email, password);
    setLoading(false);
    if (error) setErrorMsg(error.message);
    else {
      navigation.reset({
        index: 0,
        routes: [{ name: 'Tabs', params: { screen: 'Home' } }],
      });
    }
  };

  const handleSignUp = async () => {
    setLoading(true);
    const { user, error } = await signUp(email, password);
    setLoading(false);
    if (error) setErrorMsg(error.message);
    else {
      navigation.reset({
        index: 0,
        routes: [{ name: 'Tabs', params: { screen: 'Home' } }],
      });
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome to NutriScan</Text>

      <TextInput
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        style={styles.input}
        placeholderTextColor="#999"
      />
      <TextInput
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        style={styles.input}
        placeholderTextColor="#999"
      />

      <Pressable style={styles.button} onPress={handleLogin}>
        <Text style={styles.buttonText}>Log In</Text>
      </Pressable>

      <Pressable style={[styles.button, styles.secondaryButton]} onPress={handleSignUp}>
        <Text style={[styles.buttonText, { color: '#444' }]}>Sign Up</Text>
      </Pressable>

      <Text style={styles.or}>──────── OR ────────</Text>

      <Pressable style={styles.googleButton} onPress={() => promptAsync()} disabled={!request}>
        <Image
          source={{ uri: 'https://upload.wikimedia.org/wikipedia/commons/5/53/Google_%22G%22_Logo.svg' }}
          style={styles.googleIcon}
        />
        <Text style={styles.googleButtonText}>Sign in with Google</Text>
      </Pressable>

      {errorMsg ? <Text style={styles.error}>{errorMsg}</Text> : null}
      {loading && <ActivityIndicator size="small" color="#4CAF50" style={{ marginTop: 10 }} />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 28, justifyContent: 'center', backgroundColor: '#f6fef9' },
  title: { fontSize: 24, fontWeight: '600', color: '#2e7d32', textAlign: 'center', marginBottom: 32 },
  input: {
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  button: {
    backgroundColor: '#4CAF50',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 10,
  },
  secondaryButton: { backgroundColor: '#e0e0e0' },
  buttonText: { color: 'white', fontWeight: '600' },
  or: { textAlign: 'center', color: '#888', marginVertical: 20 },
  googleButton: {
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 12,
    borderColor: '#ccc',
    borderWidth: 1,
  },
  googleIcon: { width: 18, height: 18, marginRight: 10 },
  googleButtonText: { fontWeight: '600', color: '#444' },
  error: { color: 'red', marginTop: 10, textAlign: 'center' },
});