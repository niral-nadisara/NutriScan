import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  TextInput,
  Button,
  TouchableOpacity,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { auth } from '../firebase/config';
import { getUserData, saveUserData } from '../firebase/firestoreHelpers';

export default function ScanScreen({ navigation }) {
  const [permission, requestPermission] = useCameraPermissions();
  const [manualCode, setManualCode] = useState('');
  const [scanned, setScanned] = useState(false);
  const cameraRef = useRef(null);

  useEffect(() => {
    if (!permission?.granted) {
      requestPermission();
    }
  }, [permission]);

  const saveScanToHistory = async (barcode) => {
    if (!auth.currentUser) return;

    try {
      const existing = await getUserData();
      const currentHistory = existing?.scanHistory || [];

      const updatedHistory = [
        {
          barcode,
          timestamp: Date.now(),
        },
        ...currentHistory.slice(0, 49), // Keep last 50
      ];

      await saveUserData({ scanHistory: updatedHistory });
    } catch (err) {
      console.error('Failed to save scan history:', err);
    }
  };

  const handleBarcodeScanned = async ({ data }) => {
    if (!scanned) {
      setScanned(true);
      await saveScanToHistory(data);
      navigation.navigate('Result', { barcode: data });
    }
  };

  const handleManualSubmit = async () => {
    if (!manualCode) {
      Alert.alert('Enter a valid barcode');
      return;
    }
    await saveScanToHistory(manualCode);
    navigation.navigate('Result', { barcode: manualCode });
  };

  if (!permission) return <Text>Requesting camera permissions...</Text>;
  if (!permission.granted) return <Text>No access to camera</Text>;

  return (
    <View style={styles.container}>
      {/* Back Button with Confirmation */}
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => {
          Alert.alert(
            'Go to Home',
            'Are you sure you want to go back to the Home screen?',
            [
              { text: 'No', style: 'cancel' },
              { text: 'Yes', onPress: () => navigation.navigate('Home') },
            ]
          );
        }}
      >
        <Ionicons name="arrow-back" size={26} color="#333" />
      </TouchableOpacity>

      <View style={styles.cameraContainer}>
        <CameraView
          ref={cameraRef}
          style={styles.camera}
          facing="back"
          onBarcodeScanned={handleBarcodeScanned}
          barcodeScannerSettings={{
            barcodeTypes: ['ean13', 'upc_a', 'upc_e', 'code128'],
          }}
        />
      </View>

      <View style={styles.manualEntry}>
        <Text style={{ marginBottom: 8 }}>Or enter barcode manually:</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter barcode"
          value={manualCode}
          onChangeText={setManualCode}
          keyboardType="numeric"
        />
        <TouchableOpacity style={styles.submitButton} onPress={handleManualSubmit}>
        <Text style={styles.submitButtonText}>Submit</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraContainer: {
    height: 300,
    width: '90%',
    alignSelf: 'center',
    overflow: 'hidden',
    borderRadius: 12,
    marginBottom: 20,
  },
  camera: {
    flex: 1,
  },
  manualEntry: {
    width: '100%',
    padding: 16,
    alignItems: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#999',
    borderRadius: 6,
    padding: 10,
    width: '80%',
    marginBottom: 12,
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    zIndex: 10,
    backgroundColor: '#fff',
    padding: 6,
    borderRadius: 20,
    elevation: 5,
  },
  submitButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 8,
    elevation: 3,
    marginTop: 10,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});
