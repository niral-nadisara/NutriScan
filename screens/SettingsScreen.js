import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Button,
  Image,
  Alert,
  TouchableOpacity,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { auth } from '../firebase/config';
import { saveUserData, getUserData } from '../firebase/firestoreHelpers';

export default function SettingsScreen({ navigation }) {
  const user = auth.currentUser;
  const [avatar, setAvatar] = useState(null);

  useEffect(() => {
    if (!user) {
      Alert.alert('Login required', 'Please login to view settings.');
      navigation.navigate('Auth');
      return;
    }
    loadProfile();
  }, []);

  const loadProfile = async () => {
    const data = await getUserData();
    if (data?.avatar) setAvatar(data.avatar);
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ base64: true, quality: 0.5 });
    if (!result.canceled) {
      const uri = result.assets[0].uri;
      setAvatar(uri);
      await saveUserData({ avatar: uri });
    }
  };

  const takePhoto = async () => {
    const result = await ImagePicker.launchCameraAsync({ base64: true, quality: 0.5 });
    if (!result.canceled) {
      const uri = result.assets[0].uri;
      setAvatar(uri);
      await saveUserData({ avatar: uri });
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Settings</Text>

      <TouchableOpacity onPress={pickImage}>
        <Image
          source={avatar ? { uri: avatar } : require('../assets/avatar_placeholder.png')}
          style={styles.avatar}
        />
      </TouchableOpacity>

      <Button title="Take a New Photo" onPress={takePhoto} />

      <View style={styles.section}>
        <Button title="Preferences" onPress={() => navigation.navigate('Preferences')} />
      </View>

      <View style={styles.section}>
        <Button
          title="Logout"
          color="#d32f2f"
          onPress={() => {
            auth.signOut().then(() =>
              navigation.reset({ index: 0, routes: [{ name: 'Auth' }] })
            );
          }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24 },
  title: { fontSize: 24, fontWeight: '600', marginBottom: 20 },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignSelf: 'center',
    marginBottom: 16,
  },
  section: { marginVertical: 10 },
});