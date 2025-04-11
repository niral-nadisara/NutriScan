import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, Image, StyleSheet, ActivityIndicator } from 'react-native';

export default function ExploreScreen() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCleanProducts();
  }, []);

  const fetchCleanProducts = async () => {
    try {
      const res = await fetch('https://world.openfoodfacts.org/cgi/search.pl?search_terms=organic&search_simple=1&json=1&page_size=20');
      const data = await res.json();
  
      // ✅ Log full response to understand structure
      //console.log("📦 Full API Response:", JSON.stringify(data, null, 2));
  
      // ✅ Filter products that have English product names
      const englishProducts = data.products.filter(p => p.product_name && p.lang === 'en');
  
      console.log(`🟢 Showing ${englishProducts.length} English products out of ${data.products.length} total`);
  
      setProducts(englishProducts);
    } catch (err) {
      console.error('❌ Failed to load products:', err);
    } finally {
      setLoading(false);
    }
  };
  // const fetchCleanProducts = async () => {
  //   try {
  //     const response = await fetch(
  //       `https://api.nal.usda.gov/fdc/v1/foods/search?query=organic&dataType=Branded&pageSize=20&api_key=aw0cL7gPDbYNvIrXNpdiqQFphLsZHO8GAtqN7q8W`
  //     );
  //     const data = await response.json();
  //     console.log("📦 USDA Products:", data.foods); // Log fetched data
  
  //     // Optional: Filter English names only
  //     const englishOnly = data.foods.filter(p =>
  //       /^[a-zA-Z0-9\s]+$/.test(p.description)
  //     );
  //     setProducts(englishOnly);
  //   } catch (error) {
  //     console.error("❌ Error fetching USDA products", error);
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  if (loading) return <ActivityIndicator style={{ marginTop: 40 }} size="large" color="#3b82f6" />;

  return (
    <View style={styles.container}>
      <FlatList
        data={products}
        keyExtractor={item => item.id || item.code}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Image source={{ uri: item.image_front_small_url }} style={styles.image} />
            <Text style={styles.name}>{item.product_name}</Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 12 },
  card: { backgroundColor: '#fff', padding: 10, marginBottom: 12, borderRadius: 8, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 6 },
  image: { width: 80, height: 80, borderRadius: 6 },
  name: { marginTop: 8, fontWeight: '600' }
});