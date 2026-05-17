import React, { useState, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Image, ActivityIndicator, Alert, Switch, KeyboardAvoidingView, Platform, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../context/AuthContext';
import api from '../api/api';
import * as ImagePicker from 'expo-image-picker';

const Dropdown = ({ label, items, selectedValue, onValueChange }) => {
  const [visible, setVisible] = useState(false);
  const selectedItem = items.find(i => i.id.toString() === selectedValue);
  
  return (
    <>
      <TouchableOpacity style={styles.input} onPress={() => setVisible(true)}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={{ color: selectedValue ? '#334155' : '#94a3b8', fontSize: 15 }}>
            {selectedItem ? selectedItem.name : `Select ${label}`}
          </Text>
          <Ionicons name="chevron-down" size={20} color="#64748b" />
        </View>
      </TouchableOpacity>
      
      <Modal visible={visible} transparent animationType="slide" onRequestClose={() => setVisible(false)}>
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={styles.modalCloseArea} activeOpacity={1} onPress={() => setVisible(false)} />
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select {label}</Text>
              <TouchableOpacity onPress={() => setVisible(false)}>
                <Ionicons name="close-circle-outline" size={28} color="#64748b" />
              </TouchableOpacity>
            </View>
            <ScrollView>
              {items.map(item => (
                <TouchableOpacity 
                  key={item.id} 
                  style={styles.modalItem}
                  onPress={() => {
                    onValueChange(item.id.toString());
                    setVisible(false);
                  }}
                >
                  <Text style={[styles.modalItemText, selectedValue === item.id.toString() && styles.modalItemTextActive]}>
                    {item.name}
                  </Text>
                  {selectedValue === item.id.toString() && <Ionicons name="checkmark-circle" size={20} color="#2874f0" />}
                </TouchableOpacity>
              ))}
              {items.length === 0 && (
                <Text style={{ textAlign: 'center', marginTop: 20, color: '#64748b' }}>No items available</Text>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
};

export default function ListProductScreen({ navigation }) {
  const { user } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  
  const [form, setForm] = useState({
    itemName: '',
    category: '',
    subcategory: '',
    description: '',
    location: '',
    condition: '',
    purchaseMonth: '',
    purchaseYear: '',
    originalPurchasePrice: '',
    minRentalDays: '1',
    maxRentalDays: '',
    advanceBookingDays: '1',
    deliveryHandlerType: 'you',
    deliveryOption: 'pickup',
    deliveryRadius: '',
    pincode: '',
    city: '',
    state: '',
    country: 'India',
    idVerificationRequired: false,
    insuranceAvailable: false,
    rentalPricePerDay: '',
    priceUnit: 'day',
    securityDeposit: '',
    termsAndConditions: '',
    promoCode: '',
    displayTagline: ''
  });

  const [photos, setPhotos] = useState([]);

  const [subcategories, setSubcategories] = useState([]);

  useEffect(() => {
    fetchCats();
  }, []);

  const fetchCats = async () => {
    try {
      const res = await api.get('/categories/homepage');
      if (res.data && res.data.categories) {
        setCategories(res.data.categories);
      }
    } catch (e) {
      console.log('Error fetching categories');
    }
  };

  useEffect(() => {
    if (!form.category) {
      setSubcategories([]);
      setForm(prev => ({ ...prev, subcategory: '' }));
      return;
    }
    fetchSubcats();
  }, [form.category]);

  const fetchSubcats = async () => {
    try {
      const res = await api.get(`/categories/${form.category}/subcategories`);
      if (res.data && res.data.success) {
        setSubcategories(res.data.subcategories || []);
      }
    } catch (e) {
      setSubcategories([]);
    }
  };

  useEffect(() => {
    if (form.pincode.length === 6 && /^\d{6}$/.test(form.pincode)) {
      lookupPincode();
    }
  }, [form.pincode]);

  const lookupPincode = async () => {
    try {
      const res = await api.get(`/pincode/${form.pincode}`);
      if (res.data && res.data.success && res.data.pincode) {
        setForm(prev => ({
          ...prev,
          city: res.data.pincode.city || prev.city,
          state: res.data.pincode.state || prev.state,
        }));
      }
    } catch (e) {
      // silent
    }
  };

  const handleInput = (key, value) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const pickImage = async () => {
    // Basic wrapper, assumes expo-image-picker is available natively; if not installed, user will test and NPM install
    try {
      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setPhotos(prev => [...prev, result.assets[0]]);
      }
    } catch (e) {
      Alert.alert('Image Picker', 'Feature requires expo-image-picker.');
    }
  };

  const removePhoto = (index) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!form.itemName || !form.category || !form.rentalPricePerDay) {
      return Alert.alert('Validation Error', 'Please fill the required fields (Name, Category, Price)');
    }
    
    if (photos.length === 0) {
      return Alert.alert('Validation Error', 'Please add at least one photo for your item.');
    }
    
    setLoading(true);
    try {
      const formData = new FormData();
      Object.keys(form).forEach(key => {
        if (form[key] !== '' && form[key] !== null && form[key] !== undefined) {
          formData.append(key, form[key]);
        }
      });
      
      // Append images
      photos.forEach((photo, index) => {
        formData.append('photos', {
          uri: Platform.OS === 'android' ? photo.uri : photo.uri.replace('file://', ''),
          name: photo.fileName || `photo_${index}.jpg`,
          type: 'image/jpeg'
        });
      });

      const res = await api.post('/listings', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      Alert.alert('Success', 'Your item has been successfully listed!', [
        { text: 'OK', onPress: () => navigation.navigate('LenderProducts') }
      ]);
    } catch (err) {
       Alert.alert('Error', err.response?.data?.message || 'Failed to list item');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 5, marginRight: 10 }}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>List an Item</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {/* 1. Item Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Item Details</Text>
          
          <Text style={styles.label}>Item Name *</Text>
          <TextInput style={styles.input} placeholder="e.g. Mountain Bike" value={form.itemName} onChangeText={(t) => handleInput('itemName', t)} />
          
          <Text style={styles.label}>Category *</Text>
          <Dropdown 
            label="Category" 
            items={categories} 
            selectedValue={form.category} 
            onValueChange={(val) => handleInput('category', val)} 
          />

          {subcategories.length > 0 && (
            <>
              <Text style={styles.label}>Subcategory *</Text>
              <Dropdown 
                label="Subcategory" 
                items={subcategories} 
                selectedValue={form.subcategory} 
                onValueChange={(val) => handleInput('subcategory', val)} 
              />
            </>
          )}

          <Text style={styles.label}>Description</Text>
          <TextInput style={[styles.input, styles.textArea]} placeholder="Describe your item..." multiline value={form.description} onChangeText={(t) => handleInput('description', t)} />
          
          <Text style={styles.label}>Pickup Location City *</Text>
          <TextInput style={styles.input} placeholder="e.g. Gurgaon" value={form.location} onChangeText={(t) => handleInput('location', t)} />
        </View>

        {/* 2. Condition & History */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Condition & History</Text>
          <Text style={styles.label}>Condition *</Text>
          <View style={styles.conditionRow}>
            {['Excellent', 'Good', 'Fair', 'Needs Minor Repair'].map(c => (
               <TouchableOpacity 
                 key={c} 
                 style={[styles.conditionBtn, form.condition === c && styles.conditionBtnActive]}
                 onPress={() => handleInput('condition', c)}
               >
                 <Text style={[styles.conditionBtnText, form.condition === c && styles.conditionBtnTextActive]}>{c}</Text>
               </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Purchase Date (Optional)</Text>
          <View style={styles.rowInputs}>
             <TextInput style={[styles.input, {flex: 1, marginRight: 10}]} placeholder="Month (1-12)" keyboardType="numeric" value={form.purchaseMonth} onChangeText={(t) => handleInput('purchaseMonth', t)} />
             <TextInput style={[styles.input, {flex: 1}]} placeholder="Year (e.g. 2023)" keyboardType="numeric" value={form.purchaseYear} onChangeText={(t) => handleInput('purchaseYear', t)} />
          </View>

          <Text style={styles.label}>Original Purchase Price (Optional)</Text>
          <TextInput style={styles.input} placeholder="₹ What you paid" keyboardType="numeric" value={form.originalPurchasePrice} onChangeText={(t) => handleInput('originalPurchasePrice', t)} />
        </View>

        {/* 3. Photos */}
        <View style={styles.section}>
           <Text style={styles.sectionTitle}>Add Photos *</Text>
           <TouchableOpacity style={styles.photoUploadBtn} onPress={pickImage}>
             <Ionicons name="camera-outline" size={32} color="#2874f0" />
             <Text style={styles.photoUploadText}>Tap to Add Photo</Text>
           </TouchableOpacity>

           <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{marginTop: 15}}>
             {photos.map((p, index) => (
                <View key={index} style={styles.photoPreviewWrap}>
                  <Image source={{uri: p.uri}} style={styles.photoPreview} />
                  <TouchableOpacity style={styles.photoRemoveBtn} onPress={() => removePhoto(index)}>
                    <Ionicons name="close-circle" size={24} color="#ef4444" />
                  </TouchableOpacity>
                </View>
             ))}
           </ScrollView>
        </View>

        {/* 4. Pricing & Rules */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pricing & Rules</Text>
          
          <View style={styles.rowInputs}>
             <View style={{flex: 1, marginRight: 10}}>
                <Text style={styles.label}>Rent / Day *</Text>
                <TextInput style={styles.input} keyboardType="numeric" placeholder="e.g. 50" value={form.rentalPricePerDay} onChangeText={(t) => handleInput('rentalPricePerDay', t)} />
             </View>
             <View style={{flex: 1}}>
                <Text style={styles.label}>Security Deposit</Text>
                <TextInput style={styles.input} keyboardType="numeric" placeholder="e.g. 1000" value={form.securityDeposit} onChangeText={(t) => handleInput('securityDeposit', t)} />
             </View>
          </View>

          <Text style={styles.label}>Minimum Rental Days</Text>
          <TextInput style={styles.input} keyboardType="numeric" placeholder="1" value={form.minRentalDays} onChangeText={(t) => handleInput('minRentalDays', t)} />

          <Text style={styles.label}>Advance Booking Notice (Days)</Text>
          <TextInput style={styles.input} keyboardType="numeric" placeholder="1" value={form.advanceBookingDays} onChangeText={(t) => handleInput('advanceBookingDays', t)} />
        </View>

        {/* 5. Delivery & Coverage */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Delivery & Coverage</Text>
          
          {/* <Text style={styles.label}>Who handles delivery?</Text>
          <View style={styles.conditionRow}>
            {['you', 'lender'].map(c => (
               <TouchableOpacity 
                 key={c} 
                 style={[styles.conditionBtn, form.deliveryHandlerType === c && styles.conditionBtnActive]}
                 onPress={() => handleInput('deliveryHandlerType', c)}
               >
                 <Text style={[styles.conditionBtnText, form.deliveryHandlerType === c && styles.conditionBtnTextActive]}>{c === 'you' ? 'You' : 'Lender'}</Text>
               </TouchableOpacity>
            ))}
          </View> */}

          {form.deliveryHandlerType === 'you' && (
            <>
              <Text style={styles.label}>Delivery Option</Text>
              <View style={styles.conditionRow}>
                {['pickup'/*, 'delivery', 'both'*/].map(o => (
                   <TouchableOpacity 
                     key={o} 
                     style={[styles.conditionBtn, form.deliveryOption === o && styles.conditionBtnActive]}
                     onPress={() => handleInput('deliveryOption', o)}
                   >
                     <Text style={[styles.conditionBtnText, form.deliveryOption === o && styles.conditionBtnTextActive]}>{o.toUpperCase()}</Text>
                   </TouchableOpacity>
                ))}
              </View>

              {(form.deliveryOption === 'delivery' || form.deliveryOption === 'both') && (
                <>
                  <Text style={styles.label}>Delivery Radius (km)</Text>
                  <TextInput style={styles.input} keyboardType="numeric" placeholder="10" value={form.deliveryRadius} onChangeText={(t) => handleInput('deliveryRadius', t)} />
                </>
              )}
            </>
          )}

          <Text style={styles.label}>Pincode *</Text>
          <TextInput style={styles.input} keyboardType="numeric" maxLength={6} placeholder="e.g. 110001" value={form.pincode} onChangeText={(t) => handleInput('pincode', t)} />
          
          <View style={styles.rowInputs}>
             <View style={{flex: 1, marginRight: 10}}>
                <Text style={styles.label}>City *</Text>
                <TextInput style={styles.input} placeholder="Delhi" value={form.city} onChangeText={(t) => handleInput('city', t)} />
             </View>
             <View style={{flex: 1}}>
                <Text style={styles.label}>State *</Text>
                <TextInput style={styles.input} placeholder="Delhi" value={form.state} onChangeText={(t) => handleInput('state', t)} />
             </View>
          </View>
        </View>

        {/* 6. Safety & Extras */}
        <View style={styles.section}>
           <Text style={styles.sectionTitle}>Safety & Extras</Text>
           
           <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 15}}>
              <Text style={styles.label}>ID Verification Required</Text>
              <Switch value={form.idVerificationRequired} onValueChange={(v) => handleInput('idVerificationRequired', v)} />
           </View>

           <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 15}}>
              <Text style={styles.label}>Insurance Available</Text>
              <Switch value={form.insuranceAvailable} onValueChange={(v) => handleInput('insuranceAvailable', v)} />
           </View>

           <Text style={styles.label}>Display Tagline (Optional)</Text>
           <TextInput style={styles.input} placeholder="Perfect for weekend trips!" value={form.displayTagline} onChangeText={(t) => handleInput('displayTagline', t)} />

           <Text style={styles.label}>Promo Code (Optional)</Text>
           <TextInput style={styles.input} placeholder="SUMMER20" value={form.promoCode} onChangeText={(t) => handleInput('promoCode', t)} />

           <Text style={styles.label}>Terms & Conditions</Text>
           <TextInput style={[styles.input, styles.textArea]} placeholder="Specify any additional terms..." multiline value={form.termsAndConditions} onChangeText={(t) => handleInput('termsAndConditions', t)} />
        </View>

        <TouchableOpacity style={[styles.submitBtn, loading && {opacity: 0.7}]} onPress={handleSubmit} disabled={loading}>
           {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitBtnText}>List Item Now</Text>}
        </TouchableOpacity>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fdfdfd' },
  header: {
    backgroundColor: '#fff', paddingHorizontal: 15, paddingTop: 45, paddingBottom: 15,
    flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#f0f0f0'
  },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#212121' },
  scrollContent: { padding: 20, paddingBottom: 50 },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 16, fontWeight: 'bold', color: '#212121', marginBottom: 15, borderBottomWidth: 1, borderBottomColor: '#f1f3f6', paddingBottom: 8
  },
  label: {
    fontSize: 13, fontWeight: '600', color: '#475569', marginBottom: 8, marginTop: 10
  },
  input: {
    backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 8, padding: 12, fontSize: 15, color: '#334155'
  },
  textArea: {
    height: 100, textAlignVertical: 'top'
  },
  rowInputs: {
    flexDirection: 'row', justifyContent: 'space-between'
  },
  chipScroll: {
    flexDirection: 'row',
  },
  chip: {
    backgroundColor: '#f1f5f9', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, marginRight: 10, borderWidth: 1, borderColor: 'transparent'
  },
  chipActive: {
    backgroundColor: 'rgba(40, 116, 240, 0.1)', borderColor: '#2874f0'
  },
  chipText: {
    fontSize: 13, color: '#475569', fontWeight: '500'
  },
  chipTextActive: {
    color: '#2874f0', fontWeight: 'bold'
  },
  conditionRow: {
    flexDirection: 'row', gap: 10
  },
  conditionBtn: {
    flex: 1, paddingVertical: 10, borderBottomWidth: 2, borderBottomColor: '#e2e8f0', alignItems: 'center'
  },
  conditionBtnActive: {
    borderBottomColor: '#2874f0'
  },
  conditionBtnText: {
    fontSize: 13, color: '#64748b', fontWeight: '500'
  },
  conditionBtnTextActive: {
    color: '#2874f0', fontWeight: 'bold'
  },
  photoUploadBtn: {
    backgroundColor: '#f8fafc', borderWidth: 2, borderStyle: 'dashed', borderColor: '#cbd5e1', borderRadius: 12, padding: 30, alignItems: 'center', justifyContent: 'center'
  },
  photoUploadText: {
    marginTop: 10, fontSize: 14, color: '#64748b', fontWeight: '500'
  },
  photoPreviewWrap: {
    position: 'relative', marginRight: 15
  },
  photoPreview: {
    width: 80, height: 80, borderRadius: 8
  },
  photoRemoveBtn: {
    position: 'absolute', top: -10, right: -10, backgroundColor: '#fff', borderRadius: 12
  },
  submitBtn: {
    backgroundColor: '#2874f0', padding: 16, borderRadius: 8, alignItems: 'center', marginTop: 10
  },
  submitBtnText: {
    color: '#fff', fontSize: 16, fontWeight: 'bold'
  },
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end'
  },
  modalCloseArea: {
    flex: 1
  },
  modalContent: {
    backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: '60%'
  },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15, borderBottomWidth: 1, borderBottomColor: '#f1f5f9', paddingBottom: 10
  },
  modalTitle: {
    fontSize: 18, fontWeight: 'bold', color: '#1e293b'
  },
  modalItem: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#f8fafc'
  },
  modalItemText: {
    fontSize: 16, color: '#334155'
  },
  modalItemTextActive: {
    color: '#2874f0', fontWeight: 'bold'
  }
});
