// ✅ Merged personalized filtering functionality into main Explore layout
import React, { useState, useEffect, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
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
  Keyboard,
} from 'react-native';
import { auth } from '../firebase/config';
import { getUserData } from '../firebase/firestoreHelpers';
import { ImageBackground } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const categories = ['All', 'Snacks', 'Beverages', 'Dairy', 'Organic', 'Gluten-Free'];

export default function ExploreScreen() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [productDetails, setProductDetails] = useState(null);
  const [preferences, setPreferences] = useState({});

  useFocusEffect(
    useCallback(() => {
      loadPreferencesAndProducts();
    }, [])
  );

  const loadPreferencesAndProducts = async () => {
    setLoading(true);
    try {
      if (auth.currentUser) {
        const data = await getUserData();
        const userPrefs = data?.preferences || {};
        setPreferences(userPrefs);
        await fetchProducts(userPrefs);
      }
    } catch (err) {
      console.error('❌ Error loading preferences/products:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async (prefs = {}) => {
    try {
      const res = await fetch(
        'https://world.openfoodfacts.org/cgi/search.pl?search_terms=healthy&search_simple=1&json=1&page_size=100',
        { headers: { Accept: 'application/json' } }
      );
      if (!res.ok) throw new Error(`API error: ${res.status}`);
      const data = await res.json();
      const englishProducts = data.products.filter(
        (p) => p.product_name && p.lang === 'en'
      );

      const filtered = englishProducts.filter((p) => {
        const tags = (p.labels_tags || []).map((t) => t.toLowerCase().replace(/^en:/, ''));
        const ingredientsText = (p.ingredients_text || '').toLowerCase();
        const salt = p.nutriments?.salt || 0;
        const allergens = p.allergens_tags || [];

        let matchCount = 0;
        if (prefs.preferOrganic && tags.includes('organic')) matchCount++;
        if (prefs.preferVegan && tags.includes('vegan')) matchCount++;
        if (prefs.hideAdditives && (tags.includes('no-additives') || /e\d{3}/i.test(ingredientsText))) matchCount++;
        if (prefs.noGmos && (tags.includes('no-gmos') || tags.includes('non-gmo-project'))) matchCount++;
        if (prefs.noAddedSugar && tags.includes('no-added-sugar')) matchCount++;
        if (prefs.noPreservatives && tags.includes('no-preservatives')) matchCount++;
        if (prefs.avoidSodium && salt <= 1.2) matchCount++;
        if (prefs.ecoPackaging && tags.some((t) => ['fsc', 'fsc-recycling', 'eco-emballage', 'green-dot'].includes(t))) matchCount++;
        if (prefs.avoidAllergens && allergens.length === 0) matchCount++;

        const activePrefsCount = Object.values(prefs).filter(Boolean).length;
        return activePrefsCount === 0 || matchCount > 0;
      });

      setProducts(filtered);
    } catch (err) {
      console.error('❌ Failed to fetch or filter products:', err);
    }
  };

  const handleProductPress = (item) => {
    setSelectedProduct(item);
    setProductDetails({ title: item.product_name, ingredientList: item.ingredients_text });
  };

  const filteredProducts = products.filter((item) => {
    const title = item.product_name?.toLowerCase() || '';
    const matchesSearch = title.includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || title.includes(selectedCategory.toLowerCase());
    return matchesSearch && matchesCategory;
  });

  const renderPreferenceFilters = () => {
    const filters = [];
    if (preferences.preferOrganic) filters.push('Organic');
    if (preferences.preferVegan) filters.push('Vegan');
    if (preferences.avoidSodium) filters.push('Low Sodium');
    if (preferences.hideAdditives) filters.push('No Additives');
    if (preferences.noGmos) filters.push('No GMOs');
    if (preferences.noAddedSugar) filters.push('No Added Sugar');
    if (preferences.noPreservatives) filters.push('No Preservatives');
    if (preferences.ecoPackaging) filters.push('Eco-Friendly');
    if (preferences.avoidAllergens) filters.push('Allergen-Free');

    if (filters.length === 0) return null;

    return (
      <View style={styles.filterBar}>
        <Text style={styles.filterLabel}>Filtered by:</Text>
        {filters.map((filter, index) => (
          <Text key={index} style={styles.filterTag}>{filter}</Text>
        ))}
      </View>
    );
  };

  if (loading)
    return <ActivityIndicator style={{ marginTop: 40 }} size="large" color="#3b82f6" />;

  return (
    <View style={[styles.container, styles.safeAreaFix]}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => {
          setSearchQuery('');
          setSelectedCategory('All');
          setSelectedProduct(null);
          setProductDetails(null);
          Keyboard.dismiss();
        }}
      >
        <Text style={styles.backButtonText}>← Back</Text>
      </TouchableOpacity>
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

      {renderPreferenceFilters()}

      <FlatList
        data={filteredProducts}
        numColumns={1}
        keyExtractor={(item) => item.id || item.code}
        renderItem={({ item }) => {
          const tags = (item.labels_tags || []).map((t) => t.toLowerCase().replace(/^en:/, ''));
          const visibleTags = [];
          if (preferences.preferVegan && tags.includes('vegan')) visibleTags.push('Vegan');
          if (preferences.preferOrganic && tags.includes('organic')) visibleTags.push('Organic');
          if (preferences.hideAdditives && tags.includes('no-additives')) visibleTags.push('No Additives');
          if (preferences.noGmos && (tags.includes('no-gmos') || tags.includes('non-gmo-project'))) visibleTags.push('Non-GMO');
          if (preferences.noAddedSugar && tags.includes('no-added-sugar')) visibleTags.push('No Added Sugar');
          if (preferences.noPreservatives && tags.includes('no-preservatives')) visibleTags.push('No Preservatives');
          if (preferences.ecoPackaging && tags.some((t) => ['fsc', 'fsc-recycling', 'eco-emballage', 'green-dot'].includes(t))) visibleTags.push('Eco-Friendly');
          if (preferences.avoidAllergens && (item.allergens_tags || []).length === 0) visibleTags.push('Allergen-Free');

          return (
            <TouchableOpacity style={styles.card} onPress={() => handleProductPress(item)}>
              <Image source={{ uri: item.image_front_small_url }} style={styles.image} />
              <View style={{ flex: 1 }}>
                <Text style={styles.name} numberOfLines={2}>{item.product_name}</Text>
                {visibleTags.length > 0 && (
                  <View style={styles.tagRow}>
                    {visibleTags.map((tag, index) => (
                      <Text key={index} style={styles.tag}>{tag}</Text>
                    ))}
                  </View>
                )}
              </View>
            </TouchableOpacity>
          );
        }}
        contentContainerStyle={{ paddingBottom: 20 }}
      />

      {selectedProduct && productDetails && (
        <Modal visible={true} animationType="slide" onRequestClose={() => {
          setSelectedProduct(null);
          setProductDetails(null);
        }}>
          <ScrollView style={styles.modalContent}>
            <Image source={{ uri: selectedProduct.image_front_small_url }} style={styles.modalImage} />
            <Text style={styles.modalTitle}>{selectedProduct.product_name}</Text>
            <Text style={styles.modalSubtitle}>Ingredients:</Text>
            {productDetails.ingredientList ? (
              <Text style={styles.modalText}>{productDetails.ingredientList}</Text>
            ) : (
              <Text style={styles.modalText}>No ingredient details available.</Text>
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
  backButton: {
    marginBottom: 10,
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#ddd',
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  backButtonText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '600',
  },
  safeAreaFix: {
    paddingTop: 50,
  },
  container: { flex: 1, padding: 12, backgroundColor: '#f9f9f9' },
  search: {
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 10,
    marginBottom: 12,
    borderColor: '#ddd',
    borderWidth: 1,
  },
  categoryScroll: { marginBottom: 10, flexDirection: 'row' },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 20,
    marginRight: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: undefined,
    flexShrink: 0,
    height: 30,
    marginBottom: 10,
  },
  categoryChipSelected: {
    backgroundColor: '#4ade80',
  },
  chipText: { color: '#333', fontWeight: '500' },
  chipTextSelected: { color: '#fff', fontWeight: '700' },
  filterBar: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 10,
    alignItems: 'center',
  },
  filterLabel: {
    fontWeight: '600',
    marginRight: 6,
  },
  filterTag: {
    backgroundColor: '#e0f2f1',
    color: '#00796b',
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 6,
    borderRadius: 8,
    fontSize: 12,
    fontWeight: '500',
  },
  card: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 10,
    marginBottom: 12,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 6,
    alignItems: 'center',
  },
  image: { width: 80, height: 80, borderRadius: 6, marginRight: 12 },
  name: { fontWeight: '600', fontSize: 16, marginBottom: 4 },
  modalContent: { padding: 20, backgroundColor: '#fff', flex: 1 },
  modalImage: { width: '100%', height: 200, borderRadius: 10 },
  modalTitle: { fontSize: 22, fontWeight: '700', marginVertical: 12 },
  modalSubtitle: { fontSize: 16, fontWeight: '600', marginTop: 10 },
  modalText: { fontSize: 14, marginTop: 6 },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 6 },
  tag: {
    backgroundColor: '#e8f5e9',
    color: '#388e3c',
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginRight: 6,
    marginTop: 4,
    borderRadius: 6,
    fontSize: 11,
    overflow: 'hidden',
  },
  closeButton: {
    marginTop: 20,
    backgroundColor: '#4ade80',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  closeButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
