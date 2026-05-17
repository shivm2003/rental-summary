import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, ActivityIndicator, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../api/api';
import { Header } from '../components/Header';

export default function SearchResultsScreen({ route, navigation }) {
  const { query: initialQuery } = route.params || {};
  const [query, setQuery] = useState(initialQuery || '');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialQuery) {
      handleSearch(initialQuery);
    }
  }, [initialQuery]);

  const handleSearch = async (searchQuery) => {
    if (!searchQuery.trim()) return;
    setLoading(true);
    try {
      let url = `/listings?search=${encodeURIComponent(searchQuery)}`;
      if (route.params?.category) {
        url += `&category=${encodeURIComponent(route.params.category)}`;
      }
      const res = await api.get(url);
      setResults(res.data?.data || res.data?.listings || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({ item }) => {
    const src = item.photos && item.photos.length > 0 ? item.photos[0].full_url || item.photos[0].fullUrl : null;
    return (
      <TouchableOpacity 
        style={styles.card} 
        onPress={() => navigation.navigate('ProductDetails', { id: item.id || item._id })}
      >
        <Image source={src ? { uri: src } : require('../../assets/adaptive-icon.png')} style={styles.image} resizeMode="cover" />
        <View style={styles.info}>
          <Text style={styles.title} numberOfLines={2}>{item.item_name || item.name}</Text>
          <Text style={styles.price}>₹{item.rental_price_per_day || item.price} <Text style={styles.unit}>/ day</Text></Text>
          <Text style={styles.location}>📍 {item.location || 'N/A'}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <Header showBack={true} />
      <View style={{ padding: 12, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' }}>
         <Text style={{ fontSize: 16 }}>Results for: <Text style={{ fontWeight: 'bold' }}>"{initialQuery}"</Text></Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#1193d4" style={{ marginTop: 50 }} />
      ) : (
        <FlatList 
          data={results}
          keyExtractor={(item) => item.id || item._id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="search-outline" size={64} color="#ccc" />
              <Text style={styles.emptyText}>No results found for "{query}"</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f1f3f6' },
  header: { 
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', 
    paddingTop: 45, paddingHorizontal: 15, paddingBottom: 15, borderBottomWidth: 1, borderBottomColor: '#eee' 
  },
  backBtn: { padding: 5, marginRight: 10 },
  searchBox: { 
    flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#f0f0f0', 
    borderRadius: 8, paddingHorizontal: 15, height: 40 
  },
  input: { flex: 1, fontSize: 14, color: '#333' },
  list: { padding: 10 },
  card: { 
    flexDirection: 'row', backgroundColor: '#fff', borderRadius: 8, marginBottom: 10, 
    overflow: 'hidden', elevation: 2, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4 
  },
  image: { width: 100, height: 100 },
  info: { flex: 1, padding: 10, justifyContent: 'center' },
  title: { fontSize: 14, fontWeight: '600', color: '#212121', marginBottom: 5 },
  price: { fontSize: 16, fontWeight: 'bold', color: '#1193d4' },
  unit: { fontSize: 12, color: '#878787', fontWeight: 'normal' },
  location: { fontSize: 12, color: '#878787', marginTop: 5 },
  empty: { flex: 1, alignItems: 'center', marginTop: 100 },
  emptyText: { marginTop: 15, fontSize: 16, color: '#666' }
});
