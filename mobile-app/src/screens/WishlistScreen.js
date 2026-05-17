import React, { useState, useEffect, useContext, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, ActivityIndicator, Alert, Platform } from 'react-native';

import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthContext } from '../context/AuthContext';

const WISHLIST_KEY = 'ER_WISHLIST';

export default function WishlistScreen({ navigation }) {
  const { user } = useContext(AuthContext);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadWishlist();
  }, []);

  const loadWishlist = async () => {
    try {
      const data = await AsyncStorage.getItem(WISHLIST_KEY);
      setItems(data ? JSON.parse(data) : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const removeItem = async (id) => {
    const updated = items.filter(i => (i.id || i._id) !== id);
    setItems(updated);
    await AsyncStorage.setItem(WISHLIST_KEY, JSON.stringify(updated));
  };

  const renderItem = ({ item }) => {
    const src = item.photos?.[0]?.full_url || item.photos?.[0]?.fullUrl || null;
    const name = item.item_name || item.name || 'Unnamed';
    const price = item.rental_price_per_day || item.price || 0;
    const id = item.id || item._id;

    return (
      <TouchableOpacity 
        style={styles.card} 
        onPress={() => navigation.navigate('ProductDetails', { id })}
      >
        <Image 
          source={src ? { uri: src } : require('../../assets/adaptive-icon.png')} 
          style={styles.img} 
        />
        <View style={styles.info}>
          <Text style={styles.name} numberOfLines={2}>{name}</Text>
          <Text style={styles.price}>₹{price} <Text style={styles.unit}>/ day</Text></Text>
          {item.location && <Text style={styles.loc}>📍 {item.location}</Text>}
        </View>
        <TouchableOpacity style={styles.removeBtn} onPress={() => removeItem(id)}>
          <Ionicons name="heart-dislike" size={22} color="#ef4444" />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color="#2874f0" /></View>;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={{ width: 32 }} /> 
        <Text style={styles.headerTitle}>My Wishlist</Text>
        <View style={{ width: 32 }} />
      </View>


      <FlatList
        data={items}
        keyExtractor={item => String(item.id || item._id)}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="heart-outline" size={60} color="#cbd5e1" />
            <Text style={styles.emptyTitle}>Your wishlist is empty</Text>
            <Text style={styles.emptySub}>Save items you love by tapping the ♡ icon</Text>
            <TouchableOpacity style={styles.browseBtn} onPress={() => navigation.navigate('Main')}>
              <Text style={styles.browseBtnTxt}>Browse Products</Text>
            </TouchableOpacity>
          </View>
        }
      />
    </View>
  );
}

// Helper to add/toggle wishlist from other screens
export async function toggleWishlist(product) {
  try {
    const data = await AsyncStorage.getItem(WISHLIST_KEY);
    let list = data ? JSON.parse(data) : [];
    const id = product.id || product._id;
    const exists = list.find(i => (i.id || i._id) === id);
    if (exists) {
      list = list.filter(i => (i.id || i._id) !== id);
    } else {
      list.push(product);
    }
    await AsyncStorage.setItem(WISHLIST_KEY, JSON.stringify(list));
    return !exists; // true = added, false = removed
  } catch {
    return false;
  }
}

export async function isInWishlist(productId) {
  try {
    const data = await AsyncStorage.getItem(WISHLIST_KEY);
    const list = data ? JSON.parse(data) : [];
    return !!list.find(i => (i.id || i._id) === productId);
  } catch {
    return false;
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: {
    paddingTop: 55, paddingBottom: 15, paddingHorizontal: 20,
    backgroundColor: '#fff', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderBottomWidth: 3, borderBottomColor: '#000000',

    elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 3
  },

  headerTitle: { fontSize: 18, fontWeight: 'bold' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { padding: 15 },
  card: {
    flexDirection: 'row', backgroundColor: '#fff', padding: 12, borderRadius: 12, marginBottom: 12,
    borderWidth: 1, borderColor: '#f1f5f9', alignItems: 'center'
  },
  img: { width: 70, height: 70, borderRadius: 8, backgroundColor: '#f1f5f9' },
  info: { flex: 1, marginLeft: 12 },
  name: { fontSize: 14, fontWeight: '600', color: '#1e293b', marginBottom: 4 },
  price: { fontSize: 15, fontWeight: 'bold', color: '#2874f0' },
  unit: { fontSize: 12, fontWeight: 'normal', color: '#64748b' },
  loc: { fontSize: 12, color: '#64748b', marginTop: 2 },
  removeBtn: { padding: 8 },
  empty: { alignItems: 'center', paddingTop: 80 },
  emptyTitle: { fontSize: 18, fontWeight: 'bold', color: '#1e293b', marginTop: 15 },
  emptySub: { fontSize: 14, color: '#64748b', marginTop: 5 },
  browseBtn: { marginTop: 20, backgroundColor: '#2874f0', paddingHorizontal: 30, paddingVertical: 12, borderRadius: 8 },
  browseBtnTxt: { color: '#fff', fontWeight: 'bold' }
});
