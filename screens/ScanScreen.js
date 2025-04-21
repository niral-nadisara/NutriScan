// ✅ Merged personalized filtering functionality with zoom, manual input, and keyboard dismiss
import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Keyboard,
  TouchableWithoutFeedback,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import Slider from '@react-native-community/slider';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

export default function ScanScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [zoom, setZoom] = useState(0);
  const [manualBarcode, setManualBarcode] = useState('');
  const cameraRef = useRef(null);
  const navigation = useNavigation();

  useEffect(() => {
    if (!permission) requestPermission();
  }, []);

  const fetchProductInfo = async (barcode) => {
    try {
      const response = await fetch(
        `https://world.openfoodfacts.org/api/v0/product/${barcode}.json`
      );
      const data = await response.json();
      return data.status === 1 ? data.product : null;
    } catch (error) {
      console.error('Fetch product error:', error);
      return null;
    }
  };

  const handleBarcodeScanned = async ({ data }) => {
    await handleProductLookup(data);
  };

  const handleManualSubmit = async () => {
    if (!manualBarcode.trim()) return;
    Keyboard.dismiss();
    await handleProductLookup(manualBarcode.trim());
  };

  const handleProductLookup = async (barcode) => {
    setLoading(true);
    setErrorMsg('');
    try {
      const product = await fetchProductInfo(barcode);
      if (product) {
        navigation.navigate('Home');
      } else {
        setErrorMsg('Product not found.');
        setTimeout(() => setErrorMsg(''), 2000);
      }
    } catch (err) {
      alert('Something went wrong while fetching the product.');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    Keyboard.dismiss();
    setManualBarcode('');
    setErrorMsg('');
    navigation.navigate('Home');
  };

  if (!permission || !permission.granted) {
    return (
      <View style={styles.container}>
        <Text>No access to camera. Please enable camera permission in settings.</Text>
        <TouchableOpacity style={styles.submitButton} onPress={requestPermission}>
          <Text style={styles.submitButtonText}>Allow Camera</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>

        <View style={styles.cameraContainer}>
          <CameraView
            ref={cameraRef}
            style={styles.camera}
            facing="back"
            zoom={zoom}
            onBarcodeScanned={handleBarcodeScanned}
            barcodeScannerSettings={{
              barcodeTypes: ['ean13', 'upc_a', 'upc_e', 'code128'],
            }}
          />
        </View>

        <View style={styles.sliderContainer}>
          <Text style={styles.zoomLabel}>Zoom</Text>
          <Slider
            style={{ width: '90%' }}
            minimumValue={0}
            maximumValue={1}
            step={0.01}
            value={zoom}
            onValueChange={setZoom}
            minimumTrackTintColor="#4ade80"
            maximumTrackTintColor="#ccc"
            thumbTintColor="#4ade80"
          />
        </View>

        <View style={styles.manualInputContainer}>
          <Text style={styles.manualLabel}>Enter Barcode Manually:</Text>
          <TextInput
            placeholder="e.g. 0123456789123"
            value={manualBarcode}
            onChangeText={setManualBarcode}
            style={styles.input}
            keyboardType="numeric"
          />
          <TouchableOpacity style={styles.submitButton} onPress={handleManualSubmit}>
            <Text style={styles.submitButtonText}>Submit</Text>
          </TouchableOpacity>
        </View>

        {loading && <ActivityIndicator size="large" color="#3b82f6" style={{ marginTop: 20 }} />}
        {errorMsg !== '' && <Text style={styles.error}>{errorMsg}</Text>}
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', paddingTop: 40 },
  backButton: {
    position: 'absolute',
    top: 48,
    left: 16,
    backgroundColor: '#eee',
    padding: 8,
    borderRadius: 24,
    elevation: 4,
    zIndex: 10,
  },
  cameraContainer: {
    height: 400,
    width: '100%',
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 20,
  },
  camera: { flex: 1 },
  sliderContainer: {
    marginTop: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  zoomLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 6,
  },
  manualInputContainer: {
    marginTop: 20,
    paddingHorizontal: 16,
  },
  manualLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f4f4f4',
    padding: 12,
    borderRadius: 8,
    borderColor: '#ccc',
    borderWidth: 1,
    fontSize: 16,
    marginBottom: 10,
  },
  submitButton: {
    backgroundColor: '#4ade80',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  error: {
    color: 'red',
    textAlign: 'center',
    marginTop: 16,
    fontSize: 16,
  },
});
