import React, { useState, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, ActivityIndicator, TouchableOpacity, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../context/AuthContext';
import api from '../api/api';

export default function OrderDetailsScreen({ route, navigation }) {
  const { id } = route.params;
  const { token } = useContext(AuthContext);
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrderDetails();
  }, []);

  const fetchOrderDetails = async () => {
    try {
      const res = await api.get(`/orders/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setOrder(res.data.order);
      }
    } catch (err) {
      console.error('Failed to fetch order:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2874f0" />
      </View>
    );
  }

  if (!order) {
    return (
      <View style={styles.center}>
        <Text>Order not found</Text>
      </View>
    );
  }

  const prod = order.products[0].product;
  const period = order.products[0].rentalPeriod;

  const getStatusColor = (status) => {
    switch (status) {
      case 'ORDERED': return '#2874f0';
      case 'COMPLETED': return '#10b981';
      case 'CANCELLED': return '#ef4444';
      default: return '#f59e0b';
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Order Details</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.statusSection}>
           <Text style={styles.idLabel}>ORDER #{order.id}</Text>
           <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) }]}>
             <Text style={styles.statusText}>{order.status}</Text>
           </View>
        </View>

        <View style={styles.itemCard}>
          <Image source={{ uri: prod.images[0].url }} style={styles.itemImg} />
          <View style={styles.itemInfo}>
            <Text style={styles.itemName} numberOfLines={1}>{prod.name}</Text>
            <Text style={styles.itemDesc} numberOfLines={2}>{prod.description}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionHeading}>Rental Period</Text>
          <View style={styles.dateRow}>
            <View style={styles.dateBox}>
              <Text style={styles.dateLabel}>START</Text>
              <Text style={styles.dateVal}>{new Date(period.start).toLocaleDateString()}</Text>
            </View>
            <Ionicons name="arrow-forward" size={20} color="#cbd5e1" />
            <View style={styles.dateBox}>
              <Text style={styles.dateLabel}>END</Text>
              <Text style={styles.dateVal}>{new Date(period.end).toLocaleDateString()}</Text>
            </View>
          </View>
          <Text style={styles.durationText}>{period.durationDays} Days Duration</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionHeading}>Lender Information</Text>
          <View style={styles.lenderBox}>
            <Ionicons name="person-circle-outline" size={40} color="#cbd5e1" />
            <View style={styles.lenderInfo}>
              <Text style={styles.lenderName}>{order.lender.name}</Text>
              <Text style={styles.lenderEmail}>{order.lender.email}</Text>
            </View>
            <TouchableOpacity onPress={() => navigation.navigate('ChatRoom', { roomId: order.id, receiverId: order.lender.userId })}>
              <Ionicons name="chatbubble-ellipses" size={24} color="#2874f0" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionHeading}>Price Details</Text>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Base Rental</Text>
            <Text style={styles.priceVal}>₹{order.baseRental}</Text>
          </View>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Security Deposit</Text>
            <Text style={styles.priceVal}>₹{order.securityDeposit}</Text>
          </View>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Delivery Charge</Text>
            <Text style={styles.priceVal}>₹{order.deliveryCharge}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.priceRow}>
            <Text style={styles.totalLabel}>Total Amount</Text>
            <Text style={styles.totalVal}>₹{order.totalAmount}</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.helpBtn} onPress={() => navigation.navigate('Contact')}>
          <Text style={styles.helpBtnText}>NEED HELP WITH THIS ORDER?</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: {
    paddingTop: 50, paddingBottom: 15, paddingHorizontal: 20,
    backgroundColor: '#fff', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderBottomWidth: 1, borderBottomColor: '#f1f5f9'
  },
  headerTitle: { fontSize: 18, fontWeight: 'bold' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scroll: { padding: 20 },
  statusSection: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  idLabel: { fontSize: 14, fontWeight: 'bold', color: '#64748b' },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  statusText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  itemCard: {
    flexDirection: 'row', backgroundColor: '#fff', padding: 15, borderRadius: 12, marginBottom: 20,
    borderWidth: 1, borderColor: '#f1f5f9'
  },
  itemImg: { width: 80, height: 80, borderRadius: 8, backgroundColor: '#f1f5f9' },
  itemInfo: { flex: 1, marginLeft: 15 },
  itemName: { fontSize: 16, fontWeight: 'bold', color: '#1e293b', marginBottom: 5 },
  itemDesc: { fontSize: 13, color: '#64748b', lineHeight: 18 },
  section: { backgroundColor: '#fff', padding: 20, borderRadius: 12, marginBottom: 20, borderWidth: 1, borderColor: '#f1f5f9' },
  sectionHeading: { fontSize: 14, fontWeight: 'bold', color: '#64748b', marginBottom: 15, textTransform: 'uppercase' },
  dateRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  dateBox: { alignItems: 'center' },
  dateLabel: { fontSize: 10, color: '#94a3b8', fontWeight: 'bold', marginBottom: 5 },
  dateVal: { fontSize: 15, fontWeight: '600', color: '#1e293b' },
  durationText: { fontSize: 13, color: '#2874f0', textAlign: 'center', marginTop: 5, fontWeight: '500' },
  lenderBox: { flexDirection: 'row', alignItems: 'center' },
  lenderInfo: { flex: 1, marginLeft: 12 },
  lenderName: { fontSize: 15, fontWeight: 'bold', color: '#1e293b' },
  lenderEmail: { fontSize: 13, color: '#64748b' },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  priceLabel: { fontSize: 14, color: '#64748b' },
  priceVal: { fontSize: 14, fontWeight: '500', color: '#1e293b' },
  divider: { height: 1, backgroundColor: '#f1f5f9', marginVertical: 10 },
  totalLabel: { fontSize: 16, fontWeight: 'bold', color: '#1e293b' },
  totalVal: { fontSize: 20, fontWeight: 'bold', color: '#2874f0' },
  helpBtn: { padding: 15, alignItems: 'center', marginBottom: 30 },
  helpBtnText: { color: '#64748b', fontSize: 13, fontWeight: 'bold', letterSpacing: 1 }
});
