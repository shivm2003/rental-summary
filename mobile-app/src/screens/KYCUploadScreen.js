import React, { useState, useContext } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Image, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { AuthContext } from '../context/AuthContext';
import api from '../api/api';

export default function KYCUploadScreen({ navigation }) {
  const { token } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    lenderType: 'individual',
    fullAddress: '',
    pincode: '',
    refName: '',
    refMobile: '',
    gstin: '',
    tradeName: ''
  });

  const [docs, setDocs] = useState({
    firstIdProof: null,
    secondIdProof: null,
    shopPhoto: null,
    gstCertificate: null
  });

  const pickImage = async (field) => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled) {
      setDocs({ ...docs, [field]: result.assets[0] });
    }
  };

  const handleSubmit = async () => {
    if (!form.fullAddress || !form.pincode || !form.refMobile) {
      Alert.alert('Error', 'Please fill basic details');
      return;
    }
    if (!docs.firstIdProof || !docs.secondIdProof) {
      Alert.alert('Error', 'Please upload at least two ID proofs');
      return;
    }

    setLoading(true);
    const formData = new FormData();
    Object.keys(form).forEach(key => formData.append(key, form[key]));
    
    // Append files
    if (docs.firstIdProof) {
      formData.append('firstIdProof', {
        uri: docs.firstIdProof.uri,
        name: 'id1.jpg',
        type: 'image/jpeg'
      });
    }
    if (docs.secondIdProof) {
      formData.append('secondIdProof', {
        uri: docs.secondIdProof.uri,
        name: 'id2.jpg',
        type: 'image/jpeg'
      });
    }
    if (docs.shopPhoto) {
      formData.append('shopPhoto', {
        uri: docs.shopPhoto.uri,
        name: 'shop.jpg',
        type: 'image/jpeg'
      });
    }
    if (docs.gstCertificate) {
      formData.append('gstCertificate', {
        uri: docs.gstCertificate.uri,
        name: 'gst.jpg',
        type: 'image/jpeg'
      });
    }

    try {
      const res = await api.post('/lender/register', formData, {
        headers: { 
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}` 
        }
      });
      if (res.data.success) {
        Alert.alert('Success', 'Application submitted! We will review it shortly.', [
          { text: 'OK', onPress: () => navigation.navigate('BecomeLender') }
        ]);
      }
    } catch (err) {
      console.error(err);
      Alert.alert('Upload Failed', err.response?.data?.message || 'Server error');
    } finally {
      setLoading(false);
    }
  };

  const RenderDocSelector = ({ label, field, value }) => (
    <View style={styles.docBox}>
      <View style={styles.docHeader}>
        <Text style={styles.docLabel}>{label}</Text>
        {value && <Ionicons name="checkmark-circle" size={20} color="#10b981" />}
      </View>
      <TouchableOpacity style={styles.uploadTrigger} onPress={() => pickImage(field)}>
        {value ? (
          <Image source={{ uri: value.uri }} style={styles.preview} />
        ) : (
          <View style={styles.uploadPlaceholder}>
            <Ionicons name="cloud-upload-outline" size={32} color="#2874f0" />
            <Text style={styles.uploadText}>Select File</Text>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="close" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>KYC Verification</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.sectionTitle}>Basic Information</Text>
        <TextInput 
          style={styles.input} 
          placeholder="Complete Address" 
          value={form.fullAddress} 
          onChangeText={t => setForm({...form, fullAddress: t})} 
        />
        <TextInput 
          style={styles.input} 
          placeholder="Pincode (6 digits)" 
          keyboardType="numeric"
          maxLength={6}
          value={form.pincode} 
          onChangeText={t => setForm({...form, pincode: t})} 
        />
        <TextInput 
          style={styles.input} 
          placeholder="Reference Name" 
          value={form.refName} 
          onChangeText={t => setForm({...form, refName: t})} 
        />
        <TextInput 
          style={styles.input} 
          placeholder="Reference Mobile (10 digits)" 
          keyboardType="numeric"
          maxLength={10}
          value={form.refMobile} 
          onChangeText={t => setForm({...form, refMobile: t})} 
        />

        <Text style={[styles.sectionTitle, { marginTop: 20 }]}>Documents</Text>
        <RenderDocSelector label="ID Proof 1 (Aadhar/PAN Front)" field="firstIdProof" value={docs.firstIdProof} />
        <RenderDocSelector label="ID Proof 2 (Aadhar/PAN Back)" field="secondIdProof" value={docs.secondIdProof} />
        <RenderDocSelector label="Shop/Business Photo (Optional)" field="shopPhoto" value={docs.shopPhoto} />
        <RenderDocSelector label="GST Certificate (Optional)" field="gstCertificate" value={docs.gstCertificate} />

        <TouchableOpacity 
          style={[styles.submitBtn, loading && styles.disabledBtn]} 
          onPress={handleSubmit} 
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitBtnText}>SUBMIT VERIFICATION</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    paddingTop: 50, paddingBottom: 15, paddingHorizontal: 20,
    backgroundColor: '#fff', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderBottomWidth: 1, borderBottomColor: '#f1f5f9'
  },
  headerTitle: { fontSize: 18, fontWeight: 'bold' },
  scroll: { padding: 20 },
  sectionTitle: { fontSize: 13, fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase', marginBottom: 15, letterSpacing: 1 },
  input: {
    borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 8, padding: 12, marginBottom: 15, fontSize: 14, color: '#1e293b'
  },
  docBox: { marginBottom: 20 },
  docHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  docLabel: { fontSize: 14, fontWeight: '600', color: '#334155' },
  uploadTrigger: {
    height: 120, borderWidth: 1, borderStyle: 'dashed', borderColor: '#cbd5e1', borderRadius: 12, overflow: 'hidden'
  },
  uploadPlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc' },
  uploadText: { marginTop: 8, fontSize: 12, color: '#64748b', fontWeight: 'bold' },
  preview: { width: '100%', height: '100%', resizeMode: 'cover' },
  submitBtn: {
    backgroundColor: '#2874f0', padding: 18, borderRadius: 12, alignItems: 'center', marginTop: 10, marginBottom: 40
  },
  disabledBtn: { opacity: 0.7 },
  submitBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 15, letterSpacing: 1 }
});
