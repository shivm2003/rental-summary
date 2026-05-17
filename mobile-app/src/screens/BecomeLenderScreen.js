import React, { useState, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, TextInput, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../context/AuthContext';
import * as ImagePicker from 'expo-image-picker';
import api from '../api/api';

export default function BecomeLenderScreen({ navigation }) {
  const { token, user } = useContext(AuthContext);
  const [statusInfo, setStatusInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  // Form State
  const [type, setType] = useState('individual');
  const [fullAddress, setFullAddress] = useState('');
  const [pincode, setPincode] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [digipin, setDigipin] = useState('');
  
  // Individual refs
  const [ref1Name, setRef1Name] = useState('');
  const [ref1Mobile, setRef1Mobile] = useState('');
  const [ref2Name, setRef2Name] = useState('');
  const [ref2Mobile, setRef2Mobile] = useState('');
  
  // Business fields
  const [gstin, setGstin] = useState('');
  const [tradeName, setTradeName] = useState('');
  const [legalOwnerName, setLegalOwnerName] = useState('');
  const [businessAddress, setBusinessAddress] = useState('');
  const [refName, setRefName] = useState('');
  const [refMobile, setRefMobile] = useState('');

  // Files
  const [firstIdProof, setFirstIdProof] = useState(null);
  const [secondIdProof, setSecondIdProof] = useState(null);
  const [shopPhoto, setShopPhoto] = useState(null);
  const [gstCertificate, setGstCertificate] = useState(null);

  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchLenderStatus();
  }, []);

  // Fetch City/State from Pincode
  useEffect(() => {
    if (pincode.length === 6) {
      api.get(`/pincode/${pincode}`)
        .then(res => {
          const details = res.data.pincode || res.data;
          setCity(details.city || '');
          setState(details.state || '');
        })
        .catch(() => {
          setCity('');
          setState('');
        });
    } else {
      setCity('');
      setState('');
    }
  }, [pincode]);

  const fetchLenderStatus = async () => {
    try {
      const res = await api.get('/lender/status', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStatusInfo(res.data);
    } catch (err) {
      console.error('Failed to fetch lender status:', err);
    } finally {
      setLoading(false);
    }
  };

  const pickImage = async (setter) => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setter(result.assets[0]);
    }
  };

  const handleSubmit = async () => {
    if (!fullAddress || !pincode || !city || !state) {
      Alert.alert('Missing Fields', 'Please fill all common required fields.');
      return;
    }

    if (type === 'individual') {
      if (!ref1Name || !ref1Mobile || !ref2Name || !ref2Mobile || !firstIdProof || !secondIdProof) {
        Alert.alert('Missing Fields', 'Please fill all required individual fields and upload ID proofs.');
        return;
      }
    } else {
      if (!gstin || !tradeName || !legalOwnerName || !businessAddress || !refName || !refMobile || !shopPhoto || !gstCertificate || !firstIdProof || !secondIdProof) {
        Alert.alert('Missing Fields', 'Please fill all required business fields and upload all documents.');
        return;
      }
    }

    setSubmitting(true);
    const formData = new FormData();
    formData.append('lenderType', type);
    formData.append('fullAddress', fullAddress);
    formData.append('pincode', pincode);
    formData.append('city', city);
    formData.append('state', state);
    formData.append('digipin', digipin);

    const appendFile = (key, fileObj) => {
      if (fileObj) {
        let uri = fileObj.uri;
        let fileType = uri.substring(uri.lastIndexOf('.') + 1);
        formData.append(key, {
          uri,
          name: `upload.${fileType}`,
          type: `image/${fileType}`
        });
      }
    };

    if (type === 'individual') {
      formData.append('ref1Name', ref1Name);
      formData.append('ref1Mobile', ref1Mobile);
      formData.append('ref2Name', ref2Name);
      formData.append('ref2Mobile', ref2Mobile);
      appendFile('firstIdProof', firstIdProof);
      appendFile('secondIdProof', secondIdProof);
    } else {
      formData.append('gstin', gstin);
      formData.append('tradeName', tradeName);
      formData.append('legalOwnerName', legalOwnerName);
      formData.append('businessAddress', businessAddress);
      formData.append('refName', refName);
      formData.append('refMobile', refMobile);
      appendFile('shopPhoto', shopPhoto);
      appendFile('gstCertificate', gstCertificate);
      appendFile('firstIdProof', firstIdProof);
      appendFile('secondIdProof', secondIdProof);
    }

    try {
      const res = await api.post('/lender/register', formData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        }
      });
      if (res.data.success) {
        Alert.alert('Success', 'Application submitted successfully!');
        fetchLenderStatus();
      }
    } catch (err) {
      console.error('Submit error:', err);
      Alert.alert('Error', err.response?.data?.message || 'Failed to submit application');
    } finally {
      setSubmitting(false);
    }
  };

  const FileUploader = ({ label, file, setFile }) => (
    <View style={styles.fileUploadBox}>
      <Text style={styles.inputLabel}>{label} *</Text>
      {file ? (
        <View style={styles.filePreview}>
          <Image source={{ uri: file.uri }} style={styles.previewImg} />
          <TouchableOpacity onPress={() => setFile(null)} style={styles.clearBtn}>
             <Ionicons name="close-circle" size={24} color="#ef4444" />
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity style={styles.uploadBtn} onPress={() => pickImage(setFile)}>
          <Ionicons name="cloud-upload-outline" size={24} color="#2874f0" />
          <Text style={styles.uploadBtnText}>Select File</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2874f0" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Become a Lender</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {statusInfo && statusInfo.status === 'approved' ? (
          <View style={styles.statusCard}>
            <Ionicons name="checkmark-circle" size={64} color="#10b981" />
            <Text style={styles.statusTitle}>Congratulations!</Text>
            <Text style={styles.statusDesc}>You are an approved lender. You can now start listing your products.</Text>
            <TouchableOpacity style={styles.primaryBtn} onPress={() => navigation.navigate('ListProduct')}>
              <Text style={styles.primaryBtnText}>Start Listing</Text>
            </TouchableOpacity>
          </View>
        ) : statusInfo && statusInfo.status === 'pending' ? (
          <View style={styles.statusCard}>
            <Ionicons name="time-outline" size={64} color="#f59e0b" />
            <Text style={styles.statusTitle}>Application Under Review</Text>
            <Text style={styles.statusDesc}>Your application to become a lender is currently pending admin approval. We will notify you once it's approved.</Text>
          </View>
        ) : (
          <View style={styles.formContainer}>
            <View style={styles.typeToggle}>
              <TouchableOpacity style={[styles.toggleBtn, type === 'individual' && styles.toggleActive]} onPress={() => setType('individual')}>
                <Text style={[styles.toggleText, type === 'individual' && styles.toggleTextActive]}>Individual</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.toggleBtn, type === 'business' && styles.toggleActive]} onPress={() => setType('business')}>
                <Text style={[styles.toggleText, type === 'business' && styles.toggleTextActive]}>Business Owner</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.sectionTitle}>Basic Info</Text>
            <Text style={styles.inputLabel}>Full Address *</Text>
            <TextInput style={[styles.input, {height: 80, textAlignVertical: 'top'}]} multiline placeholder="Full Address" value={fullAddress} onChangeText={setFullAddress} />

            <View style={styles.row}>
              <View style={{flex: 1, marginRight: 10}}>
                <Text style={styles.inputLabel}>Pincode *</Text>
                <TextInput style={styles.input} placeholder="6 Digits" keyboardType="numeric" maxLength={6} value={pincode} onChangeText={setPincode} />
              </View>
              <View style={{flex: 1}}>
                <Text style={styles.inputLabel}>DigiPin (Optional)</Text>
                <TextInput style={styles.input} placeholder="DigiPin" value={digipin} onChangeText={setDigipin} />
              </View>
            </View>

            <View style={styles.row}>
              <View style={{flex: 1, marginRight: 10}}>
                <Text style={styles.inputLabel}>City *</Text>
                <TextInput style={[styles.input, {backgroundColor: '#f1f5f9'}]} editable={false} value={city} />
              </View>
              <View style={{flex: 1}}>
                <Text style={styles.inputLabel}>State *</Text>
                <TextInput style={[styles.input, {backgroundColor: '#f1f5f9'}]} editable={false} value={state} />
              </View>
            </View>

            {type === 'individual' && (
              <>
                <Text style={styles.sectionTitle}>References</Text>
                <Text style={styles.inputLabel}>Ref 1 Name *</Text>
                <TextInput style={styles.input} placeholder="Name" value={ref1Name} onChangeText={setRef1Name} />
                <Text style={styles.inputLabel}>Ref 1 Mobile *</Text>
                <TextInput style={styles.input} placeholder="10 Digits" keyboardType="numeric" maxLength={10} value={ref1Mobile} onChangeText={setRef1Mobile} />
                
                <Text style={styles.inputLabel}>Ref 2 Name *</Text>
                <TextInput style={styles.input} placeholder="Name" value={ref2Name} onChangeText={setRef2Name} />
                <Text style={styles.inputLabel}>Ref 2 Mobile *</Text>
                <TextInput style={styles.input} placeholder="10 Digits" keyboardType="numeric" maxLength={10} value={ref2Mobile} onChangeText={setRef2Mobile} />

                <Text style={styles.sectionTitle}>KYC Documents</Text>
                <FileUploader label="First ID Proof" file={firstIdProof} setFile={setFirstIdProof} />
                <FileUploader label="Second ID Proof" file={secondIdProof} setFile={setSecondIdProof} />
              </>
            )}

            {type === 'business' && (
              <>
                <Text style={styles.sectionTitle}>Business Info</Text>
                <Text style={styles.inputLabel}>GSTIN *</Text>
                <TextInput style={styles.input} placeholder="GST Number" autoCapitalize="characters" maxLength={15} value={gstin} onChangeText={setGstin} />
                
                <Text style={styles.inputLabel}>Trade Name *</Text>
                <TextInput style={styles.input} placeholder="Shop/Trade Name" value={tradeName} onChangeText={setTradeName} />
                
                <Text style={styles.inputLabel}>Legal Owner Name *</Text>
                <TextInput style={styles.input} placeholder="Owner Name" value={legalOwnerName} onChangeText={setLegalOwnerName} />
                
                <Text style={styles.inputLabel}>Business Address *</Text>
                <TextInput style={[styles.input, {height: 80, textAlignVertical: 'top'}]} multiline placeholder="Business Address" value={businessAddress} onChangeText={setBusinessAddress} />

                <Text style={styles.sectionTitle}>Reference</Text>
                <Text style={styles.inputLabel}>Ref Name *</Text>
                <TextInput style={styles.input} placeholder="Name" value={refName} onChangeText={setRefName} />
                <Text style={styles.inputLabel}>Ref Mobile *</Text>
                <TextInput style={styles.input} placeholder="10 Digits" keyboardType="numeric" maxLength={10} value={refMobile} onChangeText={setRefMobile} />

                <Text style={styles.sectionTitle}>Documents</Text>
                <FileUploader label="Shop Photo" file={shopPhoto} setFile={setShopPhoto} />
                <FileUploader label="GST Certificate" file={gstCertificate} setFile={setGstCertificate} />
                <FileUploader label="First ID Proof" file={firstIdProof} setFile={setFirstIdProof} />
                <FileUploader label="Second ID Proof" file={secondIdProof} setFile={setSecondIdProof} />
              </>
            )}

            <TouchableOpacity style={styles.primaryBtn} onPress={handleSubmit} disabled={submitting}>
              {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryBtnText}>Submit Application</Text>}
            </TouchableOpacity>
            <View style={{height: 40}}/>
          </View>
        )}
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
  content: { padding: 20 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  statusCard: {
    backgroundColor: '#fff', padding: 30, borderRadius: 12, alignItems: 'center', width: '100%',
    elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1
  },
  statusTitle: { fontSize: 20, fontWeight: 'bold', marginVertical: 15, color: '#1a1a1a' },
  statusDesc: { fontSize: 14, color: '#64748b', textAlign: 'center', lineHeight: 22, marginBottom: 25 },
  primaryBtn: {
    width: '100%', backgroundColor: '#2874f0', padding: 15, borderRadius: 8, alignItems: 'center', marginTop: 10
  },
  primaryBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  formContainer: { width: '100%' },
  typeToggle: { flexDirection: 'row', backgroundColor: '#e2e8f0', borderRadius: 8, padding: 4, marginBottom: 20 },
  toggleBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 6 },
  toggleActive: { backgroundColor: '#fff', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 3, elevation: 2 },
  toggleText: { fontWeight: 'bold', color: '#64748b' },
  toggleTextActive: { color: '#2874f0' },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginTop: 15, marginBottom: 15, color: '#1e293b', borderBottomWidth: 1, borderBottomColor: '#e2e8f0', paddingBottom: 5 },
  inputLabel: { fontSize: 13, color: '#475569', marginBottom: 5, fontWeight: '500' },
  input: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 8, padding: 12, fontSize: 14, marginBottom: 15 },
  row: { flexDirection: 'row', width: '100%' },
  fileUploadBox: { marginBottom: 15 },
  uploadBtn: { backgroundColor: '#f1f5f9', borderWidth: 1, borderStyle: 'dashed', borderColor: '#cbd5e1', borderRadius: 8, padding: 20, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 10 },
  uploadBtnText: { color: '#2874f0', fontWeight: 'bold' },
  filePreview: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 10, borderRadius: 8, borderWidth: 1, borderColor: '#cbd5e1' },
  previewImg: { width: 50, height: 50, borderRadius: 4 },
  clearBtn: { marginLeft: 'auto', padding: 5 }
});
