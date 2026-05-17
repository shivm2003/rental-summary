import React, { useState, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Alert, ActivityIndicator, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../context/AuthContext';
import api from '../api/api';

export default function LenderCouponsScreen({ navigation }) {
  const { token } = useContext(AuthContext);
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    code: '', discount_type: 'percentage', discount_value: '',
    min_order_amount: '', max_discount: '', usage_limit: '100', expires_at: ''
  });

  useEffect(() => { fetchCoupons(); }, []);

  const fetchCoupons = async () => {
    try {
      const res = await api.get('/admin/coupons/my', { headers: { Authorization: `Bearer ${token}` } });
      setCoupons(res.data.coupons || []);
    } catch {} finally { setLoading(false); }
  };

  const handleCreate = async () => {
    if (!form.code || !form.discount_value) { Alert.alert('Error', 'Code and discount are required'); return; }
    try {
      await api.post('/admin/coupons', {
        ...form,
        discount_value: parseFloat(form.discount_value),
        min_order_amount: parseFloat(form.min_order_amount) || 0,
        max_discount: form.max_discount ? parseFloat(form.max_discount) : null,
        usage_limit: parseInt(form.usage_limit) || 100,
        expires_at: form.expires_at || null
      }, { headers: { Authorization: `Bearer ${token}` } });
      Alert.alert('Success', 'Coupon created!');
      setShowForm(false);
      setForm({ code: '', discount_type: 'percentage', discount_value: '', min_order_amount: '', max_discount: '', usage_limit: '100', expires_at: '' });
      fetchCoupons();
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Failed');
    }
  };

  const toggleCoupon = async (id) => {
    try {
      await api.patch(`/admin/coupons/${id}/toggle`, {}, { headers: { Authorization: `Bearer ${token}` } });
      fetchCoupons();
    } catch { Alert.alert('Error', 'Failed to toggle'); }
  };

  const renderItem = ({ item }) => (
    <View style={styles.couponCard}>
      <View style={styles.couponTop}>
        <Text style={styles.couponCode}>{item.code}</Text>
        <View style={[styles.statusBadge, { backgroundColor: item.active ? '#dcfce7' : '#fee2e2' }]}>
          <Text style={[styles.statusTxt, { color: item.active ? '#166534' : '#991b1b' }]}>
            {item.active ? 'Active' : 'Inactive'}
          </Text>
        </View>
      </View>
      <View style={styles.couponDetails}>
        <Text style={styles.couponDiscount}>
          {item.discount_type === 'percentage' ? `${item.discount_value}% OFF` : `₹${item.discount_value} OFF`}
          {item.max_discount ? ` (max ₹${item.max_discount})` : ''}
        </Text>
        <Text style={styles.couponMeta}>Min order: ₹{item.min_order_amount || 0} • Used: {item.used_count}/{item.usage_limit}</Text>
      </View>
      <TouchableOpacity style={styles.toggleBtn} onPress={() => toggleCoupon(item.id)}>
        <Ionicons name={item.active ? 'toggle' : 'toggle-outline'} size={32} color={item.active ? '#16a34a' : '#94a3b8'} />
      </TouchableOpacity>
    </View>
  );

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#2874f0" /></View>;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Coupons</Text>
        <TouchableOpacity onPress={() => setShowForm(true)} style={styles.createBtn}>
          <Ionicons name="add" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={coupons}
        keyExtractor={item => String(item.id)}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="pricetag-outline" size={48} color="#cbd5e1" />
            <Text style={styles.emptyTxt}>No coupons created yet</Text>
            <TouchableOpacity style={styles.emptyBtn} onPress={() => setShowForm(true)}>
              <Text style={styles.emptyBtnTxt}>Create Your First Coupon</Text>
            </TouchableOpacity>
          </View>
        }
      />

      <Modal visible={showForm} animationType="slide" transparent>
        <View style={styles.modalBg}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>New Coupon</Text>
              <TouchableOpacity onPress={() => setShowForm(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            <TextInput style={styles.input} placeholder="Coupon Code (e.g. RENT20)" autoCapitalize="characters" value={form.code} onChangeText={t => setForm({...form, code: t.toUpperCase()})} />
            <View style={styles.typeRow}>
              {['percentage', 'flat'].map(t => (
                <TouchableOpacity key={t} style={[styles.typeBtn, form.discount_type === t && styles.typeActive]} onPress={() => setForm({...form, discount_type: t})}>
                  <Text style={[styles.typeTxt, form.discount_type === t && styles.typeTxtActive]}>{t === 'percentage' ? '% Percent' : '₹ Flat'}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TextInput style={styles.input} placeholder="Discount Value" keyboardType="numeric" value={form.discount_value} onChangeText={t => setForm({...form, discount_value: t})} />
            <TextInput style={styles.input} placeholder="Min Order Amount (₹)" keyboardType="numeric" value={form.min_order_amount} onChangeText={t => setForm({...form, min_order_amount: t})} />
            <TextInput style={styles.input} placeholder="Max Discount (₹) - optional" keyboardType="numeric" value={form.max_discount} onChangeText={t => setForm({...form, max_discount: t})} />
            <TextInput style={styles.input} placeholder="Usage Limit" keyboardType="numeric" value={form.usage_limit} onChangeText={t => setForm({...form, usage_limit: t})} />
            <TouchableOpacity style={styles.submitBtn} onPress={handleCreate}>
              <Text style={styles.submitTxt}>CREATE COUPON</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: { paddingTop: 50, paddingBottom: 15, paddingHorizontal: 20, backgroundColor: '#fff', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  headerTitle: { fontSize: 18, fontWeight: 'bold' },
  createBtn: { backgroundColor: '#2874f0', width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { padding: 15 },
  couponCard: { backgroundColor: '#fff', padding: 18, borderRadius: 12, marginBottom: 12, borderWidth: 1, borderColor: '#f1f5f9', flexDirection: 'row', alignItems: 'center' },
  couponTop: { flex: 1 },
  couponCode: { fontSize: 18, fontWeight: 'bold', color: '#0f172a', fontFamily: 'monospace' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10, alignSelf: 'flex-start', marginTop: 6 },
  statusTxt: { fontSize: 11, fontWeight: 'bold' },
  couponDetails: { flex: 1 },
  couponDiscount: { fontSize: 14, fontWeight: 'bold', color: '#2874f0' },
  couponMeta: { fontSize: 11, color: '#64748b', marginTop: 4 },
  toggleBtn: { padding: 5 },
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyTxt: { fontSize: 15, color: '#94a3b8', marginTop: 12 },
  emptyBtn: { marginTop: 15, backgroundColor: '#2874f0', paddingHorizontal: 25, paddingVertical: 12, borderRadius: 8 },
  emptyBtnTxt: { color: '#fff', fontWeight: 'bold' },
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 25 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 18, fontWeight: 'bold' },
  input: { borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 10, padding: 12, fontSize: 14, marginBottom: 12 },
  typeRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  typeBtn: { flex: 1, padding: 10, borderRadius: 8, borderWidth: 1, borderColor: '#e2e8f0', alignItems: 'center' },
  typeActive: { backgroundColor: '#2874f0', borderColor: '#2874f0' },
  typeTxt: { fontSize: 13, color: '#64748b' },
  typeTxtActive: { color: '#fff', fontWeight: 'bold' },
  submitBtn: { backgroundColor: '#10b981', padding: 16, borderRadius: 10, alignItems: 'center', marginTop: 5 },
  submitTxt: { color: '#fff', fontWeight: 'bold', fontSize: 15, letterSpacing: 1 }
});
