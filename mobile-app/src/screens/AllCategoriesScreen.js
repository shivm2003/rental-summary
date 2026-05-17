import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../api/api';

export default function AllCategoriesScreen({ navigation }) {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await api.get('/categories');
      const data = res.data?.categories || res.data || [];
      const topLevel = Array.isArray(data) ? data.filter(cat => !cat.parent_id) : [];
      setCategories(topLevel);


    } catch (err) {
      console.error('Failed to fetch categories:', err);
    } finally {
      setLoading(false);
    }
  };

  const INITIAL_COLORS = ['#0ea5e9','#8b5cf6','#f59e0b','#10b981','#ef4444','#f97316','#06b6d4','#ec4899'];

  const renderItem = ({ item, index }) => {
    const color = INITIAL_COLORS[index % INITIAL_COLORS.length];
    const catImage = item.image_url || item.image;

    return (
      <TouchableOpacity 
        style={styles.categoryCard} 
        onPress={() => navigation.navigate('CategoryPage', { slug: item.slug || item.name.toLowerCase().replace(/\s+/g, '-'), categoryName: item.name })}
      >
        <View style={[styles.blob, { backgroundColor: `${color}15` }]}>
          {catImage ? (
            <Image source={{ uri: catImage }} style={styles.catImage} />
          ) : (
            <Text style={[styles.initial, { color }]}>{item.name?.charAt(0).toUpperCase()}</Text>
          )}
        </View>
        <Text style={styles.categoryName} numberOfLines={2}>{item.name}</Text>
      </TouchableOpacity>
    );
  };


  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2874f0" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={{ width: 40 }} />
        <Text style={styles.headerTitle}>All Categories</Text>
        <View style={{ width: 40 }} />
      </View>


      <FlatList 
        data={categories}
        keyExtractor={(item) => item.id?.toString() || item.name}
        numColumns={3}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: {
    paddingTop: 55, paddingBottom: 15, paddingHorizontal: 20,
    backgroundColor: '#fff', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderBottomWidth: 3, borderBottomColor: '#000000',
    elevation: 3, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 3
  },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#1e293b' },

  categoryCard: {
    flex: 1 / 3, backgroundColor: '#fff', margin: 5, padding: 12, 
    borderRadius: 16, alignItems: 'center', justifyContent: 'center',
    elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4
  },
  blob: {
    width: 60, height: 60, borderRadius: 30, backgroundColor: '#f0f7ff',
    alignItems: 'center', justifyContent: 'center', marginBottom: 10,
    overflow: 'hidden'
  },
  catImage: { width: 40, height: 40, resizeMode: 'contain' },
  initial: { fontSize: 24, fontWeight: 'bold' },
  categoryName: { fontSize: 13, fontWeight: '600', color: '#334155', textAlign: 'center', minHeight: 32 }

});
