import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  TextInput,
  Button,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
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
        <Button title="Submit" onPress={handleManualSubmit} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  cameraContainer: {
    height: '60%',
    overflow: 'hidden',
    borderRadius: 12,
    margin: 12,
  },
  camera: {
    flex: 1,
  },
  manualEntry: {
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
});