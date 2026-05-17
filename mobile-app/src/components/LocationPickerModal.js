import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, FlatList, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocationContext } from '../context/LocationContext';

export default function LocationPickerModal() {
  const { city, showPicker, setShowPicker, setManualCity, requestLocation, clearLocation, cities, loading } = useLocationContext();
  const [search, setSearch] = useState('');

  const filtered = search ? cities.filter(c => c.toLowerCase().includes(search.toLowerCase())) : cities;

  return (
    <Modal visible={showPicker} animationType="slide" transparent>
      <View style={styles.bg}>
        <View style={styles.sheet}>
          <View style={styles.handle} />

          <View style={styles.header}>
            <Text style={styles.title}>Choose Your City</Text>
            <TouchableOpacity onPress={() => setShowPicker(false)}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.gpsBtn} onPress={() => { requestLocation(false); setShowPicker(false); }}>
            <Ionicons name="navigate" size={18} color="#2874f0" />
            <Text style={styles.gpsTxt}>{loading ? 'Detecting...' : 'Use Current Location (GPS)'}</Text>
          </TouchableOpacity>

          <TextInput 
            style={styles.searchInput}
            placeholder="Search city..."
            value={search}
            onChangeText={setSearch}
          />

          {city ? (
            <View style={styles.currentBox}>
              <Text style={styles.currentTxt}>📍 Current: <Text style={{ fontWeight: 'bold' }}>{city}</Text></Text>
              <TouchableOpacity onPress={() => { clearLocation(); setShowPicker(false); }}>
                <Text style={styles.clearTxt}>Clear</Text>
              </TouchableOpacity>
            </View>
          ) : null}

          <FlatList
            data={filtered}
            keyExtractor={(item) => item}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.cityItem} onPress={() => setManualCity(item)}>
                <Ionicons name="location-outline" size={16} color="#64748b" />
                <Text style={styles.cityTxt}>{item}</Text>
                {city === item && <Ionicons name="checkmark-circle" size={18} color="#10b981" />}
              </TouchableOpacity>
            )}
            style={styles.list}
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '80%', paddingBottom: 30 },
  handle: { width: 40, height: 4, backgroundColor: '#e2e8f0', borderRadius: 2, alignSelf: 'center', marginTop: 12 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingBottom: 10 },
  title: { fontSize: 18, fontWeight: 'bold', color: '#1e293b' },
  gpsBtn: { flexDirection: 'row', alignItems: 'center', gap: 10, marginHorizontal: 20, padding: 14, backgroundColor: '#eff6ff', borderRadius: 10, marginBottom: 10 },
  gpsTxt: { fontSize: 14, color: '#2874f0', fontWeight: '600' },
  searchInput: { marginHorizontal: 20, borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 10, padding: 12, fontSize: 14, marginBottom: 10 },
  currentBox: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginHorizontal: 20, padding: 10, backgroundColor: '#f0fdf4', borderRadius: 8, marginBottom: 10 },
  currentTxt: { fontSize: 13, color: '#1e293b' },
  clearTxt: { color: '#ef4444', fontWeight: 'bold', fontSize: 12 },
  list: { paddingHorizontal: 20 },
  cityItem: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#f8fafc' },
  cityTxt: { fontSize: 15, color: '#1e293b', flex: 1 }
});
