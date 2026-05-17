import React, { useState, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Modal, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../context/AuthContext';
import api from '../api/api';

export default function AddressBookScreen({ navigation }) {
  const { token } = useContext(AuthContext);
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [newAddress, setNewAddress] = useState({
    label: '',
    street: '',
    city: '',
    state: '',
    zip: ''
  });

  useEffect(() => {
    fetchAddresses();
  }, []);

  const fetchAddresses = async () => {
    try {
      const res = await api.get('/user/addresses', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAddresses(res.data || []);
    } catch (err) {
      console.error('Failed to fetch addresses:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddAddress = async () => {
    if (!newAddress.label || !newAddress.street || !newAddress.city) {
      Alert.alert('Error', 'Please fill in required fields (Label, Street, City)');
      return;
    }

    try {
      await api.post('/user/addresses', newAddress, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setModalVisible(false);
      setNewAddress({ label: '', street: '', city: '', state: '', zip: '' });
      fetchAddresses();
    } catch (err) {
      Alert.alert('Error', 'Failed to add address');
    }
  };

  const handleDelete = (id) => {
    Alert.alert('Delete Address', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try {
          await api.delete(`/user/addresses/${id}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          fetchAddresses();
        } catch (err) {
          Alert.alert('Error', 'Failed to delete address');
        }
      }}
    ]);
  };

  const renderItem = ({ item }) => (
    <View style={styles.addressCard}>
      <View style={styles.addressHeader}>
        <View style={styles.labelBadge}>
          <Text style={styles.labelText}>{item.label.toUpperCase()}</Text>
        </View>
        <TouchableOpacity onPress={() => handleDelete(item.id)}>
          <Ionicons name="trash-outline" size={20} color="#ef4444" />
        </TouchableOpacity>
      </View>
      <Text style={styles.streetText}>{item.street}</Text>
      <Text style={styles.cityText}>{item.city}, {item.state} {item.zip}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Address Book</Text>
        <TouchableOpacity onPress={() => setModalVisible(true)}>
          <Ionicons name="add" size={28} color="#2874f0" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#2874f0" style={{ marginTop: 50 }} />
      ) : (
        <FlatList
          data={addresses}
          keyExtractor={item => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="location-outline" size={64} color="#ccc" />
              <Text style={styles.emptyText}>No saved addresses found</Text>
            </View>
          }
        />
      )}

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add New Address</Text>
            <TextInput 
              style={styles.input} 
              placeholder="Label (e.g. Home, Office)" 
              value={newAddress.label}
              onChangeText={t => setNewAddress({...newAddress, label: t})} 
            />
            <TextInput 
              style={styles.input} 
              placeholder="Street Address" 
              value={newAddress.street}
              onChangeText={t => setNewAddress({...newAddress, street: t})} 
            />
            <TextInput 
              style={styles.input} 
              placeholder="City" 
              value={newAddress.city}
              onChangeText={t => setNewAddress({...newAddress, city: t})} 
            />
            <View style={styles.row}>
              <TextInput 
                style={[styles.input, { flex: 1, marginRight: 10 }]} 
                placeholder="State" 
                value={newAddress.state}
                onChangeText={t => setNewAddress({...newAddress, state: t})} 
              />
              <TextInput 
                style={[styles.input, { flex: 1 }]} 
                placeholder="Zip Code" 
                value={newAddress.zip}
                onChangeText={t => setNewAddress({...newAddress, zip: t})} 
              />
            </View>
            <TouchableOpacity style={styles.saveBtn} onPress={handleAddAddress}>
              <Text style={styles.saveBtnText}>Save Address</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: {
    paddingTop: 50, paddingBottom: 15, paddingHorizontal: 20,
    backgroundColor: '#fff', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'
  },
  headerTitle: { fontSize: 18, fontWeight: 'bold' },
  list: { padding: 15 },
  addressCard: {
    backgroundColor: '#fff', padding: 15, borderRadius: 10, marginBottom: 15,
    borderWidth: 1, borderColor: '#e2e8f0'
  },
  addressHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  labelBadge: { backgroundColor: 'rgba(40, 116, 240, 0.1)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  labelText: { color: '#2874f0', fontSize: 10, fontWeight: 'bold' },
  streetText: { fontSize: 16, color: '#1e293b', marginBottom: 4 },
  cityText: { fontSize: 14, color: '#64748b' },
  empty: { alignItems: 'center', marginTop: 100 },
  emptyText: { marginTop: 15, fontSize: 16, color: '#94a3b8' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', padding: 25, borderTopLeftRadius: 20, borderTopRightRadius: 20 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 20 },
  input: { borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 8, padding: 12, marginBottom: 15 },
  row: { flexDirection: 'row' },
  saveBtn: { backgroundColor: '#2874f0', padding: 15, borderRadius: 8, alignItems: 'center', marginTop: 10 },
  saveBtnText: { color: '#fff', fontWeight: 'bold' },
  cancelBtn: { padding: 15, alignItems: 'center' },
  cancelBtnText: { color: '#64748b' }
});
