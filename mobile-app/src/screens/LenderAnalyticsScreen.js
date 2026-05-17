import React, { useState, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../context/AuthContext';
import api from '../api/api';

export default function LenderAnalyticsScreen({ navigation }) {
  const { token } = useContext(AuthContext);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await api.get('/lender/dashboard/stats', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setData(res.data.stats);
      }
    } catch (err) {
      console.error('Failed to fetch stats:', err);
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

  const MetricCard = ({ label, value, icon, color, progress }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={[styles.iconBox, { backgroundColor: color + '15' }]}>
          <Ionicons name={icon} size={20} color={color} />
        </View>
        <Text style={styles.cardValue}>{value}</Text>
      </View>
      <Text style={styles.cardLabel}>{label}</Text>
      {progress !== undefined && (
        <View style={styles.progressTrack}>
           <View style={[styles.progressBar, { width: `${progress}%`, backgroundColor: color }]} />
        </View>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Business Analytics</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.row}>
          <MetricCard 
            label="Total Listings" 
            value={data?.totalProducts || '0'} 
            icon="cube-outline" 
            color="#2874f0" 
          />
          <MetricCard 
            label="Available Now" 
            value={data?.availableProducts || '0'} 
            icon="checkmark-circle-outline" 
            color="#10b981" 
          />
        </View>

        <View style={styles.usageCard}>
          <Text style={styles.usageTitle}>Inventory Utilization</Text>
          <Text style={styles.usagePercent}>{data?.utilizationRate || '0'}%</Text>
          <View style={styles.usageTrack}>
             <View style={[styles.usageBar, { width: `${data?.utilizationRate || 0}%` }]} />
          </View>
          <View style={styles.usageDetails}>
            <View style={styles.uItem}>
              <View style={[styles.dot, { backgroundColor: '#2874f0' }]} />
              <Text style={styles.uText}>{data?.rentedUnits || '0'} Rented</Text>
            </View>
            <View style={styles.uItem}>
              <View style={[styles.dot, { backgroundColor: '#ef4444' }]} />
              <Text style={styles.uText}>{data?.maintenanceUnits || '0'} In Maintenance</Text>
            </View>
          </View>
        </View>

        <View style={styles.insights}>
           <Text style={styles.sectionTitle}>Insights</Text>
           <View style={styles.insightBox}>
             <Ionicons name="bulb-outline" size={20} color="#f59e0b" />
             <Text style={styles.insightText}>
               Your utilization is up by 12% this week. Consider adding more high-demand items like Drones or Cameras.
             </Text>
           </View>
        </View>
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
  row: { flexDirection: 'row', gap: 15, marginBottom: 20 },
  card: { flex: 1, backgroundColor: '#fff', padding: 15, borderRadius: 16, borderWidth: 1, borderColor: '#f1f5f9' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  iconBox: { width: 36, height: 36, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  cardValue: { fontSize: 22, fontWeight: 'bold', color: '#1e293b' },
  cardLabel: { fontSize: 12, color: '#64748b', fontWeight: '500' },
  usageCard: { backgroundColor: '#fff', padding: 20, borderRadius: 16, marginBottom: 20, borderWidth: 1, borderColor: '#f1f5f9' },
  usageTitle: { fontSize: 14, fontWeight: 'bold', color: '#64748b', marginBottom: 5 },
  usagePercent: { fontSize: 32, fontWeight: 'bold', color: '#1e293b', marginBottom: 15 },
  usageTrack: { height: 8, backgroundColor: '#f1f5f9', borderRadius: 4, overflow: 'hidden', marginBottom: 20 },
  usageBar: { height: '100%', backgroundColor: '#2874f0' },
  usageDetails: { flexDirection: 'row', justifyContent: 'space-between' },
  uItem: { flexDirection: 'row', alignItems: 'center' },
  dot: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
  uText: { fontSize: 13, color: '#475569' },
  insights: { marginTop: 10 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#1e293b', marginBottom: 15 },
  insightBox: { 
    flexDirection: 'row', backgroundColor: '#fffbeb', padding: 15, borderRadius: 12, 
    borderWidth: 1, borderColor: '#fef3c7', alignItems: 'flex-start' 
  },
  insightText: { flex: 1, marginLeft: 12, fontSize: 14, color: '#92400e', lineHeight: 20 }
});
