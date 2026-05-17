import React, { useState, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../context/AuthContext';
import api from '../api/api';

export default function LenderOrdersScreen({ navigation }) {
  const { token } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState('Active Rentals');
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const tabs = ['Active Rentals', 'Upcoming Bookings', 'Completed', 'Extensions/Returns'];

  useEffect(() => {
    fetchOrders();
  }, [token]);

  const fetchOrders = async () => {
    if (!token) return;
    try {
      setLoading(true);
      const res = await api.get('/lender/dashboard/orders', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setOrders(res.data.orders || []);
      }
    } catch (err) {
      console.error(err);
      // Fallback data if endpoint fails while building or mimicking lack of orders
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredOrders = orders; // We could filter by activeTab if the API returned all of them

  const getStatusColor = (status) => {
    if (!status) return '#64748b';
    const s = status.toLowerCase();
    if (s.includes('active') || s.includes('rented')) return '#2874f0';
    if (s.includes('completed')) return '#10b981';
    if (s.includes('overdue')) return '#ef4444';
    if (s.includes('maintenance')) return '#f59e0b';
    return '#64748b'; 
  };

  const renderItem = ({ item }) => {
    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.orderId}>ID: {item.id}</Text>
          <View style={[styles.badge, { backgroundColor: getStatusColor(item.status) }]}>
            <Text style={styles.badgeText}>{(item.status || 'Active').toUpperCase()}</Text>
          </View>
        </View>

        <View style={styles.cardBody}>
          <Image 
            source={{ uri: item.img || 'https://via.placeholder.com/150' }} 
            style={styles.prodImg} 
          />
          <View style={styles.prodInfo}>
            <Text style={styles.prodName} numberOfLines={2}>{item.product}</Text>
            <Text style={styles.customerName}><Ionicons name="person-outline" size={12}/> {item.customer}</Text>
            <Text style={styles.customerLoc}><Ionicons name="location-outline" size={12}/> {item.location}</Text>
          </View>
        </View>

        <View style={styles.cardFooter}>
          <View style={styles.footerCol}>
            <Text style={styles.label}>DURATION</Text>
            <Text style={styles.value}>{item.duration}</Text>
            <Text style={styles.subValue}>{item.start} - {item.end}</Text>
          </View>
          <View style={[styles.footerCol, { alignItems: 'flex-end' }]}>
            <Text style={styles.label}>AMOUNT</Text>
            <Text style={[styles.value, { color: '#059669' }]}>{item.amount}</Text>
          </View>
        </View>

        <View style={styles.cardActions}>
          <TouchableOpacity style={styles.actionBtn}>
            <Ionicons name="eye-outline" size={16} color="#333" />
            <Text style={styles.actionBtnTxt}>View Details</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn}>
            <Ionicons name="chatbubble-outline" size={16} color="#333" />
            <Text style={styles.actionBtnTxt}>Message</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 5, marginRight: 10 }}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Rental Orders</Text>
      </View>

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

      {loading ? (
        <ActivityIndicator size="large" color="#2874f0" style={{ marginTop: 50 }} />
      ) : (
        <FlatList 
          data={filteredOrders}
          keyExtractor={(item, index) => item.id ? item.id.toString() : index.toString()}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 15 }}
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <Ionicons name="bag-handle-outline" size={48} color="#ccc" />
              <Text style={styles.emptyText}>No {activeTab.toLowerCase()} found.</Text>
              <Text style={styles.emptySubText}>When customers rent your products, they will appear here.</Text>
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
    backgroundColor: '#fff', paddingHorizontal: 15, paddingTop: 45, paddingBottom: 15,
    flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#e0e0e0'
  },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#212121' },
  tabsContainer: {
    backgroundColor: '#fff', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#e0e0e0'
  },
  tabBtn: {
    paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20, backgroundColor: '#f0f0f0', marginRight: 10
  },
  tabBtnActive: {
    backgroundColor: '#2874f0'
  },
  tabTxt: {
    fontSize: 14, color: '#333', fontWeight: '500'
  },
  tabTxtActive: {
    color: '#fff'
  },
  card: {
    backgroundColor: '#fff', borderRadius: 8, padding: 15, marginBottom: 15, borderWidth: 1, borderColor: '#e0e0e0'
  },
  cardHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: '#f0f0f0'
  },
  orderId: {
    fontSize: 13, fontWeight: 'bold', color: '#2874f0'
  },
  badge: {
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4,
  },
  badgeText: {
    fontSize: 10, color: '#fff', fontWeight: 'bold'
  },
  cardBody: {
    flexDirection: 'row', marginBottom: 15
  },
  prodImg: {
    width: 60, height: 60, borderRadius: 6, backgroundColor: '#f9f9f9', borderWidth: 1, borderColor: '#eee'
  },
  prodInfo: {
    flex: 1, marginLeft: 12, justifyContent: 'center'
  },
  prodName: {
    fontSize: 14, fontWeight: '600', color: '#212121', marginBottom: 6
  },
  customerName: {
    fontSize: 12, color: '#64748b', marginBottom: 2
  },
  customerLoc: {
    fontSize: 12, color: '#64748b'
  },
  cardFooter: {
    flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#f8fafc', padding: 10, borderRadius: 6, marginBottom: 10
  },
  footerCol: {
    flex: 1
  },
  label: {
    fontSize: 10, color: '#94a3b8', fontWeight: 'bold', marginBottom: 2
  },
  value: {
    fontSize: 13, fontWeight: 'bold', color: '#334155'
  },
  subValue: {
    fontSize: 11, color: '#64748b', marginTop: 2
  },
  cardActions: {
    flexDirection: 'row', justifyContent: 'flex-end', paddingTop: 10, borderTopWidth: 1, borderTopColor: '#f0f0f0', gap: 10
  },
  actionBtn: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8fafc', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 4, borderWidth: 1, borderColor: '#e2e8f0'
  },
  actionBtnTxt: {
    marginLeft: 6, fontSize: 13, color: '#333', fontWeight: '500'
  },
  emptyWrap: {
    alignItems: 'center', marginTop: 50, paddingHorizontal: 20
  },
  emptyText: {
    marginTop: 15, fontSize: 16, color: '#333', fontWeight: '500'
  },
  emptySubText: {
    marginTop: 5, fontSize: 13, color: '#878787', textAlign: 'center', lineHeight: 18
  }
});
