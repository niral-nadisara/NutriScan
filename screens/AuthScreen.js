import React, { useState, useEffect } from 'react';
import {
  View,
  TextInput,
  Text,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  ImageBackground,
  Image,
  TouchableOpacity
} from 'react-native';
import PropTypes from 'prop-types';
import { LinearGradient } from 'expo-linear-gradient';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { makeRedirectUri } from 'expo-auth-session';
import { logIn, signUp, googleLoginWithIdToken } from '../hooks/useFirebaseAuth';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Ionicons from 'react-native-vector-icons/Ionicons';
import HomeScreen from './HomeScreen';

WebBrowser.maybeCompleteAuthSession();


export default function AuthScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSignUpMode, setIsSignUpMode] = useState(false);

  const [request, response, promptAsync] = Google.useAuthRequest({
    expoClientId: process.env.EXPO_GOOGLE_CLIENT_ID,
    webClientId: process.env.WEB_GOOGLE_CLIENT_ID,
    iosClientId: process.env.IOS_GOOGLE_CLIENT_ID,
    androidClientId: process.env.ANDROID_CLIENT_ID,
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
    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      setLoading(false);
      return;
    }
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
    <ImageBackground
      source={require('../assets/home_bg.png')}
      style={styles.background}
      resizeMode="cover"
    >
      <LinearGradient colors={['#E0F7FAAA', '#B2EBF2AA']} style={styles.container}>
        <View style={styles.formOverlay}>
          <Text style={styles.title}>
            {isSignUpMode ? 'Create an Account' : 'Welcome to SafeBites'}
          </Text>

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
          {isSignUpMode && (
            <TextInput
              placeholder="Confirm Password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              style={styles.input}
              placeholderTextColor="#999"
            />
          )}

          <Pressable onPress={() => navigation.navigate('ForgotPassword')}>
            <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
          </Pressable>

          <Pressable style={styles.button} onPress={isSignUpMode ? handleSignUp : handleLogin}>
            <Text style={styles.buttonText}>{isSignUpMode ? 'Sign Up' : 'Log In'}</Text>
          </Pressable>

          <Pressable
            style={[styles.button, styles.secondaryButton]}
            onPress={() => setIsSignUpMode(!isSignUpMode)}
          >
            <Text style={[styles.buttonText, { color: '#444' }]}>
              {isSignUpMode ? 'Back to Log In' : 'Create Account'}
            </Text>
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
      </LinearGradient>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  container: { flex: 1, padding: 28, justifyContent: 'center' },
  formOverlay: {
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    padding: 24,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 5,
  },
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
    backgroundColor: 'rgba(235, 16, 16, 0.8)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 12,
    borderColor: '#ccc',
    borderWidth: 1,
  },
  googleIcon: { width: 18, height: 18, marginRight: 10 },
  googleButtonText: { fontWeight: '600', color: 'white' },
  error: {
    backgroundColor: 'rgba(255, 0, 0, 0.1)',
    borderLeftWidth: 4,
    borderLeftColor: '#e53935',
    padding: 12,
    marginTop: 16,
    color: '#c62828',
    fontWeight: '500',
    borderRadius: 8,
    textAlign: 'left',
  },
  forgotPasswordText: {
    color: '#1565c0',
    textAlign: 'right',
    marginBottom: 16,
    textDecorationLine: 'underline',
    fontWeight: '500',
  },
});

AuthScreen.propTypes = {
  navigation: PropTypes.object,
};