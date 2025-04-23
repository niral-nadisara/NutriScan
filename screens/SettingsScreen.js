const avatarOptions = [
  require('../assets/avatars/avatar1.png'),
  require('../assets/avatars/avatar2.png'),
  require('../assets/avatars/avatar3.png'),
  require('../assets/avatars/avatar4.png'),
];
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

const getAvatarImage = (avatar) => {
  const avatarMap = {
    'avatar1.png': require('../assets/avatars/avatar1.png'),
    'avatar2.png': require('../assets/avatars/avatar2.png'),
    'avatar3.png': require('../assets/avatars/avatar3.png'),
    'avatar4.png': require('../assets/avatars/avatar4.png'),
  };

  return avatarMap[avatar] || require('../assets/avatar_placeholder.png');
};

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
    try {
      const data = await getUserData();
      if (data?.avatar) {
        const avatarValue = typeof data.avatar === 'string' ? data.avatar : null;
        setAvatar(avatarValue);
        console.log('✅ Loaded avatar from user profile:', avatarValue);
      }
    } catch (err) {
      console.error('Failed to load avatar from user profile:', err);
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ base64: true, quality: 0.5 });
    if (!result.canceled) {
      const uri = result.assets[0].uri;
      setAvatar(uri);
      console.log('📸 Selected image or photo URI:', uri);
      await saveUserData({ avatar: uri });
    }
  };

  const takePhoto = async () => {
    const result = await ImagePicker.launchCameraAsync({ base64: true, quality: 0.5 });
    if (!result.canceled) {
      const uri = result.assets[0].uri;
      setAvatar(uri);
      console.log('📸 Selected image or photo URI:', uri);
      await saveUserData({ avatar: uri });
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Settings</Text>

      <TouchableOpacity onPress={pickImage}>
        <Image
          source={
            typeof avatar === 'string'
              ? avatar.startsWith('file://') || avatar.startsWith('http')
                ? { uri: avatar }
                : getAvatarImage(avatar)
              : require('../assets/avatar_placeholder.png')
          }
          style={styles.avatar}
        />
      </TouchableOpacity>

      <View style={{ marginVertical: 12 }}>
        <Text style={{ fontWeight: '600', marginBottom: 6 }}>Choose an avatar:</Text>
        <View style={{ flexDirection: 'row', justifyContent: 'space-evenly' }}>
          {avatarOptions.map((icon, index) => (
            <TouchableOpacity
              key={index}
              onPress={async () => {
                try {
                  const assetUri = Image.resolveAssetSource(icon).uri;
                  const assetName = assetUri.match(/avatar\d\.png/)?.[0] ?? 'avatar1.png';
                  setAvatar(assetName);
                  console.log('🖼️ Selected in-app avatar:', assetName);
                  if (auth.currentUser) {
                    await saveUserData({ avatar: assetName });
                  }
                } catch (error) {
                  console.error('Failed to save avatar:', error);
                  Alert.alert('Error', 'Unable to save avatar. Please try again.');
                }
              }}
            >
              <Image
                source={icon}
                style={{
                  width: 60,
                  height: 60,
                  borderRadius: 30,
                  borderWidth:
                    avatar && avatar === (Image.resolveAssetSource(icon).uri.match(/avatar\d\.png/)?.[0] ?? 'avatar1.png')
                      ? 2
                      : 0,
                  borderColor: '#4caf50',
                  marginHorizontal: 6,
                }}
              />
            </TouchableOpacity>
          ))}
        </View>
      </View>

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