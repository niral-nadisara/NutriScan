import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, ActivityIndicator, Alert } from 'react-native';
import alternativesData from '../assets/data/clean_alternatives.json';

export default function ResultScreen({ route }) {
  const { barcode } = route.params;
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [ingredients, setIngredients] = useState([]);
  const [alternatives, setAlternatives] = useState([]);

  useEffect(() => {
    fetchProduct();
  }, []);

  const getCleanAlternatives = (category = 'chips') => {
    return alternativesData[category.toLowerCase()] || [];
  };

  const fetchAlternatives = async (categories_tags = []) => {
    try {
      const keyword = [...categories_tags].reverse().find(tag =>
        !tag.includes('plant') && !tag.includes('foods') && !tag.includes('beverages')
      )?.split(':')[1] || 'chips';
  
      const url = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${keyword}&search_simple=1&action=process&json=1`;
  
      console.log('🔍 Smart alternative lookup for:', keyword);
      console.log('🌐 URL:', url);
  
      const res = await fetch(url);
      const data = await res.json();
  
      const cleanAlts = data.products.filter(p =>
        p.nova_group <= 2 &&
        p.product_name &&
        p.image_front_url &&
        p.categories_tags?.some(tag => tag.includes(keyword))
      ).slice(0, 5);
  
      if (cleanAlts.length === 0) {
        console.log('⚠️ No clean alts online, falling back to local.');
        const fallbackAlts = getCleanAlternatives(keyword);
        setAlternatives(fallbackAlts);
      } else {
        setAlternatives(cleanAlts);
      }
    } catch (err) {
      console.error('❌ Failed fetching online alternatives. Using local.');
      const fallbackAlts = getCleanAlternatives('chips');
      setAlternatives(fallbackAlts);
    }
  };

  const fetchProduct = async () => {
    try {
      const res = await fetch(`https://world.openfoodfacts.org/api/v2/product/${barcode}`);
      const data = await res.json();

      if (!data || data.status === 0 || !data.product) {
        Alert.alert("Not Found", "No product found for this barcode.");
        return;
      }

      const productData = data.product;
      setProduct(productData);

      if (productData.ingredients_text) {
        const cleanIngredients = classifyIngredients(productData.ingredients_text);
        setIngredients(cleanIngredients);
      }

      if (productData.categories_tags?.length) {
        const altCategory = productData.categories_tags[0];
        fetchAlternatives(altCategory);
      }
      

    } catch (err) {
      console.error('❌ Fetch error:', err);
      Alert.alert("Error", "Failed to load product data.");
    } finally {
      setLoading(false);
    }
  };

  const classifyIngredients = (ingredientsText = '') => {
    const harmfulList = ['palm oil', 'e250', 'e251', 'e621', 'artificial', 'preservative'];
    const suspiciousList = ['artificial flavor', 'monosodium glutamate', 'color', 'additive', 'emulsifier'];

    const lastParenIndex = ingredientsText.lastIndexOf(')');
    const trimmedText = lastParenIndex !== -1
      ? ingredientsText.substring(0, lastParenIndex + 1)
      : ingredientsText;

    const cleaned = trimmedText.replace(/&quot;/g, '"');

    const parsed = [];
    let buffer = '';
    let parenCount = 0;

    for (let char of cleaned) {
      if (char === '(') parenCount++;
      if (char === ')') parenCount--;
      if (char === ',' && parenCount === 0) {
        parsed.push(buffer.trim());
        buffer = '';
      } else {
        buffer += char;
      }
    }
    if (buffer) parsed.push(buffer.trim());

    return parsed.map((name) => {
      const lower = name.toLowerCase();
      const isHarmful = harmfulList.some((h) => lower.includes(h));
      const isSuspicious = !isHarmful && suspiciousList.some((s) => lower.includes(s));
      const type = isHarmful ? 'harmful' : isSuspicious ? 'moderate' : 'clean';
      return { name, type };
    });
  };

  const calculateHealthScore = () => {
    if (!product?.nutriments) return 50;

    let score = 100;

    const fat = product.nutriments.fat || 0;
    const saturatedFat = product.nutriments['saturated-fat'] || 0;
    const sugars = product.nutriments.sugars || 0;
    const salt = product.nutriments.salt || 0;
    const calories = product.nutriments['energy-kcal'] || 0;
    const nova = product.nutriments['nova-group'] || 0;
    const fruitsVeggies = product.nutriments['fruits-vegetables-nuts-estimate-from-ingredients_100g'] || 0;

    if (fat > 25) score -= 20;
    if (saturatedFat > 4) score -= 15;
    if (sugars > 20) score -= 20;
    if (salt > 1.2) score -= 20;
    if (calories > 500) score -= 10;
    if (nova >= 4) score -= 20;
    if (fruitsVeggies === 0) score -= 10;

    const harmfulCount = ingredients.filter((i) => i.type === 'harmful').length;
    const moderateCount = ingredients.filter((i) => i.type === 'moderate').length;

    score -= harmfulCount * 10;
    score -= moderateCount * 5;

    return Math.max(score, 5);
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#4caf50" />
        <Text>Loading product...</Text>
      </View>
    );
  }

  if (!product) return <Text>No data</Text>;

  const score = calculateHealthScore();

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {product.image_front_url && (
        <Image source={{ uri: product.image_front_url }} style={styles.image} />
      )}
      <Text style={styles.name}>{product.product_name}</Text>
      <Text style={styles.brand}>{product.brands}</Text>

      {/* Ingredient Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Ingredients:</Text>
        <Text style={styles.legend}>🟢 Clean   🟠 Suspicious   🔴 Harmful</Text>
        {ingredients.map((item, idx) => (
          <View key={idx} style={styles.ingredientRow}>
            <View
              style={[
                styles.circle,
                {
                  backgroundColor:
                    item.type === 'harmful' ? 'red' : item.type === 'moderate' ? 'orange' : 'green',
                },
              ]}
            />
            <Text style={styles.ingredientText}>{item.name}</Text>
          </View>
        ))}
      </View>

      {/* Nutritional Breakdown */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Nutritional Breakdown:</Text>
        <Text style={styles.nutrientLine}>
          🧂 Sodium: {(Number(product.nutriments.salt) || 0).toFixed(2)} g → {product.nutriments.salt > 1.5 ? 'High ❌' : 'Acceptable ✅'}
        </Text>
        <Text style={styles.nutrientLine}>
          🍭 Sugars: {(Number(product.nutriments.sugars) || 0).toFixed(2)} g → {product.nutriments.sugars > 20 ? 'High ❌' : 'Good ✅'}
        </Text>
        <Text style={styles.nutrientLine}>
          🧈 Fat: {(Number(product.nutriments.fat) || 0).toFixed(2)} g → {product.nutriments.fat > 15 ? 'High ❌' : 'Moderate ✅'}
        </Text>
        <Text style={styles.nutrientLine}>
          🔥 Energy: {(Number(product.nutriments['energy-kcal']) || 0).toFixed(2)} kcal
        </Text>
      </View>

      {/* Health Score */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Health Score:</Text>
        <Text style={[styles.score, { color: score >= 70 ? 'green' : score >= 50 ? 'orange' : 'red' }]}>
          {score} / 100
        </Text>
      </View>

      {alternatives.length > 0 && (
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>Clean Alternatives:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {alternatives.map((alt, idx) => (
                <View key={idx} style={styles.altCard}>
                <Image source={{ uri: alt.image_front_url || alt.image }} style={styles.altImage} />
                <Text style={styles.altName} numberOfLines={2}>{alt.product_name || alt.name}</Text>
                </View>
            ))}
            </ScrollView>
        </View>
        )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, alignItems: 'center' },
  image: { width: 200, height: 200, marginBottom: 12, borderRadius: 8 },
  name: { fontSize: 20, fontWeight: 'bold', marginBottom: 4 },
  brand: { fontSize: 16, color: '#666', marginBottom: 10 },
  section: { marginTop: 20, width: '100%' },
  sectionTitle: { fontSize: 18, fontWeight: '600', marginBottom: 6 },
  score: { fontSize: 24, fontWeight: 'bold' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  ingredientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  ingredientText: {
    fontSize: 15,
    marginLeft: 8,
  },
  circle: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  nutrientLine: {
    fontSize: 16,
    marginBottom: 4,
  },
  legend: {
    fontSize: 12,
    color: '#555',
    marginBottom: 8,
  },
  altCard: {
    width: 120,
    marginRight: 12,
    alignItems: 'center',
  },
  altImage: {
    width: 100,
    height: 100,
    borderRadius: 10,
    marginBottom: 4,
  },
  altName: {
    fontSize: 13,
    textAlign: 'center',
    color: '#333',
  },
});