import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, ActivityIndicator, Alert, ImageBackground, TouchableOpacity } from 'react-native';
import { ScanBarcode } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import alternativesData from '../assets/data/clean_alternatives.json';
import { getUserData } from '../firebase/firestoreHelpers';
import { analyzeIngredientsWithAI } from '../utils/analyzeIngredients';

export default function ResultScreen({ route, navigation }) {
  const { barcode } = route.params;
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [ingredients, setIngredients] = useState([]);
  const [alternatives, setAlternatives] = useState([]);
  const [aiResult, setAiResult] = useState(null);

  useEffect(() => {
    fetchProduct();
  }, []);

  // Fetch clean alternatives from USDA API, fallback to local data if none found
  const fetchAlternatives = async (categories_tags = []) => {
    try {
      const userData = await getUserData();
      const prefs = userData?.preferences || {};
      const tags = categories_tags.map(tag => tag.replace('en:', '').replace(/-/g, ' '));
      const query = tags.join(', ');
      console.log('🔍 USDA fallback will search using:', query);

      const apiKey = process.env.EXPO_PUBLIC_USDA_API_KEY;
      const searchUrl = `https://api.nal.usda.gov/fdc/v1/foods/search?query=${encodeURIComponent(query)}&pageSize=10&api_key=${apiKey}`;
      const response = await fetch(searchUrl);
      const data = await response.json();

      let matches = [];

      if (data.foods && data.foods.length > 0) {
        matches = data.foods
          .filter(f => f.ingredients && !/preservative|artificial|maltodextrin|mono- and diglycerides|emulsifier/i.test(f.ingredients))
          .map(f => ({
            name: f.description,
            brand: f.brandName,
            image: null,
            ingredients: f.ingredients,
            score: 85,
          }));

        console.log(`✅ Found ${matches.length} USDA alternatives for: ${query}`);
      }

      if (matches.length === 0) {
        console.warn(`⚠️ USDA returned no valid results. Falling back to local DB for: ${tags}`);
        const keyword = tags.find(tag => Object.keys(alternativesData).includes(tag.toLowerCase())) || 'chips';
        matches = (alternativesData[keyword.toLowerCase()] || []).map(item => ({
          ...item,
          image: item.image || item.image_front_url || null,
        }));
        console.log(`📦 Fallback local alternatives: ${matches.length} items found for "${keyword}"`);
      }

      setAlternatives(matches.slice(0, 5));
    } catch (err) {
      console.warn('⚠️ Failed to fetch alternatives:', err.message || err);
      setAlternatives([]);
    }
  };

  // Fetch product data from Open Food Facts API
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
        try {
          const analysis = await analyzeIngredientsWithAI(productData.ingredients_text);
          setAiResult(analysis);
        } catch (e) {
          console.warn('⚠️ AI analysis failed:', e.message || e);
        }
      }

      if (productData.categories_tags?.length) {
        fetchAlternatives(productData.categories_tags);

        const joinedKeywords = productData.categories_tags
          .map(tag => tag.replace('en:', '').replace(/-/g, ' '))
          .join(', ');
        console.log('🔍 Fetched alternatives for categories:', productData.categories_tags);
        console.log('🔍 USDA fallback will search using:', joinedKeywords);
      }

    } catch (err) {
      console.error('❌ Fetch error:', err);
      console.warn("⚠️ Failed to load product data.");
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
  // Calculate health score based on product's nutritional values

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
  
    const harmfulCount = ingredients.filter(i => i.type === 'harmful').length;
    const moderateCount = ingredients.filter(i => i.type === 'moderate').length;
  
    score -= harmfulCount * 10;
    score -= moderateCount * 5;
  
    // 🔍 Scan for known harmful processed additives and oils
    const ingredientText = product.ingredients_text?.toLowerCase() || '';
    const redFlags = [
      'canola oil', 'palm oil', 'enriched flour', 'unbleached enriched flour',
      'ascorbic acid', 'thiamine mononitrate', 'riboflavin',
      'folic acid', 'dough conditioner'
    ];
  
    redFlags.forEach(term => {
      if (ingredientText.includes(term)) {
        score -= 5;
      }
    });
    // Penalize unhealthy oils
    unhealthyOils.forEach(term => {
      if (ingredientText.includes(term)) {
        score -= 7;
      }
    });

    // Penalize ultra-processed additives
    ultraProcessedIngredients.forEach(term => {
      if (ingredientText.includes(term)) {
        score -= 7;
      }
    });
    return Math.max(Math.min(score, 100), 5);
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
    <ImageBackground
      source={require('../assets/home_bg.png')}
      style={{ flex: 1 }}
      resizeMode="cover"
    >
      <LinearGradient colors={['#E0F7FAAA', '#B2EBF2AA']} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.container}>
          <View style={styles.overlayBox}>
            <Text style={styles.name}>{product.product_name}</Text>
            {product.image_front_url && (
              <View style={{ alignItems: 'center', width: '100%' }}>
                <Image source={{ uri: product.image_front_url }} style={styles.image} />
              </View>
            )}
            <Text style={styles.brand}>{product.brands}</Text>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Ingredients:</Text>
              <View style={styles.tagContainer}>
                {ingredients.map((item, idx) => (
                  <View
                    key={idx}
                    style={[
                      styles.ingredientTag,
                      item.type === 'harmful'
                        ? styles.tagHarmful
                        : item.type === 'moderate'
                        ? styles.tagModerate
                        : styles.tagClean,
                    ]}
                  >
                    <Text style={styles.tagText}>{item.name}</Text>
                  </View>
                ))}
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Nutritional Breakdown:</Text>
              {/* Tooltips could be implemented here, e.g.: */}
              {/* <Tooltip popover={<Text>High sodium can raise blood pressure</Text>}><Text>Sodium:</Text></Tooltip> */}
              <View style={styles.nutritionRow}>
                <Text style={styles.nutritionLabel}>Sodium:</Text>
                <Text
                  style={[
                    styles.nutritionValue,
                    { color: product.nutriments.salt > 1.5 ? '#e53935' : '#43a047' }
                  ]}
                >
                  {(Number(product.nutriments.salt) || 0).toFixed(2)} g — {product.nutriments.salt > 1.5 ? 'High' : 'Acceptable'}
                </Text>
              </View>
              <View style={styles.nutritionRow}>
                <Text style={styles.nutritionLabel}>Sugars:</Text>
                <Text
                  style={[
                    styles.nutritionValue,
                    { color: product.nutriments.sugars > 20 ? '#e53935' : '#43a047' }
                  ]}
                >
                  {(Number(product.nutriments.sugars) || 0).toFixed(2)} g — {product.nutriments.sugars > 20 ? 'High' : 'Good'}
                </Text>
              </View>
              <View style={styles.nutritionRow}>
                <Text style={styles.nutritionLabel}>Fat:</Text>
                <Text
                  style={[
                    styles.nutritionValue,
                    { color: product.nutriments.fat > 15 ? '#e53935' : '#fb8c00' }
                  ]}
                >
                  {(Number(product.nutriments.fat) || 0).toFixed(2)} g — {product.nutriments.fat > 15 ? 'High' : 'Moderate'}
                </Text>
              </View>
              <View style={styles.nutritionRow}>
                <Text style={styles.nutritionLabel}>Energy:</Text>
                <Text style={styles.nutritionValue}>
                  {(Number(product.nutriments['energy-kcal']) || 0).toFixed(2)} kcal
                </Text>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Health Score</Text>
              <View style={styles.scoreRow}>
                <Text style={styles.scoreVerdict}>
                  {score >= 80 ? '🥗 Excellent' : score >= 50 ? '⚖️ Moderate' : '❗ Poor'}
                </Text>
                <Text style={styles.scoreLabel}>{score} / 100</Text>
              </View>
              <View style={styles.scoreBarContainer}>
                <View
                  style={[
                    styles.scoreBarFill,
                    {
                      width: `${score}%`,
                      backgroundColor: score >= 70 ? '#66bb6a' : score >= 50 ? '#ffa726' : '#ef5350',
                    },
                  ]}
                />
              </View>
            </View>

            {aiResult && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>AI Ingredient Analysis</Text>

                {aiResult.positives?.length > 0 && (
                  <View style={styles.analysisBoxPositive}>
                    <Text style={styles.analysisLabel}>Positives</Text>
                    {aiResult.positives.map((item, index) => (
                      <Text key={index} style={styles.analysisText}>• {item}</Text>
                    ))}
                  </View>
                )}

                {aiResult.warnings?.length > 0 && (
                  <View style={styles.analysisBoxWarning}>
                    <Text style={styles.analysisLabel}>Warnings</Text>
                    {aiResult.warnings.map((item, index) => (
                      <Text key={index} style={styles.analysisText}>• {item}</Text>
                    ))}
                  </View>
                )}
              </View>
            )}

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

            <View style={{ marginTop: 30, alignItems: 'center' }}>
              <Text style={{ marginBottom: 10 }}>Scan another item ?</Text>
              <TouchableOpacity
                style={styles.rescanButton}
                onPress={() => navigation.navigate('Tabs', {
                  screen: 'Scan',
                  params: { screen: 'ScanScreen' },
                })}
              >
                <ScanBarcode color="white" size={28} />
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </LinearGradient>
    </ImageBackground>
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
  overlayBox: {
    backgroundColor: 'rgba(255,255,255,0.85)',
    padding: 16,
    borderRadius: 12,
    width: '100%',
  },
  tagContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 6,
  },
  ingredientTag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginBottom: 8,
  },
  tagText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  tagClean: {
    backgroundColor: '#66bb6a', // green
  },
  tagModerate: {
    backgroundColor: '#ffa726', // amber
  },
  tagHarmful: {
    backgroundColor: '#ef5350', // red
  },
  nutritionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  nutritionLabel: {
    fontWeight: '500',
    color: '#444',
    fontSize: 15,
  },
  nutritionValue: {
    fontSize: 15,
    color: '#333',
  },
  scoreRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  scoreVerdict: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  scoreLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  scoreBarContainer: {
    height: 12,
    width: '100%',
    backgroundColor: '#e0e0e0',
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 4,
  },
  scoreBarFill: {
    height: '100%',
    borderRadius: 6,
  },
  analysisBoxPositive: {
    backgroundColor: '#e8f5e9',
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
  },
  analysisBoxWarning: {
    backgroundColor: '#ffebee',
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
  },
  analysisLabel: {
    fontWeight: '600',
    fontSize: 15,
    marginBottom: 6,
    color: '#333',
  },
  analysisText: {
    fontSize: 14,
    color: '#444',
    marginBottom: 4,
  },
  rescanButton: {
    backgroundColor: '#4caf50',
    width: 54,
    height: 54,
    borderRadius: 27,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
});

  