import React, { useState, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, ActivityIndicator, Alert, Platform, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../context/AuthContext';
import api from '../api/api';

export default function LenderProductsScreen({ navigation }) {
  const { token, user } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState('All');
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProducts();
  }, [token]);

  const fetchProducts = async () => {
    if (!token) return;
    try {
      setLoading(true);
      const res = await api.get('/lender/dashboard/products', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setAssets(res.data.products || []);
      }
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (id) => {
    try {
      const res = await api.patch(`/products/${id}/toggle-status`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        fetchProducts();
      }
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Failed to update status');
    }
  };

  const handleDelete = async (id) => {
    Alert.alert(
      "Confirm Deletion",
      "Are you sure you want to delete this listing? It will be moved to 'Deleted'.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: async () => {
          try {
            const res = await api.delete(`/products/${id}`, {
              headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data.success) {
              fetchProducts();
            }
          } catch (err) {
            console.error(err);
            Alert.alert('Error', 'Failed to delete listing');
          }
        }}
      ]
    );
  };

  const handleRestore = async (id) => {
    try {
      const res = await api.patch(`/products/${id}/restore`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        fetchProducts();
      }
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Failed to restore listing');
    }
  };

  const tabs = ['All', 'Available', 'Rented', 'Maintenance', 'Deleted'];

  const filteredAssets = assets.filter(a => {
    if (activeTab === 'Deleted') return a.status === 'deleted';
    if (a.status === 'deleted') return false;
    
    if (activeTab === 'All') return true;
    if (activeTab === 'Available') return a.status === 'Available' || a.status === 'active';
    if (activeTab === 'Rented') return a.status === 'Rented';
    if (activeTab === 'Maintenance') return a.status === 'Maintenance';
    return true;
  });

  const stats = {
    total: assets.length,
    rented: assets.filter(a => a.status === 'Rented').length,
    revenue: assets.reduce((acc, a) => acc + (a.status === 'Rented' ? Number(a.price) : 0), 0),
    maintenance: assets.filter(a => a.status === 'Maintenance').length,
  };

  const renderItem = ({ item }) => {
    const isDeleted = item.status === 'deleted';
    const isInactive = item.status === 'Inactive';

    return (
      <View style={styles.card}>
        <View style={styles.cardTop}>
          <Image 
            source={{ uri: item.img || 'https://via.placeholder.com/150' }} 
            style={styles.prodImg} 
          />
          <View style={styles.prodInfo}>
            <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start'}}>
               <Text style={styles.prodId}>AST{item.id}</Text>
               <View style={[styles.badge, { backgroundColor: getStatusColor(item.status) }]}>
                  <Text style={styles.badgeText}>{item.status.toUpperCase()}</Text>
               </View>
            </View>
            <Text style={styles.prodName} numberOfLines={1}>{item.name}</Text>
            <Text style={styles.prodCat}>{item.cat}</Text>
            <Text style={styles.prodPrice}>₹{item.price} <Text style={{fontSize:12, color: '#64748b', fontWeight:'normal'}}>/ day</Text></Text>
          </View>
        </View>

        <View style={styles.cardActions}>
          {isDeleted ? (
            <TouchableOpacity style={styles.actionBtn} onPress={() => handleRestore(item.id)}>
              <Ionicons name="refresh" size={16} color="#2874f0" />
              <Text style={styles.actionBtnTxt}>Restore</Text>
            </TouchableOpacity>
          ) : (
            <>
              <TouchableOpacity style={styles.iconActionBtn} onPress={() => navigation.navigate('EditProduct', { id: item.id })}>
                <Ionicons name="pencil" size={18} color="#2874f0" />
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.iconActionBtn} onPress={() => handleToggleStatus(item.id)}>
                <Ionicons name={isInactive ? "eye" : "eye-off"} size={18} color={isInactive ? "#10b981" : "#64748b"} />
              </TouchableOpacity>

              <TouchableOpacity style={[styles.iconActionBtn, {backgroundColor: '#fee2e2'}]} onPress={() => handleDelete(item.id)}>
                <Ionicons name="trash" size={18} color="#ef4444" />
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    );
  };

  const getStatusColor = (status) => {
    const s = status.toLowerCase();
    if (s === 'available' || s === 'active') return '#10b981';
    if (s === 'rented') return '#2874f0';
    if (s === 'maintenance') return '#ef4444';
    if (s === 'deleted') return '#64748b';
    return '#f59e0b'; // inactive
  };

  const StatCard = ({ label, value, icon, color, subText }) => (
    <View style={styles.statCard}>
      <View style={[styles.statIcon, { backgroundColor: color + '15' }]}>
        <Ionicons name={icon} size={20} color={color} />
      </View>
      <Text style={styles.statVal}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
      {subText && <Text style={styles.statSubText}>{subText}</Text>}
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 5, marginRight: 10 }}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Asset Inventory</Text>
        <TouchableOpacity onPress={() => navigation.navigate('ListProduct')} style={styles.btnAddHeader}>
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <FlatList 
        data={filteredAssets}
        keyExtractor={item => item.id.toString()}
        renderItem={renderItem}
        contentContainerStyle={{ paddingBottom: 30 }}
        ListHeaderComponent={
          <>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.statsScroll} contentContainerStyle={{paddingRight: 30}}>
              <StatCard label="TOTAL ASSETS" value={stats.total} icon="cube-outline" color="#2874f0" subText="+0 this month" />
              <StatCard label="RENTED" value={stats.rented} icon="refresh-outline" color="#10b981" subText="0% utilization" />
              <StatCard label="REVENUE" value={`₹${stats.revenue}`} icon="wallet-outline" color="#f59e0b" />
              <StatCard label="MAINTENANCE" value={stats.maintenance} icon="construct-outline" color="#ef4444" />
            </ScrollView>

            <View style={styles.tabsContainer}>
              <FlatList 
                horizontal
                showsHorizontalScrollIndicator={false}
                data={tabs}
                keyExtractor={t => t}
                renderItem={({ item }) => (
                  <TouchableOpacity 
                    style={[styles.tabBtn, activeTab === item && styles.tabBtnActive]}
                    onPress={() => setActiveTab(item)}
                  >
                    <Text style={[styles.tabTxt, activeTab === item && styles.tabTxtActive]}>{item}</Text>
                  </TouchableOpacity>
                )}
                contentContainerStyle={{ paddingHorizontal: 15 }}
              />
            </View>
          </>
        }
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <Ionicons name="cube-outline" size={48} color="#ccc" />
            <Text style={styles.emptyText}>No assets found in "{activeTab}"</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: {
    backgroundColor: '#fff', paddingHorizontal: 15, paddingTop: Platform.OS === 'ios' ? 45 : 40, paddingBottom: 15,
    flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#f1f5f9',
    justifyContent: 'space-between'
  },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#0f172a' },
  btnAddHeader: {
    backgroundColor: '#2874f0', width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center'
  },
  statsScroll: {
    paddingVertical: 20, paddingLeft: 15, backgroundColor: '#fff'
  },
  statCard: {
    width: 140, backgroundColor: '#fff', padding: 15, borderRadius: 12, marginRight: 12,
    borderWidth: 1, borderColor: '#f1f5f9', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4
  },
  statIcon: {
    width: 40, height: 40, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginBottom: 10
  },
  statVal: { fontSize: 18, fontWeight: 'bold', color: '#0f172a' },
  statLabel: { fontSize: 10, color: '#64748b', fontWeight: 'bold', marginTop: 2 },
  statSubText: { fontSize: 10, color: '#10b981', marginTop: 4, fontWeight: '600' },
  tabsContainer: {
    backgroundColor: '#fff', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f1f5f9'
  },
  tabBtn: {
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#f1f5f9', marginRight: 8,
    borderWidth: 1, borderColor: '#e2e8f0'
  },
  tabBtnActive: {
    backgroundColor: '#2874f0', borderColor: '#2874f0'
  },
  tabTxt: {
    fontSize: 13, color: '#64748b', fontWeight: '600'
  },
  tabTxtActive: {
    color: '#fff'
  },
  card: {
    backgroundColor: '#fff', borderRadius: 12, padding: 15, marginTop: 15, marginHorizontal: 15,
    borderWidth: 1, borderColor: '#f1f5f9', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4
  },
  cardTop: {
    flexDirection: 'row',
  },
  prodImg: {
    width: 80, height: 80, borderRadius: 10, backgroundColor: '#f8fafc'
  },
  prodInfo: {
    flex: 1, marginLeft: 15,
  },
  prodId: {
    fontSize: 12, fontWeight: 'bold', color: '#2874f0', marginBottom: 2
  },
  prodName: {
    fontSize: 15, fontWeight: '600', color: '#0f172a', marginBottom: 4
  },
  prodCat: {
    fontSize: 12, color: '#64748b', marginBottom: 6
  },
  prodPrice: {
    fontSize: 16, fontWeight: 'bold', color: '#0f172a'
  },
  badge: {
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6,
  },
  badgeText: {
    fontSize: 10, color: '#fff', fontWeight: 'bold'
  },
  cardActions: {
    flexDirection: 'row', justifyContent: 'flex-end', marginTop: 15, paddingTop: 15, borderTopWidth: 1, borderTopColor: '#f1f5f9', gap: 10
  },
  iconActionBtn: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: '#eff6ff', justifyContent: 'center', alignItems: 'center'
  },
  actionBtn: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#eff6ff', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 8
  },
  actionBtnTxt: {
    marginLeft: 6, fontSize: 13, color: '#2874f0', fontWeight: '600'
  },
  emptyWrap: {
    alignItems: 'center', marginTop: 50
  },
  emptyText: {
    marginTop: 15, fontSize: 14, color: '#64748b'
  }
});
