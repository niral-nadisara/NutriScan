import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, Alert } from 'react-native';
import { auth } from '../firebase/config';
import { getUserData } from '../firebase/firestoreHelpers';

export default function ScanHistoryScreen({ navigation }) {
  const [history, setHistory] = useState([]);

  useEffect(() => {
    if (!auth.currentUser) {
      Alert.alert('Login required', 'Please login to view scan history.');
      navigation.navigate('Auth');
      return;
    }
    loadHistory();
  }, []);

  const loadHistory = async () => {
    const data = await getUserData();
    if (data?.scanHistory) {
      setHistory(data.scanHistory);
    }
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <Text style={styles.name}>{item.name}</Text>
      <Text style={styles.meta}>Score: {item.score ?? 'N/A'}</Text>
      <Text style={styles.meta}>
        Scanned on: {new Date(item.timestamp).toLocaleString()}
      </Text>
    </View>
  );

  return (
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
  },
  name: { fontSize: 18, fontWeight: '600' },
  meta: { color: '#666' },
  empty: { textAlign: 'center', marginTop: 40, color: '#999' },
});