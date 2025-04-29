import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { View, TextInput, Button, Text, Alert } from 'react-native';
import { signUp, logIn } from '../hooks/useFirebaseAuth';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleLogin = async () => {
    const { user, error } = await logIn(email, password);
    if (error) setErrorMsg(error.message);
    else if (user) {
      console.log('✅ Logged in:', user.email);
      Alert.alert('Success', 'Logged in successfully!');
    }
  };

  const handleSignUp = async () => {
    const { user, error } = await signUp(email, password);
    if (error) setErrorMsg(error.message);
    else if (user) {
      console.log('✅ Account created:', user.email);
      Alert.alert('Success', 'Account created successfully!');
    }
  };

  return (
    <View style={{ padding: 20 }}>
      <TextInput
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        autoCompleteType="email"
      />
      <TextInput
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoCompleteType="password"
      />
      <Button title="Log In" onPress={handleLogin} />
      <Button title="Sign Up" onPress={handleSignUp} />
      {errorMsg ? <Text style={{ color: 'red' }}>{errorMsg}</Text> : null}
    </View>
  );
}