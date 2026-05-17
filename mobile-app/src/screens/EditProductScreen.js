import React, { useState, useEffect, useContext, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Image, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { AuthContext } from '../context/AuthContext';
import api from '../api/api';

export default function EditProductScreen({ route, navigation }) {
  const { id } = route.params;
  const { token } = useContext(AuthContext);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState([]);

  const [form, setForm] = useState({
    itemName: '', description: '', location: '', condition: '',
    rentalPricePerDay: '', priceUnit: 'day', securityDeposit: '',
    category: '', minRentalDays: '1',
  });

  const [existingPhotos, setExistingPhotos] = useState([]);
  const [newPhotos, setNewPhotos] = useState([]);
  const [deleteImages, setDeleteImages] = useState([]);

  useEffect(() => {
    loadProduct();
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const res = await api.get('/categories');
      setCategories(res.data?.categories || res.data || []);
    } catch {}
  };

  const loadProduct = async () => {
    try {
      const res = await api.get(`/products/${id}`);
      const p = res.data;
      setForm({
        itemName: p.item_name || '',
        description: p.description || '',
        location: p.location || '',
        condition: p.condition || '',
        rentalPricePerDay: String(p.rental_price_per_day || ''),
        priceUnit: p.price_unit || 'day',
        securityDeposit: String(p.security_deposit || ''),
        category: String(p.category_id || ''),
        minRentalDays: String(p.min_rental_days || '1'),
      });
      setExistingPhotos(p.photos || []);
    } catch (err) {
      Alert.alert('Error', 'Failed to load product');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const pickPhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.8,
    });
    if (!result.canceled) {
      setNewPhotos(prev => [...prev, ...result.assets]);
    }
  };

  const removeExisting = (photoId) => {
    setDeleteImages(prev => [...prev, photoId]);
    setExistingPhotos(prev => prev.filter(p => p.id !== photoId));
  };

  const removeNew = (index) => {
    setNewPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!form.itemName.trim() || !form.rentalPricePerDay) {
      Alert.alert('Error', 'Item name and price are required');
      return;
    }
    setSaving(true);
    const formData = new FormData();
    formData.append('itemName', form.itemName);
    formData.append('description', form.description);
    formData.append('location', form.location);
    formData.append('condition', form.condition);
    formData.append('rentalPricePerDay', form.rentalPricePerDay);
    formData.append('priceUnit', form.priceUnit);
    formData.append('securityDeposit', form.securityDeposit);
    formData.append('category', form.category);
    formData.append('minRentalDays', form.minRentalDays);
    formData.append('deleteImages', JSON.stringify(deleteImages));

    newPhotos.forEach((photo, idx) => {
      formData.append('photos', { uri: photo.uri, name: `photo_${idx}.jpg`, type: 'image/jpeg' });
    });

    try {
      await api.put(`/products/${id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data', Authorization: `Bearer ${token}` }
      });
      Alert.alert('Success', 'Listing updated!', [{ text: 'OK', onPress: () => navigation.goBack() }]);
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to update');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#2874f0" /></View>;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="close" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Listing</Text>
        <TouchableOpacity onPress={handleSave} disabled={saving}>
          <Text style={[styles.saveBtn, saving && { opacity: 0.5 }]}>{saving ? 'Saving...' : 'Save'}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.label}>Item Name *</Text>
        <TextInput style={styles.input} value={form.itemName} onChangeText={t => setForm({...form, itemName: t})} />

        <Text style={styles.label}>Description</Text>
        <TextInput style={[styles.input, { height: 80 }]} value={form.description} onChangeText={t => setForm({...form, description: t})} multiline />

        <Text style={styles.label}>Location (City) *</Text>
        <TextInput style={styles.input} value={form.location} onChangeText={t => setForm({...form, location: t})} />

        <Text style={styles.label}>Condition</Text>
        <View style={styles.condRow}>
          {['Like New', 'Excellent', 'Good', 'Fair'].map(c => (
            <TouchableOpacity key={c} style={[styles.condBtn, form.condition === c && styles.condActive]} onPress={() => setForm({...form, condition: c})}>
              <Text style={[styles.condTxt, form.condition === c && styles.condTxtActive]}>{c}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.priceRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>Rental Price *</Text>
            <TextInput style={styles.input} value={form.rentalPricePerDay} onChangeText={t => setForm({...form, rentalPricePerDay: t})} keyboardType="numeric" />
          </View>
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={styles.label}>Security Deposit</Text>
            <TextInput style={styles.input} value={form.securityDeposit} onChangeText={t => setForm({...form, securityDeposit: t})} keyboardType="numeric" />
          </View>
        </View>

        <Text style={styles.label}>Photos</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.photoScroll}>
          {existingPhotos.map(p => (
            <View key={p.id} style={styles.photoCard}>
              <Image source={{ uri: p.fullUrl || p.full_url }} style={styles.photoImg} />
              <TouchableOpacity style={styles.photoRemove} onPress={() => removeExisting(p.id)}>
                <Ionicons name="close-circle" size={22} color="#ef4444" />
              </TouchableOpacity>
            </View>
          ))}
          {newPhotos.map((p, i) => (
            <View key={`new-${i}`} style={styles.photoCard}>
              <Image source={{ uri: p.uri }} style={styles.photoImg} />
              <TouchableOpacity style={styles.photoRemove} onPress={() => removeNew(i)}>
                <Ionicons name="close-circle" size={22} color="#ef4444" />
              </TouchableOpacity>
              <View style={styles.newBadge}><Text style={styles.newBadgeTxt}>NEW</Text></View>
            </View>
          ))}
          <TouchableOpacity style={styles.addPhotoBtn} onPress={pickPhoto}>
            <Ionicons name="add" size={28} color="#2874f0" />
            <Text style={styles.addPhotoTxt}>Add</Text>
          </TouchableOpacity>
        </ScrollView>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { paddingTop: 50, paddingBottom: 15, paddingHorizontal: 20, backgroundColor: '#fff', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  headerTitle: { fontSize: 18, fontWeight: 'bold' },
  saveBtn: { color: '#2874f0', fontWeight: 'bold', fontSize: 16 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scroll: { padding: 20, paddingBottom: 40 },
  label: { fontSize: 13, fontWeight: 'bold', color: '#64748b', marginBottom: 6, marginTop: 15 },
  input: { borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 10, padding: 12, fontSize: 14, color: '#1e293b' },
  condRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  condBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: '#e2e8f0' },
  condActive: { backgroundColor: '#2874f0', borderColor: '#2874f0' },
  condTxt: { fontSize: 13, color: '#64748b' },
  condTxtActive: { color: '#fff', fontWeight: 'bold' },
  priceRow: { flexDirection: 'row' },
  photoScroll: { marginTop: 5 },
  photoCard: { width: 90, height: 90, borderRadius: 10, marginRight: 10, overflow: 'hidden', position: 'relative' },
  photoImg: { width: '100%', height: '100%' },
  photoRemove: { position: 'absolute', top: 2, right: 2 },
  newBadge: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#2874f0', paddingVertical: 2 },
  newBadgeTxt: { color: '#fff', fontSize: 9, fontWeight: 'bold', textAlign: 'center' },
  addPhotoBtn: { width: 90, height: 90, borderRadius: 10, borderWidth: 2, borderStyle: 'dashed', borderColor: '#cbd5e1', alignItems: 'center', justifyContent: 'center' },
  addPhotoTxt: { fontSize: 11, color: '#64748b', marginTop: 4 }
});
