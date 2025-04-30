import { auth, sendPasswordResetEmail } from '../firebase/config';
import React, { useState } from 'react';
import { View, TextInput, Button, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ImageBackground } from 'react-native';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');

  const handleReset = async () => {
    if (!email) {
      alert("Please enter your email address.");
      return;
    }
  
    try {
      await sendPasswordResetEmail(auth, email);
      alert(`A password reset link has been sent to ${email}`);
    } catch (error) {
      console.error(error);
      alert("Failed to send reset email. Please check the email address and try again.");
    }
  };

  return (
    <ImageBackground
          source={require('../assets/home_bg.png')}
          style={StyleSheet.absoluteFill}
          resizeMode="cover"
        >
          <LinearGradient colors={['#E0F7FAAA', '#B2EBF2AA']} style={styles.container}>
            <View style={styles.overlay}>
              <View style={styles.container}>
                <Text style={styles.heading}>Reset Password</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Enter your email"
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    keyboardType="email-address"
                />
                <Button title="Send Reset Link" onPress={handleReset} />
              </View>
            </View>
          </LinearGradient>
    </ImageBackground>
        );
        }

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  heading: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  input: {
    width: '100%',
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    marginBottom: 16,
    paddingLeft: 8,
    borderRadius: 5,
  },
  overlay: {
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    borderRadius: 12,
    height: '50%',
  },
});