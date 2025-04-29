import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  TextInput,
  TouchableOpacity,
  Animated,
  Keyboard,
  TouchableWithoutFeedback,
  ImageBackground,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { auth } from '../firebase/config';
import { getUserData, saveUserData } from '../firebase/firestoreHelpers';
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
  const [errorMsg, setErrorMsg] = useState('');

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
      console.log('📦 Saving to history:', {
        barcode,
        name: name || 'Unknown Product',
        score: typeof score === 'number' ? score : null,
        timestamp: Date.now(),
      });
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
      setErrorMsg('');
      try {
        const res = await fetch(`https://world.openfoodfacts.org/api/v2/product/${data}`);
        const result = await res.json();
  
        if (!result || result.status === 0 || !result.product) {
          setErrorMsg("❌ No product found for this barcode.");
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
        setErrorMsg("❌ Failed to fetch product information.");
      }
    }
  };

  const handleManualSubmit = async () => {
    if (!manualCode) {
      setErrorMsg("⚠️ Please enter a valid barcode before submitting.");
      return;
    }
    setErrorMsg('');
    try {
      const res = await fetch(`https://world.openfoodfacts.org/api/v2/product/${manualCode}`);
      const result = await res.json();

      if (!result || result.status === 0 || !result.product) {
        setErrorMsg("❌ No product found for this barcode.");
        return;
      }

      const product = result.product;
      console.log('✅ Product Name (manual):', product.product_name);

      await saveScanToHistory(manualCode, product.product_name, product.nutriscore_score);
      const isHealthy = product.nutriscore_score < 5;
      triggerBorderBlink(isHealthy ? 'green' : 'red');
      navigation.navigate('Result', { barcode: manualCode });
    } catch (err) {
      console.error('❌ Fetch error in manual submit:', err);
      setErrorMsg("❌ Failed to fetch product information.");
    }
  };

  if (!permission) return <Text>Requesting camera permissions...</Text>;
  if (!permission.granted) return <Text>No access to camera</Text>;

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <ImageBackground
        source={require('../assets/home_bg.png')}
        style={StyleSheet.absoluteFill}
        resizeMode="cover"
      >
        <LinearGradient colors={['#E0F7FAAA', '#B2EBF2AA']} style={styles.container}>
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
              barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e', 'code128', 'code39', 'itf14', 'gs1databar'],
            }}
          />
        </View>

        {/* Zoom Slider */}
        <View style={styles.sliderContainer}>
          <View style={styles.zoomLabelOverlay}>
            <Text style={styles.zoomLabel}>Look Closer, Tasty Clues Ahead!</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', width: '90%' }}>
            <Ionicons name="remove-circle-outline" size={22} color="#777" style={{ marginRight: 8 }} />
            <Slider
              style={{ flex: 1 }}
              minimumValue={0}
              maximumValue={1}
              step={0.01}
              value={zoom}
              onValueChange={setZoom}
              minimumTrackTintColor="#4CAF50"
              maximumTrackTintColor="#ccc"
              thumbTintColor="#4CAF50"
            />
            <Ionicons name="add-circle-outline" size={22} color="#777" style={{ marginLeft: 8 }} />
          </View>
        </View>

        {errorMsg !== '' && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{errorMsg}</Text>
          </View>
        )}

        {/* Manual Barcode Input */}
        <View style={styles.manualEntryRow}>
          <TextInput
            style={styles.inputInline}
            placeholder="Or enter barcode"
            value={manualCode}
            onChangeText={setManualCode}
            keyboardType="numeric"
          />
          <TouchableOpacity style={styles.goInlineButton} onPress={handleManualSubmit}>
            <Text style={styles.submitButtonText}>Go</Text>
          </TouchableOpacity>
        </View>
        </LinearGradient>
      </ImageBackground>
    </TouchableWithoutFeedback>
  );
}

ScanScreen.propTypes = {
  navigation: PropTypes.shape({
    navigate: PropTypes.func.isRequired,
  }).isRequired,
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: 100,
  },
  cameraContainer: {
    height: 260,
    width: '90%',
    alignSelf: 'center',
    overflow: 'hidden',
    borderRadius: 12,
    marginBottom: 20,
    borderColor: '#ccc',
    borderWidth: 1,
    backgroundColor: 'rgba(31, 30, 30, 0.8)',
  },
  camera: {
    flex: 1,
  },
  manualEntry: {
    width: '100%',
    padding: 16,
    alignItems: 'center',
  },
  manualEntryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    marginTop: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#999',
    borderRadius: 6,
    padding: 10,
    width: '80%',
    marginBottom: 12,
    backgroundColor: 'rgba(255,255,255,0.9)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  inputInline: {
    flexShrink: 1,
    width: 160,
    borderWidth: 1,
    borderColor: '#999',
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 10,
    marginRight: 10,
    backgroundColor: 'rgba(255,255,255,0.9)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
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
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 8,
    elevation: 3,
    marginTop: 10,
  },
  goInlineButton: {
    backgroundColor: '#4CAF50',
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
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
    marginTop: 3,
    alignItems: 'center',
    width: '100%',
  },
  zoomLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 6,
    textShadowColor: '#fff',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  zoomLabelOverlay: {
    backgroundColor: 'rgba(255, 255, 255, 0.75)',
    borderRadius: 10,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginBottom: 6,
  },
  errorContainer: {
    backgroundColor: 'rgba(255, 0, 0, 0.1)',
    borderLeftWidth: 4,
    borderLeftColor: '#e53935',
    padding: 12,
    marginTop: 10,
    marginHorizontal: 20,
    borderRadius: 8,
  },
  errorText: {
    color: '#c62828',
    fontWeight: '500',
    textAlign: 'left',
  }
});
