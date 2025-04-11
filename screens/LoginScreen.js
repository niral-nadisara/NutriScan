import React, { useState } from 'react';
import { View, TextInput, Button, Text } from 'react-native';
import { signUp, logIn } from '../hooks/useFirebaseAuth';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleLogin = async () => {
    const { user, error } = await logIn(email, password);
    if (error) setErrorMsg(error.message);
    else console.log('✅ Logged in:', user.email);
  };

  const handleSignUp = async () => {
    const { user, error } = await signUp(email, password);
    if (error) setErrorMsg(error.message);
    else console.log('✅ Account created:', user.email);
  };

  return (
    <View style={{ padding: 20 }}>
      <TextInput placeholder="Email" value={email} onChangeText={setEmail} autoCapitalize="none" />
      <TextInput placeholder="Password" value={password} onChangeText={setPassword} secureTextEntry />
      <Button title="Log In" onPress={handleLogin} />
      <Button title="Sign Up" onPress={handleSignUp} />
      {errorMsg ? <Text style={{ color: 'red' }}>{errorMsg}</Text> : null}
    </View>
  );
}