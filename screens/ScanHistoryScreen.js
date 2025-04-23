import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, Alert, TouchableOpacity, ImageBackground } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { auth } from '../firebase/config';
import { getUserData } from '../firebase/firestoreHelpers';

export default function ScanHistoryScreen({ navigation }) {
  const [history, setHistory] = useState([]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      if (auth.currentUser) loadHistory();
    });
    return unsubscribe;
  }, [navigation]);

  const loadHistory = async () => {
    const data = await getUserData();
    if (data?.scanHistory) {
      setHistory(data.scanHistory.sort((a, b) => b.timestamp - a.timestamp));
    }
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('Result', { barcode: item.barcode })}
    >
      <Text style={styles.name}>{item.name ? item.name : 'Unknown Product'}</Text>
      <Text style={styles.meta}>Score: {item.score ?? 'N/A'}</Text>
      <Text style={styles.meta}>
        Scanned on: {new Date(item.timestamp).toLocaleString()}
      </Text>
    </TouchableOpacity>
  );

  return (
    <ImageBackground
      source={require('../assets/home_bg.png')}
      style={{ flex: 1 }}
      resizeMode="cover"
    >
      <LinearGradient
        colors={['rgba(255,255,255,0.8)', 'rgba(255,255,255,0.9)']}
        style={{ flex: 1 }}
      >
        <View style={styles.container}>
          <Text style={styles.title}>Scan History</Text>
          {history.length > 0 ? (
            <FlatList
              data={history}
              keyExtractor={(_, index) => index.toString()}
              renderItem={renderItem}
            />
          ) : (
            <Text style={styles.empty}>No scan history found.</Text>
          )}
        </View>
      </LinearGradient>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 10 },
  card: {
    backgroundColor: '#f1f8e9',
    padding: 12,
    marginBottom: 12,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  name: { fontSize: 18, fontWeight: '600' },
  meta: { color: '#666' },
  empty: { textAlign: 'center', marginTop: 40, color: '#999' },
});