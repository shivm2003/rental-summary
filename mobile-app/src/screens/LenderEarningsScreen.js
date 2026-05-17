import React, { useState, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../context/AuthContext';
import api from '../api/api';

export default function LenderEarningsScreen({ navigation }) {
  const { token } = useContext(AuthContext);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEarnings();
  }, []);

  const fetchEarnings = async () => {
    try {
      const res = await api.get('/lender/dashboard/earnings', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setData(res.data.earnings);
      }
    } catch (err) {
      console.error('Failed to fetch earnings:', err);
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

  const StatCard = ({ title, amount, icon, color, sub }) => (
    <View style={styles.card}>
      <View style={[styles.iconBox, { backgroundColor: color + '15' }]}>
        <Ionicons name={icon} size={24} color={color} />
      </View>
      <View style={styles.cardInfo}>
        <Text style={styles.cardTitle}>{title}</Text>
        <Text style={[styles.cardAmount, { color: color }]}>₹{amount}</Text>
        {sub && <Text style={styles.cardSub}>{sub}</Text>}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Financial Overview</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.totalBox}>
          <Text style={styles.totalLabel}>TOTAL PAYOUT</Text>
          <Text style={styles.totalAmount}>₹{data?.total || '0'}</Text>
          <Text style={styles.totalSub}>Net earnings after platform fees</Text>
        </View>

        <View style={styles.grid}>
          <StatCard 
            title="Pending Payout" 
            amount={data?.pending || '0'} 
            icon="time-outline" 
            color="#f59e0b"
            sub="Currently in process"
          />
          <StatCard 
            title="Gross Revenue" 
            amount={data?.gross || '0'} 
            icon="trending-up-outline" 
            color="#10b981"
            sub="Total value of rentals"
          />
          <StatCard 
            title="Platform Fee" 
            amount={data?.commission || '0'} 
            icon="cut-outline" 
            color="#ef4444"
            sub="15% standard commission"
          />
        </View>

        <TouchableOpacity style={styles.payoutBtn}>
          <Text style={styles.payoutBtnText}>REQUEST WITHDRAWAL</Text>
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
  totalBox: {
    backgroundColor: '#2874f0', padding: 30, borderRadius: 20, alignItems: 'center', marginBottom: 25,
    shadowColor: '#2874f0', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 15, elevation: 10
  },
  totalLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 13, fontWeight: 'bold', letterSpacing: 1 },
  totalAmount: { color: '#fff', fontSize: 36, fontWeight: 'bold', marginVertical: 10 },
  totalSub: { color: 'rgba(255,255,255,0.7)', fontSize: 12 },
  grid: { gap: 15 },
  card: {
    flexDirection: 'row', backgroundColor: '#fff', padding: 18, borderRadius: 16, alignItems: 'center',
    borderWidth: 1, borderColor: '#f1f5f9'
  },
  iconBox: { width: 48, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  cardInfo: { marginLeft: 15, flex: 1 },
  cardTitle: { fontSize: 13, fontWeight: 'bold', color: '#64748b', marginBottom: 4 },
  cardAmount: { fontSize: 20, fontWeight: 'bold' },
  cardSub: { fontSize: 11, color: '#94a3b8', marginTop: 2 },
  payoutBtn: {
    marginTop: 30, backgroundColor: '#1e293b', padding: 18, borderRadius: 12, alignItems: 'center'
  },
  payoutBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 15, letterSpacing: 1 }
});
