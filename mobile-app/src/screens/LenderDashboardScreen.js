import React, { useState, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../context/AuthContext';
import api from '../api/api';

export default function LenderDashboardScreen({ navigation }) {
  const { token } = useContext(AuthContext);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchDashboard(); }, []);

  const fetchDashboard = async () => {
    try {
      const res = await api.get('/lender/dashboard/stats', { headers: { Authorization: `Bearer ${token}` } });
      if (res.data.success) setData(res.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#2874f0" /></View>;

  const s = data?.stats || {};

  const MenuItem = ({ icon, label, screen, color }) => (
    <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate(screen)}>
      <View style={[styles.menuIcon, { backgroundColor: color + '15' }]}>
        <Ionicons name={icon} size={22} color={color} />
      </View>
      <Text style={styles.menuLabel}>{label}</Text>
      <Ionicons name="chevron-forward" size={20} color="#cbd5e1" />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Lender Suite</Text>
        <TouchableOpacity onPress={() => navigation.navigate('LenderNotifications')}>
          <Ionicons name="notifications-outline" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Earnings Hero */}
        <View style={styles.heroCard}>
          <Text style={styles.heroLabel}>TOTAL LIFETIME EARNINGS</Text>
          <Text style={styles.heroAmount}>₹{s.totalEarnings || '0'}</Text>
          <View style={styles.heroRow}>
            <View style={styles.heroStat}>
              <Text style={styles.heroSubLabel}>MONTHLY</Text>
              <Text style={styles.heroSubVal}>₹{s.monthlyEarnings || '0'}</Text>
            </View>
            <View style={styles.heroStat}>
              <Text style={styles.heroSubLabel}>PENDING</Text>
              <Text style={styles.heroSubVal}>₹{s.pendingPayouts || '0'}</Text>
            </View>
          </View>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: '#eff6ff' }]}>
              <Ionicons name="cube-outline" size={20} color="#2874f0" />
            </View>
            <Text style={styles.statVal}>{s.totalProducts || 0}</Text>
            <Text style={styles.statLabel}>Products</Text>
          </View>
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: '#f0fdf4' }]}>
              <Ionicons name="checkmark-circle-outline" size={20} color="#10b981" />
            </View>
            <Text style={styles.statVal}>{s.availableProducts || 0}</Text>
            <Text style={styles.statLabel}>Available</Text>
          </View>
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: '#fef3c7' }]}>
              <Ionicons name="trending-up-outline" size={20} color="#f59e0b" />
            </View>
            <Text style={styles.statVal}>{s.utilizationRate || 0}%</Text>
            <Text style={styles.statLabel}>Usage</Text>
          </View>
        </View>

        {/* Menu Section */}
        <Text style={styles.sectionTitle}>Management</Text>
        <View style={styles.menuSection}>
          <MenuItem icon="albums-outline" label="Asset Inventory" screen="LenderProducts" color="#2874f0" />
          <MenuItem icon="cart-outline" label="Rental Orders" screen="LenderOrders" color="#10b981" />
          <MenuItem icon="wallet-outline" label="Earnings & Payouts" screen="LenderEarnings" color="#f59e0b" />
          <MenuItem icon="ticket-outline" label="Coupon Management" screen="LenderCoupons" color="#06b6d4" />
          <MenuItem icon="construct-outline" label="Maintenance" screen="Maintenance" color="#ef4444" />
          <MenuItem icon="bar-chart-outline" label="Performance Analytics" screen="LenderAnalytics" color="#8b5cf6" />
        </View>

        <Text style={styles.sectionTitle}>Tools</Text>
        <View style={styles.menuSection}>
          <MenuItem icon="add-circle-outline" label="List a New Product" screen="ListProduct" color="#ec4899" />
          <MenuItem icon="notifications-outline" label="Lender Notifications" screen="LenderNotifications" color="#64748b" />
        </View>

        <View style={{height: 40}} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: { 
    paddingTop: Platform.OS === 'ios' ? 50 : 40, 
    paddingBottom: 15, paddingHorizontal: 20, 
    backgroundColor: '#1e293b', flexDirection: 'row', 
    alignItems: 'center', justifyContent: 'space-between' 
  },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#fff' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scroll: { padding: 20 },
  heroCard: { 
    backgroundColor: '#2874f0', borderRadius: 20, padding: 25, 
    marginBottom: 20, elevation: 8, shadowColor: '#2874f0', 
    shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 12 
  },
  heroLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 11, fontWeight: 'bold', letterSpacing: 1 },
  heroAmount: { color: '#fff', fontSize: 34, fontWeight: 'bold', marginVertical: 8 },
  heroRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.2)', paddingTop: 12 },
  heroStat: {},
  heroSubLabel: { color: 'rgba(255,255,255,0.6)', fontSize: 10, fontWeight: 'bold', letterSpacing: 1 },
  heroSubVal: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginTop: 2 },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 25 },
  statCard: { flex: 1, backgroundColor: '#fff', padding: 12, borderRadius: 14, alignItems: 'center', borderWidth: 1, borderColor: '#f1f5f9' },
  statIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  statVal: { fontSize: 18, fontWeight: 'bold', color: '#1e293b' },
  statLabel: { fontSize: 10, color: '#64748b', marginTop: 2 },
  sectionTitle: { fontSize: 13, fontWeight: 'bold', color: '#64748b', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 },
  menuSection: {
    backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden', marginBottom: 25, borderWidth: 1, borderColor: '#f1f5f9'
  },
  menuItem: {
    flexDirection: 'row', alignItems: 'center', padding: 15, borderBottomWidth: 1, borderBottomColor: '#f8fafc'
  },
  menuIcon: {
    width: 38, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginRight: 15
  },
  menuLabel: {
    flex: 1, fontSize: 15, fontWeight: '500', color: '#1e293b'
  }
});
