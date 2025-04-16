import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  StyleSheet,
  ActivityIndicator,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Modal,
} from 'react-native';

const categories = ['All', 'Snacks', 'Beverages', 'Dairy', 'Organic', 'Gluten-Free'];

export default function ExploreScreen() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [productDetails, setProductDetails] = useState(null);

  useEffect(() => {
    fetchFancyProducts();
  }, []);

  const fetchFancyProducts = async () => {
    try {
      const response = await fetch('https://api.spoonacular.com/food/products/search?query=organic&number=20&apiKey=2202bb279df54100a0a68fc9eda45b5f');
      const data = await response.json();
      if (data && data.products) {
        setProducts(data.products);
      } else {
        setProducts([]);
      }
    } catch (err) {
      console.error('❌ Failed to load products:', err);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchProductDetails = async (productId) => {
    try {
      const res = await fetch(`https://api.spoonacular.com/food/products/${productId}?apiKey=2202bb279df54100a0a68fc9eda45b5f`);
      const detailData = await res.json();
      setProductDetails(detailData);
    } catch (error) {
      console.error('❌ Failed to fetch product details:', error);
    }
  };

  const handleProductPress = (item) => {
    setSelectedProduct(item);
    fetchProductDetails(item.id);
  };

  const filteredProducts = (products || []).filter((item) => {
    const matchesSearch = item.title
      ?.toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === 'All' ||
      item.title?.toLowerCase().includes(selectedCategory.toLowerCase());
    return matchesSearch && matchesCategory;
  });

  if (loading)
    return <ActivityIndicator style={{ marginTop: 40 }} size="large" color="#3b82f6" />;

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.search}
        placeholder="Search products..."
        value={searchQuery}
        onChangeText={setSearchQuery}
      />

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
        {categories.map((cat) => (
          <TouchableOpacity
            key={cat}
            style={[styles.categoryChip, selectedCategory === cat && styles.categoryChipSelected]}
            onPress={() => setSelectedCategory(cat)}
          >
            <Text style={selectedCategory === cat ? styles.chipTextSelected : styles.chipText}>{cat}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <FlatList
        data={filteredProducts}
        numColumns={2}
        columnWrapperStyle={styles.column}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card} onPress={() => handleProductPress(item)}>
            <Image source={{ uri: item.image }} style={styles.image} />
            <Text style={styles.name} numberOfLines={2}>{item.title}</Text>
          </TouchableOpacity>
        )}
      />

      {selectedProduct && (
        <Modal visible={true} animationType="slide" onRequestClose={() => {
          setSelectedProduct(null);
          setProductDetails(null);
        }}>
          <ScrollView style={styles.modalContent}>
            <Image source={{ uri: selectedProduct.image }} style={styles.modalImage} />
            <Text style={styles.modalTitle}>{selectedProduct.title}</Text>
            {productDetails ? (
              <>
                <Text style={styles.modalSubtitle}>Ingredients:</Text>
                {productDetails.ingredientList ? (
                  <Text style={styles.modalText}>{productDetails.ingredientList}</Text>
                ) : (
                  <Text style={styles.modalText}>No ingredient details available.</Text>
                )}
              </>
            ) : (
              <ActivityIndicator size="small" color="#888" style={{ marginTop: 20 }} />
            )}
            <TouchableOpacity style={styles.closeButton} onPress={() => {
              setSelectedProduct(null);
              setProductDetails(null);
            }}>
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </ScrollView>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 12, backgroundColor: '#f9f9f9' },
  search: {
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 10,
    marginBottom: 12,
    borderColor: '#ddd',
    borderWidth: 1,
  },
  categoryScroll: { marginBottom: 10 },
  categoryChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#e0e0e0',
    borderRadius: 20,
    marginRight: 10,
  },
  categoryChipSelected: {
    backgroundColor: '#4ade80',
  },
  chipText: { color: '#333', fontWeight: '500' },
  chipTextSelected: { color: '#fff', fontWeight: '700' },
  column: { justifyContent: 'space-between' },
  card: {
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 10,
    width: '48%',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  image: { width: '100%', height: 100, borderRadius: 8 },
  name: { marginTop: 6, fontWeight: '600', fontSize: 14 },
  modalContent: { padding: 20, backgroundColor: '#fff', flex: 1 },
  modalImage: { width: '100%', height: 200, borderRadius: 10 },
  modalTitle: { fontSize: 22, fontWeight: '700', marginVertical: 12 },
  modalSubtitle: { fontSize: 16, fontWeight: '600', marginTop: 10 },
  modalText: { fontSize: 14, marginTop: 6 },
  closeButton: {
    marginTop: 20,
    backgroundColor: '#4ade80',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  closeButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
