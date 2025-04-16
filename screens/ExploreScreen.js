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
        const userPrefs = data?.preferences || {};
        console.log("🎯 Loaded user preferences:", userPrefs);
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
        {
          headers: {
            Accept: 'application/json',
          },
        }
      );

      if (!res.ok) {
        throw new Error(`API error: ${res.status} ${res.statusText}`);
      }

      const data = await res.json();
      const englishProducts = data.products.filter(
        (p) => p.product_name && p.lang === 'en'
      );

      const filtered = englishProducts.filter((p) => {
        const tags = (p.labels_tags || [])
          .map((t) => t.toLowerCase())
          .map((t) => t.replace(/^en:/, ''));

        const ingredientsText = (p.ingredients_text || '').toLowerCase();
        const salt = p.nutriments?.salt || 0;
        const allergens = p.allergens_tags || [];

        let matchCount = 0;

        if (prefs.preferOrganic && tags.includes('organic')) matchCount++;
        if (prefs.preferVegan && tags.includes('vegan')) matchCount++;
        if (
          prefs.hideAdditives &&
          (tags.includes('no-additives') || /e\d{3}/i.test(ingredientsText))
        )
          matchCount++;
        if (
          prefs.noGmos &&
          (tags.includes('no-gmos') || tags.includes('non-gmo-project'))
        )
          matchCount++;
        if (prefs.noAddedSugar && tags.includes('no-added-sugar')) matchCount++;
        if (prefs.noPreservatives && tags.includes('no-preservatives'))
          matchCount++;
        if (prefs.avoidSodium && salt <= 1.2) matchCount++;
        if (
          prefs.ecoPackaging &&
          tags.some((t) =>
            ['fsc', 'fsc-recycling', 'eco-emballage', 'green-dot'].includes(t)
          )
        )
          matchCount++;
        if (prefs.avoidAllergens && allergens.length === 0) matchCount++;

        const activePrefsCount = Object.values(prefs).filter(Boolean).length;
        return activePrefsCount === 0 || matchCount > 0;
      });

      console.log(`✅ Showing ${filtered.length} filtered products`);
      setProducts(filtered);
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
    if (preferences.ecoPackaging) filters.push('Eco-Friendly');
    if (preferences.avoidAllergens) filters.push('Allergen-Free');

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

    if (preferences.preferVegan && tags.includes('vegan')) visibleTags.push('Vegan');
    if (preferences.preferOrganic && tags.includes('organic'))
      visibleTags.push('Organic');
    if (preferences.hideAdditives && tags.includes('no-additives'))
      visibleTags.push('No Additives');
    if (
      preferences.noGmos &&
      (tags.includes('no-gmos') || tags.includes('non-gmo-project'))
    )
      visibleTags.push('Non-GMO');
    if (preferences.noAddedSugar && tags.includes('no-added-sugar'))
      visibleTags.push('No Added Sugar');
    if (preferences.noPreservatives && tags.includes('no-preservatives'))
      visibleTags.push('No Preservatives');
    if (
      preferences.ecoPackaging &&
      tags.some((t) =>
        ['fsc', 'fsc-recycling', 'eco-emballage', 'green-dot'].includes(t)
      )
    )
      visibleTags.push('Eco-Friendly');
    if (preferences.avoidAllergens && (item.allergens_tags || []).length === 0)
      visibleTags.push('Allergen-Free');

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
