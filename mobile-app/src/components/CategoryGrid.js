import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import api from '../api/api';

export default function CategoryGrid() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation();

  useEffect(() => {
    fetchHomepageCategories();
  }, []);

  const fetchHomepageCategories = async () => {
    try {
      const response = await api.get('/categories/homepage');
      if (response.data && response.data.categories) {
        const data = response.data.categories;
        setCategories(data.filter(cat => !cat.parent_id));
      }

    } catch (e) {
      console.error('Failed to fetch categories:', e);
    } finally {
      setLoading(false);
    }
  };

  const INITIAL_COLORS = ['#0ea5e9','#8b5cf6','#f59e0b','#10b981','#ef4444','#f97316','#06b6d4','#ec4899'];

  if (loading) {
    return <ActivityIndicator size="small" color="#2874f0" style={{ margin: 20 }} />;
  }

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.gridContainer}>
      {categories.map((cat, index) => {
        const color = INITIAL_COLORS[index % INITIAL_COLORS.length];
        return (
          <TouchableOpacity 
            key={cat.id || index} 
             style={styles.card} 
             onPress={() => navigation.navigate('CategoryPage', { slug: cat.slug, categoryName: cat.name })}

          >
            <View style={[styles.blob, { backgroundColor: `${color}15` }]}>
              {cat.image_url ? (
                <Image source={{ uri: cat.image_url }} style={styles.image} resizeMode="contain" />
              ) : (
                <Text style={[styles.initial, { color }]}>{cat.name?.charAt(0).toUpperCase()}</Text>
              )}
            </View>
            <Text style={styles.label} numberOfLines={2}>{cat.name}</Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  gridContainer: {
    paddingHorizontal: 15,
    paddingVertical: 10,
    gap: 12,
  },
  card: {
    alignItems: 'center',
    width: 76,
  },
  blob: {
    width: 66,
    height: 66,
    borderRadius: 33,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
    backgroundColor: '#fff',
  },
  image: {
    width: 44,
    height: 44,
  },
  initial: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  label: {
    fontSize: 12,
    color: '#333',
    fontWeight: '500',
    textAlign: 'center',
  }
});
