import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, ActivityIndicator, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../api/api';

export default function CategoryPageScreen({ route, navigation }) {
  const { slug, categoryName } = route.params;
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState('newest');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [condition, setCondition] = useState('');
  const [availability, setAvailability] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => { loadProducts(); }, [slug, sort, condition]);

  const loadProducts = async () => {
    setLoading(true);
    try {
      let url = `/listings?category=${encodeURIComponent(slug)}&sort=${sort}`;
      if (condition) url += `&condition=${condition}`;
      
      const res = await api.get(url);
      let items = res.data?.data || res.data?.listings || [];
      
      // Local filtering for price
      if (minPrice) items = items.filter(i => (i.rental_price_per_day || i.price || 0) >= Number(minPrice));
      if (maxPrice) items = items.filter(i => (i.rental_price_per_day || i.price || 0) <= Number(maxPrice));
      if (availability) items = items.filter(i => i.is_available !== false);
      
      setProducts(items);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };


  const title = categoryName || slug?.split('-').map(w => w[0].toUpperCase() + w.slice(1)).join(' ') || 'Category';

  const renderProduct = ({ item }) => {
    const src = item.photos?.[0]?.full_url || item.photos?.[0]?.fullUrl || null;
    const name = item.item_name || item.name || 'Unnamed';
    const price = item.rental_price_per_day || item.price || 0;

    return (
      <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('ProductDetails', { id: item.id || item._id })}>
        {src ? (
          <Image source={{ uri: src }} style={styles.prodImg} />
        ) : (
          <View style={[styles.prodImg, styles.placeholder]}><Text style={{ fontSize: 28 }}>📦</Text></View>
        )}
        <View style={styles.cardBody}>
          <Text style={styles.prodName} numberOfLines={2}>{name}</Text>
          <Text style={styles.prodPrice}>₹{price} <Text style={styles.perDay}>/ {item.price_unit || 'day'}</Text></Text>
          {item.location && <Text style={styles.prodLoc} numberOfLines={1}>📍 {item.location}</Text>}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.hero}>
        <View>
          <Text style={styles.heroTitle}>{title} Rentals</Text>
          <Text style={styles.heroSub}>Find the best items to rent</Text>
        </View>
      </View>


      <View style={styles.toolbar}>
        <Text style={styles.resultCount}>{products.length} items</Text>
        <View style={styles.toolRight}>
          <TouchableOpacity style={styles.sortBtn} onPress={() => {
            const opts = ['newest', 'popular', 'price'];
            const idx = (opts.indexOf(sort) + 1) % opts.length;
            setSort(opts[idx]);
          }}>
            <Ionicons name="swap-vertical" size={16} color="#2874f0" />
            <Text style={styles.sortTxt}>{sort === 'newest' ? 'Newest' : sort === 'popular' ? 'Popular' : 'Price ↑'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.filterToggle} onPress={() => setShowFilters(!showFilters)}>
            <Ionicons name="options-outline" size={18} color="#2874f0" />
          </TouchableOpacity>
        </View>
      </View>

      {showFilters && (
        <View style={styles.filterBar}>
          <View style={styles.filterSection}>
            <Text style={styles.filterLabel}>Price Range</Text>
            <View style={styles.priceRow}>
              <TextInput style={styles.filterInput} placeholder="Min ₹" keyboardType="numeric" value={minPrice} onChangeText={setMinPrice} />
              <Text style={styles.filterTo}>to</Text>
              <TextInput style={styles.filterInput} placeholder="Max ₹" keyboardType="numeric" value={maxPrice} onChangeText={setMaxPrice} />
            </View>
          </View>

          <View style={styles.filterSection}>
            <Text style={styles.filterLabel}>Condition</Text>
            <View style={styles.chipRow}>
              {['New', 'Good', 'Fair'].map(c => (
                <TouchableOpacity 
                  key={c} 
                  style={[styles.chip, condition === c.toLowerCase() && styles.chipActive]}
                  onPress={() => setCondition(condition === c.toLowerCase() ? '' : c.toLowerCase())}
                >
                  <Text style={[styles.chipText, condition === c.toLowerCase() && styles.chipTextActive]}>{c}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.filterFooter}>
            <TouchableOpacity style={styles.applyBtn} onPress={loadProducts}>
              <Text style={styles.applyTxt}>Apply Filters</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => { setMinPrice(''); setMaxPrice(''); setCondition(''); setAvailability(true); }}>
              <Text style={styles.resetTxt}>Reset All</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}


      {loading ? (
        <ActivityIndicator size="large" color="#2874f0" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={products}
          numColumns={2}
          keyExtractor={item => String(item.id || item._id)}
          renderItem={renderProduct}
          contentContainerStyle={styles.grid}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="search-outline" size={48} color="#cbd5e1" />
              <Text style={styles.emptyTxt}>No items found in {title}</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  hero: { 
    backgroundColor: '#1e293b', 
    paddingTop: 60, 
    paddingBottom: 25, 
    paddingHorizontal: 20, 
    flexDirection: 'row', 
    alignItems: 'center',
    borderBottomWidth: 3,
    borderBottomColor: '#000000'

  },

  heroTitle: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
  heroSub: { fontSize: 13, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  toolbar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  resultCount: { fontSize: 13, color: '#64748b', fontWeight: '500' },
  toolRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  sortBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6, backgroundColor: '#eff6ff' },
  sortTxt: { fontSize: 12, color: '#2874f0', fontWeight: '600' },
  filterToggle: { padding: 6, borderRadius: 6, backgroundColor: '#eff6ff' },
  filterBar: { padding: 15, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  filterSection: { marginBottom: 15 },
  filterLabel: { fontSize: 13, fontWeight: 'bold', color: '#475569', marginBottom: 8 },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  filterInput: { flex: 1, borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 6, padding: 8, fontSize: 13 },
  filterTo: { fontSize: 12, color: '#94a3b8' },
  chipRow: { flexDirection: 'row', gap: 8 },
  chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: '#f1f5f9', borderWidth: 1, borderColor: '#e2e8f0' },
  chipActive: { backgroundColor: '#2874f0', borderColor: '#2874f0' },
  chipText: { fontSize: 12, color: '#64748b' },
  chipTextActive: { color: '#fff', fontWeight: 'bold' },
  filterFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
  applyBtn: { backgroundColor: '#2874f0', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 },
  applyTxt: { color: '#fff', fontSize: 13, fontWeight: 'bold' },
  resetTxt: { color: '#64748b', fontSize: 13 },
  grid: { padding: 8 },

  card: { flex: 1/2, margin: 6, backgroundColor: '#fff', borderRadius: 10, overflow: 'hidden', borderWidth: 1, borderColor: '#f1f5f9' },
  prodImg: { width: '100%', height: 120, resizeMode: 'cover' },
  placeholder: { backgroundColor: '#f1f5f9', justifyContent: 'center', alignItems: 'center' },
  cardBody: { padding: 10 },
  prodName: { fontSize: 13, fontWeight: '600', color: '#1e293b', marginBottom: 4, height: 34 },
  prodPrice: { fontSize: 14, fontWeight: 'bold', color: '#2874f0' },
  perDay: { fontSize: 11, fontWeight: 'normal', color: '#64748b' },
  prodLoc: { fontSize: 11, color: '#64748b', marginTop: 4 },
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyTxt: { marginTop: 12, fontSize: 15, color: '#94a3b8' }
});
