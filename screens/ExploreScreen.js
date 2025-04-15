import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { auth } from '../firebase/config';
import { getUserData } from '../firebase/firestoreHelpers';

export default function ExploreScreen() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
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
        setPreferences(data?.preferences || {});
      }
      await fetchProducts();
    } catch (err) {
      console.error('❌ Error loading preferences/products:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    const urls = [
      'https://world.openfoodfacts.org/cgi/search.pl?search_terms=vegan&search_simple=1&json=1&page_size=50',
      'https://world.openfoodfacts.org/cgi/search.pl?search_terms=organic&search_simple=1&json=1&page_size=50',
      'https://world.openfoodfacts.org/cgi/search.pl?search_terms=no-gmos&search_simple=1&json=1&page_size=50',
      'https://world.openfoodfacts.org/cgi/search.pl?search_terms=no-added-sugar&search_simple=1&json=1&page_size=50',
      'https://world.openfoodfacts.org/cgi/search.pl?search_terms=no-preservatives&search_simple=1&json=1&page_size=50',
    ];

    try {
      let allProducts = [];

      for (const url of urls) {
        const res = await fetch(url);
        const data = await res.json();
        const filtered = data.products.filter(
          (p) => p.product_name && p.lang === 'en'
        );
        allProducts = [...allProducts, ...filtered];
      }

      // Deduplicate by product code
      const uniqueMap = new Map();
      allProducts.forEach((p) => uniqueMap.set(p.code, p));
      const mergedProducts = Array.from(uniqueMap.values());

      // Filter based on active preferences
      const finalFiltered = mergedProducts.filter((p) => {
        const tags = (p.labels_tags || [])
          .map((t) => t.toLowerCase())
          .map((t) => t.replace(/^en:/, ''));

        const ingredientsText = (p.ingredients_text || '').toLowerCase();
        const salt = p.nutriments?.salt || 0;

        if (preferences.preferOrganic && !tags.includes('organic')) return false;
        if (preferences.preferVegan && !tags.includes('vegan')) return false;
        if (preferences.avoidSodium && salt > 1.2) return false;
        if (
          preferences.hideAdditives &&
          !tags.includes('no-additives') &&
          /e\d{3}/i.test(ingredientsText)
        )
          return false;
        if (
          preferences.noGmos &&
          !tags.includes('no-gmos') &&
          !tags.includes('non-gmo-project')
        )
          return false;
        if (preferences.noAddedSugar && !tags.includes('no-added-sugar'))
          return false;
        if (preferences.noPreservatives && !tags.includes('no-preservatives'))
          return false;

        return true;
      });

      console.log(`✅ Showing ${finalFiltered.length} products after filtering`);
      setProducts(finalFiltered);
    } catch (err) {
      console.error('❌ Failed to fetch or filter products:', err);
    }
  };

  const renderPreferenceFilters = () => {
    const filters = [];
    if (preferences.preferOrganic) filters.push('Organic');
    if (preferences.preferVegan) filters.push('Vegan');
    if (preferences.avoidSodium) filters.push('Low Sodium');
    if (preferences.hideAdditives) filters.push('No Additives');
    if (preferences.noGmos) filters.push('No GMOs');
    if (preferences.noAddedSugar) filters.push('No Added Sugar');
    if (preferences.noPreservatives) filters.push('No Preservatives');

    if (filters.length === 0) return null;

    return (
      <View style={styles.filterBar}>
        <Text style={styles.filterLabel}>Filtered by:</Text>
        {filters.map((filter, index) => (
          <Text key={index} style={styles.filterTag}>
            {filter}
          </Text>
        ))}
      </View>
    );
  };

  const renderProductCard = ({ item }) => {
    const tags = (item.labels_tags || [])
      .map((t) => t.toLowerCase())
      .map((t) => t.replace(/^en:/, ''));

    const visibleTags = [];

    if (preferences.preferVegan && tags.includes('vegan')) {
      visibleTags.push('Vegan');
    }
    if (preferences.preferOrganic && tags.includes('organic')) {
      visibleTags.push('Organic');
    }
    if (preferences.hideAdditives && tags.includes('no-additives')) {
      visibleTags.push('No Additives');
    }
    if (
      preferences.noGmos &&
      (tags.includes('no-gmos') || tags.includes('non-gmo-project'))
    ) {
      visibleTags.push('Non-GMO');
    }
    if (preferences.noAddedSugar && tags.includes('no-added-sugar')) {
      visibleTags.push('No Added Sugar');
    }
    if (preferences.noPreservatives && tags.includes('no-preservatives')) {
      visibleTags.push('No Preservatives');
    }

    return (
      <View style={styles.card}>
        <Image
          source={{ uri: item.image_front_small_url }}
          style={styles.image}
        />
        <View style={{ flex: 1 }}>
          <Text style={styles.name}>{item.product_name}</Text>
          {visibleTags.length > 0 && (
            <View style={styles.tagRow}>
              {visibleTags.map((tag, index) => (
                <Text key={index} style={styles.tag}>
                  {tag}
                </Text>
              ))}
            </View>
          )}
        </View>
      </View>
    );
  };

  if (loading)
    return (
      <ActivityIndicator
        style={{ marginTop: 40 }}
        size="large"
        color="#3b82f6"
      />
    );

  return (
    <View style={styles.container}>
      {renderPreferenceFilters()}

      {products.length === 0 ? (
        <Text style={styles.noResults}>
          No products match your preferences. Try loosening your filters.
        </Text>
      ) : (
        <FlatList
          data={products}
          keyExtractor={(item) => item.id || item.code}
          renderItem={renderProductCard}
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 12 },
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
  tagRow: { flexDirection: 'row', flexWrap: 'wrap' },
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
  noResults: {
    textAlign: 'center',
    marginTop: 30,
    color: '#999',
    fontSize: 15,
  },
});
