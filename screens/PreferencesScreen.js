import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Switch, ScrollView, Alert } from 'react-native';
import { auth } from '../firebase/config';
import { saveUserData, getUserData } from '../firebase/firestoreHelpers';

export default function PreferencesScreen({ navigation }) {
  const [prefs, setPrefs] = useState({
    hideAdditives: false,
    preferOrganic: false,
    preferVegan: false,
    avoidSodium: false,
    avoidAllergens: false,
    ecoPackaging: false,
  });

  useEffect(() => {
    if (!auth.currentUser) {
      Alert.alert('Login required', 'Please login to update preferences.');
      navigation.navigate('Auth');
      return;
    }
    loadPrefs();
  }, []);

  const loadPrefs = async () => {
    const data = await getUserData();
    if (data?.preferences) setPrefs(data.preferences);
  };

  const updatePref = async (key, value) => {
    const updated = { ...prefs, [key]: value };
    setPrefs(updated);
    await saveUserData({ preferences: updated });
    Alert.alert('Preferences updated!');
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Your Preferences</Text>
      {Object.keys(prefs).map((key) => (
        <View style={styles.option} key={key}>
          <Text style={styles.label}>{formatLabel(key)}</Text>
          <Switch value={prefs[key]} onValueChange={(val) => updatePref(key, val)} />
        </View>
      ))}
    </ScrollView>
  );
}

const formatLabel = (key) =>
  key
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (str) => str.toUpperCase())
    .replace('Eco', 'Eco-Friendly');

const styles = StyleSheet.create({
  container: { padding: 24, backgroundColor: '#f8fefc' },
  title: { fontSize: 22, fontWeight: '600', marginBottom: 20 },
  option: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderColor: '#eee',
  },
  label: { fontSize: 16 },
});