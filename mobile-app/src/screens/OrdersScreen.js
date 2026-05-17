import React, { useEffect, useState, useContext } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Image, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../context/AuthContext';
import api from '../api/api';
import { Header } from '../components/Header';

const { width } = Dimensions.get('window');

export default function OrdersScreen({ navigation }) {
  const { user, token } = useContext(AuthContext);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, [user, token]);

  const fetchOrders = async () => {
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const res = await api.get('/orders/my-orders', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setOrders(res.data?.orders || []);
    } catch (err) {
      console.error("Orders fetch failed", err);
    } finally {
      setLoading(false);
    }
  };

  const getDynamicStatus = (order) => {
    if (order.status === 'CANCELLED' || order.status === 'REJECTED') {
      return order.status;
    }
    const product = order.products?.[0];
    if (!product || !product.rentalPeriod?.start || !product.rentalPeriod?.end) {
      return order.status;
    }

    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const start = new Date(product.rentalPeriod.start);
    start.setHours(0, 0, 0, 0);

    const end = new Date(product.rentalPeriod.end);
    end.setHours(23, 59, 59, 999);

    if (now < start) {
      return 'Upcoming Order';
    } else if (now > end) {
      return 'Completed';
    } else {
      return 'Active';
    }
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case 'Active': return { bg: '#dcfce7', color: '#166534' };
      case 'Upcoming Order': return { bg: '#e0e7ff', color: '#3730a3' };
      case 'Completed': return { bg: '#f1f5f9', color: '#475569' };
      case 'CANCELLED': 
      case 'REJECTED': return { bg: '#fee2e2', color: '#991b1b' };
      default: return { bg: '#f1f5f9', color: '#475569' };
    }
  };

  if (loading) {
    return (
      <View style={styles.centerItem}>
        <ActivityIndicator size="large" color="#1193d4" />
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.centerItem}>
        <Ionicons name="lock-closed-outline" size={60} color="#ccc" />
        <Text style={styles.emptyText}>Please login to view your orders.</Text>
        <TouchableOpacity style={styles.loginBtn} onPress={() => navigation.navigate('Login')}>
          <Text style={styles.loginTxt}>Login</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header showBack={true} />
      <View style={{ backgroundColor: '#fff', padding: 15, borderBottomWidth: 1, borderBottomColor: '#eee' }}>
         <Text style={{ fontSize: 20, fontWeight: 'bold' }}>My Orders</Text>
      </View>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {orders.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="cube-outline" size={60} color="#ccc" />
            <Text style={styles.emptyTitle}>No previous orders found.</Text>
            <Text style={styles.emptySub}>You haven't rented any items yet.</Text>
          </View>
        ) : (
          orders.map(o => {
            const dynamicStatus = getDynamicStatus(o);
            const styleLabel = getStatusStyle(dynamicStatus);
            return (
              <TouchableOpacity 
                key={o.id} 
                style={styles.orderCard}
                onPress={() => navigation.navigate('OrderDetails', { id: o.id })}
              >
                <View style={styles.orderHeader}>
                  <View>
                    <Text style={styles.orderId}>Order #{o.id}</Text>
                    <Text style={styles.orderDate}>Placed on {new Date(o.createdAt).toLocaleDateString()}</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <View style={[styles.statusBadge, { backgroundColor: styleLabel.bg }]}>
                      <Text style={[styles.statusTxt, { color: styleLabel.color }]}>{dynamicStatus}</Text>
                    </View>
                    <Text style={styles.orderTotal}>Total: ₹{o.totalAmount}</Text>
                  </View>
                </View>

                {o.products?.map((p, idx) => (
                  <View key={idx} style={styles.productRow}>
                    <View style={styles.imgWrap}>
                      <Image 
                        source={{ uri: p.product?.images?.[0]?.url || 'https://via.placeholder.com/80' }} 
                        style={styles.productImage} 
                      />
                    </View>
                    <View style={styles.productInfo}>
                      <Text style={styles.prodName}>{p.product?.name || 'Unnamed Product'}</Text>
                      <Text style={styles.prodQty}>Qty: {p.quantity}</Text>
                      {p.rentalPeriod?.start && (
                        <Text style={styles.prodDates}>
                          Rental: {new Date(p.rentalPeriod.start).toLocaleDateString()} to {new Date(p.rentalPeriod.end).toLocaleDateString()}
                        </Text>
                      )}
                    </View>
                  </View>
                ))}
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f1f3f6' },
  centerItem: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  header: {
    backgroundColor: '#fff',
    height: 60,
    justifyContent: 'center',
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#212121' },
  scrollContent: { padding: 15, paddingBottom: 30 },
  emptyState: { alignItems: 'center', marginTop: 100 },
  emptyTitle: { fontSize: 18, fontWeight: 'bold', color: '#212121', marginTop: 15 },
  emptySub: { fontSize: 14, color: '#878787', marginTop: 5 },
  emptyText: { marginTop: 15, fontSize: 16, color: '#666' },
  loginBtn: { marginTop: 20, backgroundColor: '#1193d4', paddingHorizontal: 30, paddingVertical: 10, borderRadius: 5 },
  loginTxt: { color: '#fff', fontWeight: 'bold' },
  
  orderCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    elevation: 1,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    paddingBottom: 12,
    marginBottom: 12,
  },
  orderId: { fontWeight: 'bold', fontSize: 15, color: '#0f172a' },
  orderDate: { fontSize: 12, color: '#64748b', marginTop: 2 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, marginBottom: 5 },
  statusTxt: { fontSize: 11, fontWeight: 'bold' },
  orderTotal: { fontWeight: 'bold', fontSize: 14, color: '#212121' },
  
  productRow: { flexDirection: 'row', marginTop: 10, alignItems: 'center' },
  imgWrap: { width: 70, height: 70, borderRadius: 6, overflow: 'hidden', borderWidth: 1, borderColor: '#f0f0f0', marginRight: 15 },
  productImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  productInfo: { flex: 1 },
  prodName: { fontSize: 15, fontWeight: '600', color: '#1e293b', marginBottom: 4 },
  prodQty: { fontSize: 13, color: '#64748b', marginBottom: 2 },
  prodDates: { fontSize: 12, color: '#1193d4', fontWeight: '500' }
});
