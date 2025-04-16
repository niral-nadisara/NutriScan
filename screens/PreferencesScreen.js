import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Switch, ScrollView, Alert, Button } from 'react-native';
import { auth } from '../firebase/config';
import { saveUserData, getUserData } from '../firebase/firestoreHelpers';

export default function PreferencesScreen({ navigation }) {
  const [prefs, setPrefs] = useState({
    hideAdditives: false,
    preferOrganic: false,
    preferVegan: false,
    avoidSodium: false,
    noGmos: false,
    noAddedSugar: false,
    noPreservatives: false,
    ecoPackaging: false,
    avoidAllergens: false,
  });

  const [hasChanges, setHasChanges] = useState(false);
  const [loading, setLoading] = useState(true);

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
    setLoading(false);
  };

  const handleToggle = (key, value) => {
    setPrefs((prev) => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    try {
      await saveUserData({ preferences: prefs });
      Alert.alert('✅ Preferences saved!');
      setHasChanges(false);
    } catch (err) {
      Alert.alert('❌ Failed to save preferences.');
      console.error('Save error:', err);
    }
  };

  if (loading) return <Text style={{ padding: 20 }}>Loading preferences...</Text>;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Your Preferences</Text>

      {Object.keys(prefs).map((key) => (
        <View style={styles.option} key={key}>
          <Text style={styles.label}>{formatLabel(key)}</Text>
          <Switch value={prefs[key]} onValueChange={(val) => handleToggle(key, val)} />
        </View>
      ))}

      {hasChanges && (
        <View style={styles.saveButtonWrapper}>
          <Button title="Save Preferences" onPress={handleSave} color="#2e7d32" />
        </View>
      )}
    </ScrollView>
  );
}

const formatLabel = (key) =>
  key
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (str) => str.toUpperCase())
    .replace('Gmos', 'GMOs');

const styles = StyleSheet.create({
  container: {
    padding: 24,
    backgroundColor: '#f8fefc',
    flexGrow: 1,
  },
  title: {
    fontSize: 22,
    fontWeight: '600',
    marginBottom: 20,
  },
  option: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderColor: '#eee',
  },
  label: {
    fontSize: 16,
    flexShrink: 1,
  },
  saveButtonWrapper: {
    marginTop: 24,
    backgroundColor: '#e8f5e9',
    padding: 12,
    borderRadius: 8,
  },
});
 