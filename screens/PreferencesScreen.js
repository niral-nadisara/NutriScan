import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Switch,
  ScrollView,
  Alert,
  Button,
} from 'react-native';
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
    noGmos: false,
    noAddedSugar: false,
    noPreservatives: false,
  });

  const [loading, setLoading] = useState(true);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (!auth.currentUser) {
      Alert.alert('Login required', 'Please login to update preferences.');
      navigation.navigate('Auth');
      return;
    }
    loadPrefs();
  }, []);

  const loadPrefs = async () => {
    try {
      const data = await getUserData();
      if (data?.preferences) setPrefs(data.preferences);
    } catch (err) {
      console.error('Failed to load preferences:', err);
    } finally {
      setLoading(false);
    }
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
    }
  };

  if (loading) return <Text style={{ padding: 20 }}>Loading preferences...</Text>;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Your Preferences</Text>

      <View style={styles.option}>
        <Text style={styles.label}>Hide Additives</Text>
        <Switch value={prefs.hideAdditives} onValueChange={(val) => handleToggle("hideAdditives", val)} />
      </View>

      <View style={styles.option}>
        <Text style={styles.label}>Prefer Organic</Text>
        <Switch value={prefs.preferOrganic} onValueChange={(val) => handleToggle("preferOrganic", val)} />
      </View>

      <View style={styles.option}>
        <Text style={styles.label}>Prefer Vegan</Text>
        <Switch value={prefs.preferVegan} onValueChange={(val) => handleToggle("preferVegan", val)} />
      </View>

      <View style={styles.option}>
        <Text style={styles.label}>Avoid Sodium</Text>
        <Switch value={prefs.avoidSodium} onValueChange={(val) => handleToggle("avoidSodium", val)} />
      </View>

      <View style={styles.option}>
        <Text style={styles.label}>Avoid Allergens</Text>
        <Switch value={prefs.avoidAllergens} onValueChange={(val) => handleToggle("avoidAllergens", val)} />
      </View>

      <View style={styles.option}>
        <Text style={styles.label}>Eco-Friendly Packaging</Text>
        <Switch value={prefs.ecoPackaging} onValueChange={(val) => handleToggle("ecoPackaging", val)} />
      </View>

      <View style={styles.option}>
        <Text style={styles.label}>No GMOs</Text>
        <Switch value={prefs.noGmos} onValueChange={(val) => handleToggle("noGmos", val)} />
      </View>

      <View style={styles.option}>
        <Text style={styles.label}>No Added Sugar</Text>
        <Switch value={prefs.noAddedSugar} onValueChange={(val) => handleToggle("noAddedSugar", val)} />
      </View>

      <View style={styles.option}>
        <Text style={styles.label}>No Preservatives</Text>
        <Switch value={prefs.noPreservatives} onValueChange={(val) => handleToggle("noPreservatives", val)} />
      </View>

      {hasChanges && (
        <View style={styles.saveButtonWrapper}>
          <Button title="Save Preferences" onPress={handleSave} color="#2e7d32" />
        </View>
      )}
    </ScrollView>
  );
}

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
