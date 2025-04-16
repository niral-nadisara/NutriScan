import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';

export default function ProductDetailScreen({ route }) {
  const { item } = route.params;
  const nutrition = item.nutrition || {};

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>{item.name}</Text>
      <Text>Barcode: {item.barcode}</Text>
      <Text>Score: {item.score}</Text>

      <Text style={styles.subheading}>Nutritional Information:</Text>
      {Object.keys(nutrition).length === 0 ? (
        <Text>No nutritional info available</Text>
      ) : (
        Object.entries(nutrition).map(([key, value]) => (
          <Text key={key}>{`${key}: ${value}`}</Text>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 10 },
  subheading: { marginTop: 20, fontSize: 18, fontWeight: '600' },
});

