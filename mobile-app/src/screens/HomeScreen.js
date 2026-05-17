import React, { useEffect, useState, useContext } from 'react';
import { View, Text, ScrollView, Image, StyleSheet, ActivityIndicator, TouchableOpacity, Dimensions, Alert, TextInput, Modal, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../api/api';
import { AuthContext } from '../context/AuthContext';
import { useLocationContext } from '../context/LocationContext';
import { Header } from '../components/Header';
import HeroBanner from '../components/HeroBanner';
import Footer from '../components/Footer';
import CategoryGrid from '../components/CategoryGrid';
import { useCart } from '../context/CartContext';

const { width } = Dimensions.get('window');

// 5-step image fallback chain matching PWA
function getProductImage(product) {
  if (product.image_url && product.image_url.startsWith('http')) return product.image_url;
  const photo = product.photos?.[0];
  if (!photo) return null;
  if (photo.fullUrl && photo.fullUrl.startsWith('http')) return photo.fullUrl;
  if (photo.full_url && photo.full_url.startsWith('http')) return photo.full_url;
  const urlField = Object.values(photo).find(v => typeof v === 'string' && v.startsWith('http'));
  if (urlField) return urlField;
  if (photo.base64Preview) return photo.base64Preview;
  return null;
}

// Skeleton loader card
function SkeletonCard() {
  return (
    <View style={skeletonStyles.card}>
      <View style={skeletonStyles.img} />
      <View style={skeletonStyles.line1} />
      <View style={skeletonStyles.line2} />
      <View style={skeletonStyles.line3} />
    </View>
  );
}
const skeletonStyles = StyleSheet.create({
  card: { width: 160, marginRight: 10, backgroundColor: '#fff', borderRadius: 8, padding: 10 },
  img: { width: '100%', height: 110, borderRadius: 6, backgroundColor: '#e2e8f0', marginBottom: 8 },
  line1: { height: 12, borderRadius: 4, backgroundColor: '#e2e8f0', marginBottom: 6, width: '90%' },
  line2: { height: 10, borderRadius: 4, backgroundColor: '#e2e8f0', marginBottom: 6, width: '60%' },
  line3: { height: 28, borderRadius: 4, backgroundColor: '#e2e8f0', marginTop: 4 },
});

export default function HomeScreen({ navigation }) {
  const { logout, user } = useContext(AuthContext);
  const { district, city } = useLocationContext();
  const { addToCart } = useCart();

  
  const [trending, setTrending] = useState([]);
  const [featured, setFeatured] = useState([]);
  const [newArrivals, setNewArrivals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [subscriberInfo, setSubscriberInfo] = useState('');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchProducts();
    setRefreshing(false);
  };

  const [rentModalVisible, setRentModalVisible] = useState(false);
  const [selectedProductForRent, setSelectedProductForRent] = useState(null);
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date(Date.now() + 86400000).toISOString().split('T')[0]);

  const locFilter = city || district;

  useEffect(() => {
    fetchProducts();
  }, [locFilter]);

  useEffect(() => {
    if (user) {
      checkNewsletterConsent();
    } else {
      setIsSubscribed(false);
    }
  }, [user]);

  const checkNewsletterConsent = async () => {
    try {
      const consented = await AsyncStorage.getItem(`@newsletter_${user.id}`);
      if (consented === 'true') {
        setIsSubscribed(true);
      }
    } catch (e) {
      console.error('Failed to load newsletter consent', e);
    }
  };

  const handleSubscribe = async () => {
    if (!user && !subscriberInfo.trim()) {
      Alert.alert("Hold on", "Please enter your email or mobile number first.");
      return;
    }
    
    try {
      if (user) {
        await AsyncStorage.setItem(`@newsletter_${user.id}`, 'true');
      }
      setIsSubscribed(true);
      if (!user) {
        Alert.alert("Success!", `Subscribed with: ${subscriberInfo}`);
      }
    } catch (e) {
      console.error('Failed to save newsletter consent', e);
    }
  };

  const fetchProducts = async () => {
    setLoading(true);
    try {
      let locQuery = locFilter ? `&city=${encodeURIComponent(locFilter)}` : '';
      
      const [trendRes, featRes, newRes] = await Promise.all([
        api.get(`/listings?limit=10&sort=popular${locQuery}`),
        api.get(`/listings?limit=10&sort=rating${locQuery}`),
        api.get(`/listings?limit=10&sort=newest${locQuery}`)
      ]);

      setTrending(trendRes.data?.data || trendRes.data?.listings || []);
      setFeatured(featRes.data?.data || featRes.data?.listings || []);
      setNewArrivals(newRes.data?.data || newRes.data?.listings || []);
    } catch (error) {
      console.error('Error fetching products', error);
      Alert.alert('Network Error', 'Failed to load products. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRentNow = (item) => {
    setSelectedProductForRent(item);
    setRentModalVisible(true);
  };

  const handleConfirmRent = () => {
    if (!startDate || !endDate) {
      Alert.alert('Error', 'Please enter valid rental dates');
      return;
    }
    
    // Simple availability check: start date must be before or equal to end date
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      Alert.alert('Error', 'Invalid date format. Use YYYY-MM-DD');
      return;
    }
    
    if (start > end) {
      Alert.alert('Error', 'End date must be after start date');
      return;
    }

    const ms = end - start;
    const rentalDays = Math.max(1, Math.ceil(ms / (1000 * 60 * 60 * 24)));

    addToCart({
      ...selectedProductForRent,
      quantity: 1,
      start_date: startDate,
      end_date: endDate,
      rentalDays: rentalDays,
      totalPrice: selectedProductForRent.rental_price_per_day || selectedProductForRent.price || 0
    });
    setRentModalVisible(false);
    setSelectedProductForRent(null);
    navigation.navigate('Main', { screen: 'CartTab' });
  };

  const renderProductCard = (item) => {
    const src = getProductImage(item);
    const name = item.item_name || item.name || 'Unnamed Item';
    const price = item.rental_price_per_day || item.price || 0;

    return (
      <TouchableOpacity key={item.id || item._id} style={styles.card} onPress={() => navigation.navigate('ProductDetails', { id: item.id || item._id })}>
        <View style={styles.productImgWrap}>
          {src ? (
            <Image source={{ uri: src }} style={styles.productImage} />
          ) : (
            <View style={[styles.productImage, styles.placeholderImage]}><Text style={styles.placeholderText}>📦</Text></View>
          )}
        </View>
        <View style={styles.cardContent}>
          <Text style={styles.productTitle} numberOfLines={2}>{name}</Text>
          <Text style={styles.productPrice}>₹{price} <Text style={styles.priceUnit}>/ day</Text></Text>
          {item.location && <Text style={styles.productLocation} numberOfLines={1}>📍 {item.location}</Text>}
          <TouchableOpacity style={styles.rentButton} onPress={() => handleRentNow(item)}>
            <Text style={styles.rentButtonText}>Rent Now</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  const renderSection = (title, data) => (
    <View style={styles.sectionWrap}>
      <Text style={styles.sectionHeading}>{title}</Text>
      {loading ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hScrollContent}>
          {[1,2,3,4].map(i => <SkeletonCard key={i} />)}
        </ScrollView>
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hScrollContent}>
          {data && data.length > 0 ? data.map(renderProductCard) : (
            <Text style={styles.emptyText}>No products found in {locFilter || 'this area'}.</Text>
          )}
        </ScrollView>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <Header showSearch={true} />
      <ScrollView 
        contentContainerStyle={styles.scrollContent} 
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#2874f0']} />}
      >
        <HeroBanner />
        
        <View style={styles.categoriesWrap}>
          <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingRight: 15}}>
            <Text style={styles.sectionHeading}>Rent by Category</Text>
            <TouchableOpacity onPress={() => navigation.navigate('AllCategories')}>
              <Text style={{color: '#2874f0', fontWeight: 'bold'}}>View All</Text>
            </TouchableOpacity>
          </View>
          <CategoryGrid />
        </View>

        {locFilter ? (
          <View style={styles.locationBanner}>
            <Text style={styles.locationBannerText}>📍 Showing products available in: <Text style={{fontWeight: 'bold'}}>{locFilter}</Text></Text>
          </View>
        ) : null}

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.trustBadges}>
          <View style={styles.badge}><Text style={styles.badgeText}>🛡️ Verified</Text></View>
          <View style={styles.badge}><Text style={styles.badgeText}>⚡ Instant</Text></View>
          <View style={styles.badge}><Text style={styles.badgeText}>💰 Best Prices</Text></View>
          <View style={styles.badge}><Text style={styles.badgeText}>🔄 Returns</Text></View>
        </ScrollView>

        {renderSection('🔥 Trending Now', trending)}
        {renderSection('⭐ Featured Rentals', featured)}
        {renderSection('✨ New Arrivals', newArrivals)}

        {/* Newsletter Simulation */}
        {(!user || !isSubscribed) && (
          <View style={styles.newsletterSection}>
          <Text style={styles.newsletterTitle}>GET EXCLUSIVE DEALS</Text>
          <Text style={styles.newsletterSub}>Subscribe for new listings and special offers</Text>
          
          {isSubscribed ? (
            <View style={styles.successBox}>
              <Ionicons name="checkmark-circle" size={24} color="#fff" />
              <Text style={styles.successText}>
                {user ? `Thanks ${user.firstName || 'there'}! You're in!` : "Success! Check your inbox."}
              </Text>
            </View>
          ) : (
            <>
              {!user && (
                <TextInput
                  style={styles.subscriberInput}
                  placeholder="Enter Email or Mobile"
                  placeholderTextColor="rgba(255,255,255,0.7)"
                  value={subscriberInfo}
                  onChangeText={setSubscriberInfo}
                />
              )}
              <TouchableOpacity 
                style={styles.subscribeBtn} 
                onPress={handleSubscribe}
              >
                <Text style={styles.subscribeBtnText}>Subscribe Now</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
        )}

        <Footer />
      </ScrollView>

      {/* Rent Date Selection Modal */}
      <Modal visible={rentModalVisible} transparent animationType="slide" onRequestClose={() => setRentModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={styles.modalCloseArea} activeOpacity={1} onPress={() => setRentModalVisible(false)} />
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Rental Dates</Text>
              <TouchableOpacity onPress={() => setRentModalVisible(false)}>
                <Ionicons name="close-circle-outline" size={28} color="#64748b" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.dateInputsContainer}>
              <View style={styles.dateInputWrapper}>
                 <Text style={styles.dateLabel}>Start Date</Text>
                 <TextInput 
                   style={styles.dateInput} 
                   value={startDate} 
                   onChangeText={setStartDate}
                   placeholder="YYYY-MM-DD"
                 />
              </View>
              <View style={styles.dateInputWrapper}>
                 <Text style={styles.dateLabel}>End Date</Text>
                 <TextInput 
                    style={styles.dateInput} 
                    value={endDate} 
                    onChangeText={setEndDate}
                    placeholder="YYYY-MM-DD"
                 />
              </View>
            </View>

            <TouchableOpacity style={styles.confirmRentBtn} onPress={handleConfirmRent}>
              <Text style={styles.confirmRentBtnText}>Check Availability & Rent</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f1f3f6',
  },
  scrollContent: {
    paddingBottom: 20,
  },
  categoriesWrap: {
    backgroundColor: '#fff',
    marginTop: 10,
    paddingVertical: 15,
  },
  sectionWrap: {
    backgroundColor: '#fff',
    marginTop: 10,
    paddingVertical: 15,
  },
  sectionHeading: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#212121',
    paddingHorizontal: 15,
    marginBottom: 5,
  },
  loader: {
    marginVertical: 40,
  },
  hScrollContent: {
    paddingHorizontal: 15,
    paddingBottom: 10,
    gap: 15,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    width: 150, 
    borderWidth: 1,
    borderColor: '#e0e0e0',
    overflow: 'hidden',
  },
  productImgWrap: {
    padding: 10,
    alignItems: 'center',
  },
  productImage: {
    width: '100%',
    height: 120,
    resizeMode: 'contain',
  },
  placeholderImage: {
    backgroundColor: '#f9f9f9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 30,
  },
  cardContent: {
    paddingHorizontal: 10,
    paddingBottom: 10,
  },
  productTitle: {
    fontSize: 13,
    color: '#212121',
    fontWeight: '500',
    marginBottom: 6,
    height: 36, // Force double-line height
  },
  productPrice: {
    fontSize: 15,
    color: '#212121',
    fontWeight: 'bold',
  },
  priceUnit: {
    fontSize: 11,
    color: '#878787',
    fontWeight: 'normal',
  },
  productLocation: {
    fontSize: 11,
    color: '#878787',
    marginTop: 6,
  },
  rentButton: {
    marginTop: 10,
    backgroundColor: '#fbbf24', // Flipkart orange
    paddingVertical: 8,
    borderRadius: 4,
    alignItems: 'center',
  },
  rentButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: 'bold',
  },
  emptyText: {
    color: '#878787',
    textAlign: 'center',
    paddingVertical: 20,
  },
  locationBanner: {
    backgroundColor: '#e0e7ff',
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  locationBannerText: {
    color: '#3730a3',
    fontSize: 13,
  },
  trustBadges: {
    backgroundColor: '#fff',
    marginTop: 10,
    paddingVertical: 15,
    paddingHorizontal: 15,
    gap: 10,
  },
  badge: {
    backgroundColor: '#f8fafc',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
  },
  newsletterSection: {
    backgroundColor: '#cf1417',
    padding: 40,
    alignItems: 'center',
    marginTop: 15,
  },
  newsletterTitle: {
    fontSize: 22,
    color: '#fff',
    fontWeight: 'bold',
  },
  newsletterSub: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.9,
    marginBottom: 20,
    marginTop: 8,
    textAlign: 'center',
  },
  subscribeBtn: {
    backgroundColor: '#fff',
    paddingHorizontal: 25,
    paddingVertical: 12,
    borderRadius: 6,
  },
  subscribeBtnText: {
    color: '#cf1417',
    fontWeight: 'bold',
    fontSize: 15,
  },
  subscriberInput: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    width: '100%',
    maxWidth: 300,
    height: 50,
    borderRadius: 6,
    paddingHorizontal: 15,
    color: '#fff',
    fontSize: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    textAlign: 'center',
  },
  successBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 30,
    marginTop: 10,
  },
  successText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 15,
    marginLeft: 10,
  },
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end'
  },
  modalCloseArea: {
    flex: 1
  },
  modalContent: {
    backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 25, paddingBottom: 40
  },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20
  },
  modalTitle: {
    fontSize: 18, fontWeight: 'bold', color: '#1e293b'
  },
  dateInputsContainer: {
    flexDirection: 'row', justifyContent: 'space-between', marginBottom: 25
  },
  dateInputWrapper: {
    width: '48%'
  },
  dateLabel: {
    fontSize: 13, color: '#64748b', marginBottom: 6, fontWeight: '600'
  },
  dateInput: {
    backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 8, padding: 12, fontSize: 15, color: '#334155'
  },
  confirmRentBtn: {
    backgroundColor: '#2874f0', padding: 16, borderRadius: 8, alignItems: 'center'
  },
  confirmRentBtnText: {
    color: '#fff', fontSize: 16, fontWeight: 'bold'
  }
});
