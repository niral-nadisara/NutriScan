import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  TextInput,
  TouchableOpacity,
  Animated,
  Easing,
  Keyboard,
  TouchableWithoutFeedback,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { auth } from '../firebase/config';
import { getUserData, saveUserData } from '../firebase/firestoreHelpers';
import { PinchGestureHandler, State } from 'react-native-gesture-handler';
import Slider from '@react-native-community/slider';
import { useFocusEffect } from '@react-navigation/native';

export default function ScanScreen({ navigation }) {
  const [permission, requestPermission] = useCameraPermissions();
  const [manualCode, setManualCode] = useState('');
  const [scanned, setScanned] = useState(false);
  const cameraRef = useRef(null);
  const blinkAnim = useRef(new Animated.Value(0)).current;
  const animatedValue = useRef(new Animated.Value(0)).current;
  const pinchScale = useRef(new Animated.Value(1)).current;
  const [zoom, setZoom] = useState(0);
  const [borderColor, setBorderColor] = useState('#ccc');

  useEffect(() => {
    let baseZoom = zoom;
  
    const listener = pinchScale.addListener(({ value }) => {
      const newZoom = Math.min(1, Math.max(0, baseZoom * value));
      setZoom(newZoom);
    });
  
    return () => {
      pinchScale.removeListener(listener);
    };
  }, [zoom]);

  const triggerBorderBlink = (color) => {
    setBorderColor(color);
    blinkAnim.setValue(0);
    Animated.sequence([
      Animated.timing(blinkAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: false,
      }),
      Animated.timing(blinkAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: false,
      }),
    ]).start(() => setBorderColor('#ccc'));
  };
  
  const saveScanToHistory = async (barcode, name, score) => {
    if (!auth.currentUser) return;

    try {
      const existing = await getUserData();
      const currentHistory = existing?.scanHistory || [];

      const updatedHistory = [
        {
          barcode,
          name: name || 'Unknown Product',
          score: typeof score === 'number' ? score : null,
          timestamp: Date.now(),
        },
        ...currentHistory.slice(0, 49),
      ];

      await saveUserData({ scanHistory: updatedHistory });
    } catch (err) {
      console.error('Failed to save scan history:', err);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      setScanned(false); // Reset scanning every time user returns to this screen
      setZoom(0); // 🔄 Auto-reset zoom when user comes back
    }, [])
  );

  const handleBarcodeScanned = async ({ data }) => {
    if (!scanned) {
      setScanned(true);
      try {
        const res = await fetch(`https://world.openfoodfacts.org/api/v2/product/${data}`);
        const result = await res.json();
  
        if (!result || result.status === 0 || !result.product) {
          Alert.alert("Not Found", "No product found for this barcode.");
          return;
        }
  
        const product = result.product;
        console.log('✅ Product Name:', product.product_name);
        //console.log('✅ Full Product Data:', product);
  
        await saveScanToHistory(data, product.product_name, product.nutriscore_score);
        const isHealthy = product.nutriscore_score < 5;
        triggerBorderBlink(isHealthy ? 'green' : 'red');
        navigation.navigate('Result', { barcode: data });
      } catch (err) {
        console.error('❌ Fetch error in scan:', err);
        Alert.alert("Error", "Failed to fetch product information.");
      }
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
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <View style={styles.container}>
        {/* Back Button */}
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

        {/* Camera View */}
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

        {/* Zoom Slider */}
        <View style={styles.sliderContainer}>
          <Text style={styles.zoomLabel}>Zoom</Text>
          <Slider
            style={{ width: '90%' }}
            minimumValue={0}
            maximumValue={1}
            step={0.01}
            value={zoom}
            onValueChange={setZoom}
            minimumTrackTintColor="#4CAF50"
            maximumTrackTintColor="#ccc"
            thumbTintColor="#4CAF50"
          />
        </View>

        {/* Manual Barcode Input */}
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
            <Text style={styles.submitButtonText}>Go</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableWithoutFeedback>
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
    borderColor: '#ccc',
    borderWidth: 1,
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
  scanLine: {
    position: 'absolute',
    top: 10,
    left: '5%',
    width: '90%',
    height: 2,
    backgroundColor: 'red',
    opacity: 0.8,
  },
  sliderContainer: {
    marginTop: 10,
    alignItems: 'center',
    width: '100%',
  },
  zoomLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 6,
  },
});
