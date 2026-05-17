import React, { useState, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, TextInput, Alert, Platform } from 'react-native';

import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import api from '../api/api';

export default function CheckoutScreen({ navigation }) {
  const { user, token } = useContext(AuthContext);
  const { cart, getCartTotal, clearCart } = useCart();
  
  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [showAddressForm, setShowAddressForm] = useState(false);
  
  // Coupon
  const [couponCode, setCouponCode] = useState('');
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponApplied, setCouponApplied] = useState(false);
  const [applyingCoupon, setApplyingCoupon] = useState(false);
  
  // Delivery Charge
  const [deliveryCharge, setDeliveryCharge] = useState(0);

  // Address form
  const [addressForm, setAddressForm] = useState({
    name: user?.firstName || '',
    mobile: user?.phone || '',
    pincode: '',
    state: '',
    city: '',
    locality: '',
    buildingNo: ''
  });

  const cartTotal = getCartTotal();
  const securityDeposit = cart.reduce((sum, item) => sum + (item.security_deposit || 0) * (item.quantity || 1), 0);
  const finalTotal = cartTotal + securityDeposit + deliveryCharge - couponDiscount;

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) { Alert.alert('Error', 'Please enter a coupon code'); return; }
    setApplyingCoupon(true);
    try {
      const res = await api.post('/orders/validate-coupon', { code: couponCode, orderAmount: cartTotal }, { headers: { Authorization: `Bearer ${token}` } });
      if (res.data?.success) {
        setCouponDiscount(res.data.discount || 0);
        setCouponApplied(true);
        Alert.alert('🎉 Coupon Applied!', `You saved ₹${res.data.discount}!`);
      } else {
        Alert.alert('Invalid Coupon', res.data.message || 'This coupon code is not valid.');
      }
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to validate coupon');
    } finally { setApplyingCoupon(false); }
  };

  const handleRemoveCoupon = () => {
    setCouponCode('');
    setCouponDiscount(0);
    setCouponApplied(false);
  };

  useEffect(() => {
    if (cart.length === 0) {
      navigation.goBack();
      return;
    }
    fetchAddresses();
    fetchDeliveryCharge();
  }, []);

  const fetchDeliveryCharge = async () => {
    try {
      const res = await api.get(`/admin/delivery-charges?amount=${cartTotal}`);
      if (res.data && res.data.success) {
        setDeliveryCharge(parseFloat(res.data.deliveryCharge));
      }
    } catch (e) {
      console.error('Failed to get delivery charge', e);
    }
  };

  const fetchAddresses = async () => {
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const response = await api.get('/addresses', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success && response.data.addresses) {
        setAddresses(response.data.addresses);
        if (response.data.addresses.length > 0) {
          const def = response.data.addresses.find(a => a.isDefault);
          setSelectedAddressId(def ? def.id : response.data.addresses[0].id);
        } else {
          setShowAddressForm(true);
        }
      }
    } catch (error) {
      console.error('Error fetching addresses:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAddress = async () => {
    if (!addressForm.name || !addressForm.mobile || !addressForm.pincode || !addressForm.city) {
      Alert.alert("Missing Fields", "Please fill all required address fields.");
      return;
    }
    try {
      setLoading(true);
      const payload = {
        type: 'home',
        name: addressForm.name,
        mobile: addressForm.mobile,
        pincode: addressForm.pincode,
        state: addressForm.state || 'N/A',
        city: addressForm.city,
        locality: addressForm.locality || addressForm.city,
        building_no: addressForm.buildingNo || 'N/A',
        is_default: true
      };
      const response = await api.post('/addresses', payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        await fetchAddresses();
        setShowAddressForm(false);
      } else {
        Alert.alert("Error", response.data.message || "Failed to save address");
      }
    } catch (error) {
      console.error("Address save error", error);
      Alert.alert("Error", "Failed to save address");
    } finally {
      setLoading(false);
    }
  };

  const handlePlaceOrder = async () => {
    if (!selectedAddressId) {
      Alert.alert("Address Required", "Please select a delivery address.");
      return;
    }
    
    setPlacingOrder(true);
    try {
      const response = await api.post('/orders', {
        items: cart,
        selectedAddressId: selectedAddressId,
        paymentMethod: 'cod', // Hardcoded COD native mapping for now or UPI
        deliveryCharge: deliveryCharge,
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        clearCart();
        Alert.alert(
          "Success", 
          "Order Placed Successfully! Your order ID is " + (response.data.orderId || "confirmed"),
          [{ text: "Continue", onPress: () => navigation.navigate("HomeTab") }]
        );
      } else {
        Alert.alert("Failed", response.data.message || "Failed to place order.");
      }
    } catch (error) {
      console.error('Checkout error:', error);
      Alert.alert("Error", "Error placing order. Please try again.");
    } finally {
      setPlacingOrder(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingCenter}>
        <ActivityIndicator size="large" color="#2874f0" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={{ width: 32 }} />
        <Text style={styles.headerTitle}>Checkout</Text>
        <View style={{ width: 32 }} />
      </View>


      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {/* Step 1: Delivery Address */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. Delivery Address</Text>
          
          {showAddressForm ? (
            <View style={styles.addressForm}>
              <View style={styles.formRow}>
                <View style={styles.halfInputWrap}>
                  <Text style={styles.label}>Full Name *</Text>
                  <TextInput style={styles.input} placeholder="Full Name" value={addressForm.name} onChangeText={(t) => setAddressForm({...addressForm, name: t})} />
                </View>
                <View style={styles.halfInputWrap}>
                  <Text style={styles.label}>Mobile Number *</Text>
                  <TextInput style={styles.input} placeholder="10-digit number" keyboardType="numeric" maxLength={10} value={addressForm.mobile} onChangeText={(t) => setAddressForm({...addressForm, mobile: t})} />
                </View>
              </View>

              <View style={styles.formRow}>
                <View style={styles.halfInputWrap}>
                  <Text style={styles.label}>Pincode *</Text>
                  <TextInput style={styles.input} placeholder="6-digit pincode" keyboardType="numeric" maxLength={6} value={addressForm.pincode} onChangeText={(t) => setAddressForm({...addressForm, pincode: t})} />
                </View>
                <View style={styles.halfInputWrap}>
                  <Text style={styles.label}>State</Text>
                  <TextInput style={styles.input} placeholder="State" value={addressForm.state} onChangeText={(t) => setAddressForm({...addressForm, state: t})} />
                </View>
              </View>

              <View style={styles.formRow}>
                <View style={styles.halfInputWrap}>
                  <Text style={styles.label}>City *</Text>
                  <TextInput style={styles.input} placeholder="City" value={addressForm.city} onChangeText={(t) => setAddressForm({...addressForm, city: t})} />
                </View>
                <View style={styles.halfInputWrap}>
                  <Text style={styles.label}>Locality / Area *</Text>
                  <TextInput style={styles.input} placeholder="Locality" value={addressForm.locality} onChangeText={(t) => setAddressForm({...addressForm, locality: t})} />
                </View>
              </View>

              <View style={{ marginBottom: 10 }}>
                <Text style={styles.label}>Building / Flat No. / Street *</Text>
                <TextInput style={styles.input} placeholder="Building No. or Street Name" value={addressForm.buildingNo} onChangeText={(t) => setAddressForm({...addressForm, buildingNo: t})} />
              </View>

              <TouchableOpacity style={styles.saveAddrBtn} onPress={handleSaveAddress}>
                 <Text style={styles.saveAddrTxt}>Save Address</Text>
              </TouchableOpacity>
              {addresses.length > 0 && (
                <TouchableOpacity style={{marginTop:10}} onPress={() => setShowAddressForm(false)}>
                  <Text style={{color: '#2874f0', textAlign: 'center'}}>Cancel</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <View>
              {addresses.map(addr => (
                <TouchableOpacity 
                  key={addr.id} 
                  style={[styles.addrCard, selectedAddressId === addr.id && styles.addrCardActive]}
                  onPress={() => setSelectedAddressId(addr.id)}
                >
                  <View style={styles.radioWrap}>
                    <View style={[styles.radio, selectedAddressId === addr.id && styles.radioActive]} />
                  </View>
                  <View style={{flex: 1}}>
                    <Text style={styles.addrName}>{addr.name} - {addr.mobile}</Text>
                    <Text style={styles.addrFull}>{addr.building_no}, {addr.locality}, {addr.city}, {addr.state} - {addr.pincode}</Text>
                  </View>
                </TouchableOpacity>
              ))}
              <TouchableOpacity style={styles.addNewBtn} onPress={() => setShowAddressForm(true)}>
                <Text style={styles.addNewTxt}>+ Add New Address</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Coupon Code */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>3. Apply Coupon</Text>
          {couponApplied ? (
            <View style={styles.couponApplied}>
              <View style={{flexDirection: 'row', alignItems: 'center', gap: 8}}>
                <Ionicons name="pricetag" size={18} color="#16a34a" />
                <Text style={styles.couponAppliedTxt}>{couponCode} applied — ₹{couponDiscount} OFF</Text>
              </View>
              <TouchableOpacity onPress={handleRemoveCoupon}>
                <Ionicons name="close-circle" size={22} color="#ef4444" />
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.couponRow}>
              <TextInput style={styles.couponInput} placeholder="Enter coupon code" autoCapitalize="characters" value={couponCode} onChangeText={t => setCouponCode(t.toUpperCase())} />
              <TouchableOpacity style={styles.couponBtn} onPress={handleApplyCoupon} disabled={applyingCoupon}>
                {applyingCoupon ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.couponBtnTxt}>APPLY</Text>}
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Step 3: Order Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>4. Order Details</Text>
          {cart.map(item => (
            <View key={item.id || item._id} style={styles.orderItem}>
               <Text style={styles.orderItemName} numberOfLines={1}>{item.quantity}x {item.item_name || item.name}</Text>
               <Text style={styles.orderItemPrice}>₹{(item.rental_price_per_day || item.price) * (item.quantity||1)}</Text>
            </View>
          ))}
          
          <View style={styles.divider} />
          
          <View style={styles.priceRow}>
            <Text>Items Total</Text>
            <Text>₹{cartTotal}</Text>
          </View>
          <View style={styles.priceRow}>
             <Text>Security Deposit (Refundable)</Text>
             <Text>₹{securityDeposit}</Text>
          </View>
          <View style={styles.priceRow}>
             <Text>Delivery Charge</Text>
             <Text style={{color: deliveryCharge === 0 ? 'green' : 'black'}}>{deliveryCharge === 0 ? 'FREE' : `₹${deliveryCharge}`}</Text>
          </View>
          {couponDiscount > 0 && (
            <View style={styles.priceRow}>
              <Text style={{color: '#16a34a'}}>Coupon Discount</Text>
              <Text style={{color: '#16a34a', fontWeight: 'bold'}}>-₹{couponDiscount}</Text>
            </View>
          )}

          <View style={[styles.priceRow, styles.totalRow]}>
             <Text style={styles.totalText}>Total Amount</Text>
             <Text style={styles.totalText}>₹{finalTotal}</Text>
          </View>
        </View>

      </ScrollView>

      {/* Bottom Bar */}
      <View style={styles.bottomBar}>
        <View style={styles.bottomPriceInfo}>
          <Text style={styles.totalAmountText}>₹{finalTotal}</Text>
          <Text style={styles.totalSubText}>View price details</Text>
        </View>
        <TouchableOpacity 
          style={[styles.checkoutBtn, placingOrder && {backgroundColor: '#ccc'}]} 
          onPress={handlePlaceOrder}
          disabled={placingOrder}
        >
          {placingOrder ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.checkoutText}>Continue</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f1f3f6' },
  loadingCenter: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 55 : 35,
    paddingBottom: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 3,
    borderBottomColor: '#000000',

    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  headerTitle: { color: '#1e293b', fontSize: 18, fontWeight: 'bold' },

  scrollContent: { padding: 15, paddingBottom: 100 },
  
  section: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#212121',
    marginBottom: 15,
  },
  
  addressForm: {},
  formRow: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  halfInputWrap: { flex: 1 },
  label: { fontSize: 13, color: '#666', marginBottom: 5, fontWeight: '500' },
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 4,
    padding: 10,
    fontSize: 14,
    backgroundColor: '#fafafa',
  },
  saveAddrBtn: {
    backgroundColor: '#2874f0',
    padding: 12,
    borderRadius: 4,
    alignItems: 'center',
    marginTop: 15,
  },
  saveAddrTxt: { color: '#fff', fontWeight: 'bold' },
  
  addrCard: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 6,
    padding: 15,
    marginBottom: 10,
  },
  addrCardActive: {
    borderColor: '#2874f0',
    backgroundColor: '#f5faff',
  },
  radioWrap: { marginRight: 15, paddingTop: 2 },
  radio: {
    width: 20, height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#878787',
  },
  radioActive: {
    borderColor: '#2874f0',
    borderWidth: 6,
  },
  addrName: { fontWeight: 'bold', color: '#212121', marginBottom: 5 },
  addrFull: { color: '#878787', fontSize: 13, lineHeight: 18 },
  addNewBtn: {
    padding: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 6,
    backgroundColor: '#fafafa'
  },
  addNewTxt: { color: '#2874f0', fontWeight: '500' },
  
  orderItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  orderItemName: { flex: 1, color: '#212121', paddingRight: 10 },
  orderItemPrice: { fontWeight: '500', color: '#212121' },
  
  divider: { height: 1, backgroundColor: '#f0f0f0', marginVertical: 10 },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  totalRow: { borderTopWidth: 1, borderTopColor: '#f0f0f0', paddingTop: 10, marginTop: 5 },
  totalText: { fontSize: 16, fontWeight: 'bold', color: '#212121' },

  couponRow: { flexDirection: 'row', gap: 10 },
  couponInput: { flex: 1, borderWidth: 1, borderColor: '#e0e0e0', borderRadius: 4, padding: 10, fontSize: 14, fontFamily: 'monospace' },
  couponBtn: { backgroundColor: '#2874f0', paddingHorizontal: 20, borderRadius: 4, justifyContent: 'center' },
  couponBtnTxt: { color: '#fff', fontWeight: 'bold', fontSize: 13 },
  couponApplied: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f0fdf4', padding: 12, borderRadius: 6, borderWidth: 1, borderColor: '#bbf7d0' },
  couponAppliedTxt: { color: '#166534', fontWeight: 'bold', fontSize: 13 },


  bottomBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderTopWidth: 1, borderTopColor: '#e0e0e0',
    elevation: 10
  },
  bottomPriceInfo: { flex: 1 },
  totalAmountText: { fontSize: 20, fontWeight: 'bold', color: '#212121' },
  totalSubText: { color: '#2874f0', fontSize: 12, fontWeight: 'bold', marginTop: 2 },
  checkoutBtn: {
    backgroundColor: '#fb641b',
    paddingHorizontal: 30, paddingVertical: 12,
    borderRadius: 4,
    minWidth: 120, alignItems: 'center'
  },
  checkoutText: { color: '#fff', fontSize: 16, fontWeight: 'bold' }
});
