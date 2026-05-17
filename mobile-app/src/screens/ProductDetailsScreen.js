import React, { useEffect, useState, useContext } from 'react';
import { View, Text, ScrollView, Image, StyleSheet, TouchableOpacity, ActivityIndicator, Dimensions, TextInput, Alert, Share } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../api/api';
import { AuthContext } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { Header } from '../components/Header';
import { toggleWishlist, isInWishlist } from './WishlistScreen';

const { width } = Dimensions.get('window');

const getLocalDate = (offsetMs = 0) => {
  const d = new Date(Date.now() + offsetMs);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().split('T')[0];
};

export default function ProductDetailsScreen({ route, navigation }) {
  const { id } = route.params;
  const { user } = useContext(AuthContext);
  const { addToCart } = useCart();
  
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [wishlisted, setWishlisted] = useState(false);
  const [startDate, setStartDate] = useState(getLocalDate(0));
  const [endDate, setEndDate] = useState(getLocalDate(86400000));
  const [rentalDays, setRentalDays] = useState(2);
  const [relatedProducts, setRelatedProducts] = useState([]);

  useEffect(() => {
    fetchProductDetails();
    isInWishlist(id).then(setWishlisted);
  }, [id]);

  useEffect(() => {
    if (startDate && endDate) {
      const ms = new Date(endDate) - new Date(startDate);
      const days = Math.max(1, Math.ceil(ms / (1000 * 60 * 60 * 24)));
      setRentalDays(days);
    }
  }, [startDate, endDate]);

  const handleAddToCartWithDates = () => {
    addToCart({
      ...product,
      start_date: startDate,
      end_date: endDate,
      rentalDays: rentalDays
    });
  };

  const handleBuyNow = () => {
    addToCart({
      ...product,
      start_date: startDate,
      end_date: endDate,
      rentalDays: rentalDays
    });
    navigation.navigate('Main', { screen: 'CartTab' });
  };

  const handleWishlistToggle = async () => {
    if (!product) return;
    const added = await toggleWishlist(product);
    setWishlisted(added);
    Alert.alert(added ? 'Added to Wishlist' : 'Removed from Wishlist');
  };

  const fetchProductDetails = async () => {
    try {
      const response = await api.get(`/listings/${id}`);
      let fetchedProduct = null;
      if (response.data && response.data.listing) {
        fetchedProduct = response.data.listing;
      } else {
        fetchedProduct = response.data;
      }
      setProduct(fetchedProduct);
      if (fetchedProduct) {
        fetchRelatedProducts(fetchedProduct.category || fetchedProduct.cat);
      }
    } catch (error) {
      console.error('Error fetching product details:', error);
      Alert.alert('Network Error', 'Failed to fetch product details.');
    } finally {
      setLoading(false);
    }
  };

  const fetchRelatedProducts = async (cat) => {
    if (!cat) return;
    try {
      const res = await api.get(`/products?cat=${encodeURIComponent(cat)}&limit=6`);
      if (res.data && res.data.success) {
        let products = res.data.products || res.data.listings || [];
        setRelatedProducts(products.filter(p => p.id !== id && p._id !== id));
      }
    } catch (e) {
      console.log('Failed to fetch related products', e);
    }
  };

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#2874f0" />
      </View>
    );
  }

  if (!product) {
    return (
      <View style={styles.loaderContainer}>
        <Text style={styles.errorText}>Product not found.</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const images = product.photos && product.photos.length > 0 
    ? product.photos.map(p => p.full_url || p.fullUrl) 
    : [];
  const mainImage = images.length > 0 ? images[selectedImage] : null;

  const price = product.rental_price_per_day || product.price || 0;
  const mrp = product.original_price || product.mrp || (price * 1.2);
  const discount = Math.round(((mrp - price) / mrp) * 100);
  const securityDeposit = product.security_deposit || 0;
  const totalAmount = (Number(price) * rentalDays) + Number(securityDeposit);

  return (
    <View style={styles.container}>
      <Header showBack={true} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Image Gallery */}
        <View style={styles.imageSection}>
          <View style={styles.imageActions}>
            <TouchableOpacity style={styles.imageActionBtn} onPress={() => Share.share({ message: `Check out ${product.item_name || product.name} on EveryThing Rental! Rent for just ₹${price}/day`, title: product.item_name || product.name })}>
              <Ionicons name="share-social-outline" size={24} color="#878787" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.imageActionBtn} onPress={handleWishlistToggle}>
              <Ionicons name={wishlisted ? 'heart' : 'heart-outline'} size={26} color={wishlisted ? '#ef4444' : '#c2c2c2'} />
            </TouchableOpacity>
          </View>

          {mainImage ? (
            <Image source={{ uri: mainImage }} style={styles.mainImage} resizeMode="contain" />
          ) : (
            <View style={[styles.mainImage, styles.placeholderImage]}>
              <Text>No Image Available</Text>
            </View>
          )}

          {images.length > 1 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.thumbnailContainer}>
              {images.map((img, idx) => (
                <TouchableOpacity 
                  key={idx} 
                  style={[styles.thumbnailWrap, selectedImage === idx && styles.thumbnailActive]}
                  onPress={() => setSelectedImage(idx)}
                >
                  <Image source={{ uri: img }} style={styles.thumbnailImg} resizeMode="cover" />
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>

        {/* Product Info */}
        <View style={styles.infoSection}>
          <Text style={styles.productTitle}>{product.item_name || product.name}</Text>
          <View style={styles.ratingRow}>
             <View style={styles.ratingBadge}>
               <Text style={styles.ratingText}>4.5</Text>
               <Ionicons name="star" size={10} color="#fff" />
             </View>
             <Text style={styles.ratingCount}>21 ratings</Text>
          </View>

          <View style={styles.priceRow}>
            <Text style={styles.currentPrice}>₹{price}</Text>
            <Text style={styles.perUnit}>/{product.price_unit || 'day'}</Text>
            {discount > 0 && <Text style={styles.mrpText}>₹{Math.round(mrp)}</Text>}
            {discount > 0 && <Text style={styles.discountText}>{discount}% off</Text>}
          </View>
          <Text style={styles.taxNote}>Inclusive of all taxes</Text>
        </View>

        {/* Rental Dates Selection */}
        <View style={styles.sectionWrap}>
          <Text style={styles.sectionTitle}>Select Rental Dates</Text>
          <View style={styles.dateInputs}>
            <View style={styles.dateInputWrap}>
               <Text style={styles.dateLabel}>Start Date</Text>
               <TextInput 
                 style={styles.dateInput} 
                 value={startDate} 
                 onChangeText={setStartDate}
                 placeholder="YYYY-MM-DD"
               />
            </View>
            <View style={styles.dateInputWrap}>
               <Text style={styles.dateLabel}>End Date</Text>
               <TextInput 
                  style={styles.dateInput} 
                  value={endDate} 
                  onChangeText={setEndDate}
                  placeholder="YYYY-MM-DD"
               />
            </View>
          </View>

          <View style={styles.calcBox}>
            <View style={styles.calcRow}>
               <Text style={styles.calcLabel}>Rental Duration</Text>
               <Text style={styles.calcValue}>{rentalDays} day(s)</Text>
            </View>
            <View style={styles.calcRow}>
               <Text style={styles.calcLabel}>Base Rent (₹{price} × {rentalDays})</Text>
               <Text style={styles.calcValue}>₹{price * rentalDays}</Text>
            </View>
            {securityDeposit > 0 && (
              <View style={styles.calcRow}>
                 <Text style={styles.calcLabel}>Security Deposit (Refundable)</Text>
                 <Text style={styles.calcValue}>₹{securityDeposit}</Text>
              </View>
            )}
            <View style={[styles.calcRow, styles.calcTotalRow]}>
               <Text style={styles.calcTotalLabel}>Total Amount</Text>
               <Text style={styles.calcTotalValue}>₹{totalAmount}</Text>
            </View>
          </View>
        </View>

        {/* Product Details & Specifications */}
        <View style={styles.sectionWrap}>
           <Text style={styles.sectionTitle}>Product Details</Text>
           <Text style={styles.description}>{product.description || 'No description provided.'}</Text>
           
           <View style={styles.specGrid}>
             {product.condition && (
               <View style={styles.specItem}>
                 <Text style={styles.specLabel}>Condition</Text>
                 <Text style={styles.specValue}>{product.condition}</Text>
               </View>
             )}
             {product.brand && (
               <View style={styles.specItem}>
                 <Text style={styles.specLabel}>Brand</Text>
                 <Text style={styles.specValue}>{product.brand}</Text>
               </View>
             )}
             {product.model_year && (
               <View style={styles.specItem}>
                 <Text style={styles.specLabel}>Model Year</Text>
                 <Text style={styles.specValue}>{product.model_year}</Text>
               </View>
             )}
             {product.location && (
               <View style={styles.specItem}>
                 <Text style={styles.specLabel}>Location</Text>
                 <Text style={styles.specValue}>{product.location}</Text>
               </View>
             )}
           </View>
        </View>

        {/* Delivery Info Commented Out as requested */}
        {/*
        <View style={styles.sectionWrap}>
           <Text style={styles.sectionTitle}>Delivery Info</Text>
           <View style={styles.deliveryRow}>
              <Ionicons name="location-outline" size={20} color="#212121" />
              <TextInput style={styles.pincodeInput} placeholder="Enter Delivery Pincode" keyboardType="numeric" maxLength={6} />
              <TouchableOpacity><Text style={styles.checkText}>Check</Text></TouchableOpacity>
           </View>
        </View>
        */}

        {/* Suggested Products Section */}
        {relatedProducts.length > 0 && (
          <View style={styles.sectionWrap}>
            <Text style={styles.sectionTitle}>Similar Products</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingVertical: 10 }}>
              {relatedProducts.map((item) => {
                const img = item.photos && item.photos.length > 0 ? (item.photos[0].full_url || item.photos[0].fullUrl) : null;
                const itemPrice = item.rental_price_per_day || item.price;
                return (
                  <TouchableOpacity 
                    key={item.id || item._id} 
                    style={styles.relatedCard}
                    onPress={() => navigation.push('ProductDetails', { id: item.id || item._id })}
                  >
                    <Image source={img ? { uri: img } : require('../../assets/adaptive-icon.png')} style={styles.relatedImg} resizeMode="contain" />
                    <Text style={styles.relatedTitle} numberOfLines={2}>{item.item_name || item.name}</Text>
                    <Text style={styles.relatedPrice}>₹{itemPrice} / day</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}

      </ScrollView>

      {/* Sticky Bottom Actions */}
      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.btnCart} onPress={handleAddToCartWithDates}>
          <Text style={styles.btnCartText}>Add to Cart</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.btnBuy} onPress={handleBuyNow}>
          <Text style={styles.btnBuyText}>Rent Now</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: '#f1f3f6', // Flipkart gray
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#878787',
    marginBottom: 20,
  },
  backBtn: {
    padding: 10,
    backgroundColor: '#1193d4',
    borderRadius: 8,
  },
  backBtnText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    height: 56,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    paddingHorizontal: 15,
  },
  headerIcon: {
    padding: 5,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '500',
    marginLeft: 15,
    color: '#212121',
  },
  headerRight: {
    flexDirection: 'row',
    gap: 15,
  },
  imageSection: {
    backgroundColor: '#fff',
    paddingTop: 10,
    paddingBottom: 20,
  },
  imageActions: {
    position: 'absolute',
    top: 10,
    right: 15,
    zIndex: 10,
    alignItems: 'center',
  },
  imageActionBtn: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 8,
    marginBottom: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  mainImage: {
    width: width,
    height: width * 0.8,
  },
  placeholderImage: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  thumbnailContainer: {
    paddingHorizontal: 15,
    marginTop: 15,
  },
  thumbnailWrap: {
    width: 60,
    height: 60,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    marginRight: 10,
    overflow: 'hidden',
  },
  thumbnailActive: {
    borderColor: '#1193d4',
    borderWidth: 2,
  },
  thumbnailImg: {
    width: '100%',
    height: '100%',
  },
  infoSection: {
    backgroundColor: '#fff',
    padding: 15,
    marginBottom: 10,
  },
  productTitle: {
    fontSize: 16,
    fontWeight: '400',
    color: '#212121',
    lineHeight: 22,
    marginBottom: 8,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  ratingBadge: {
    backgroundColor: '#388e3c',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 3,
  },
  ratingText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    marginRight: 3,
  },
  ratingCount: {
    fontSize: 12,
    color: '#878787',
    marginLeft: 8,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  currentPrice: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#212121',
  },
  perUnit: {
    fontSize: 14,
    color: '#212121',
    marginLeft: 2,
  },
  mrpText: {
    fontSize: 14,
    color: '#878787',
    textDecorationLine: 'line-through',
    marginLeft: 10,
  },
  discountText: {
    fontSize: 14,
    color: '#388e3c',
    fontWeight: 'bold',
    marginLeft: 8,
  },
  taxNote: {
    fontSize: 12,
    color: '#878787',
    marginTop: 2,
  },
  sectionWrap: {
    backgroundColor: '#fff',
    padding: 15,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#212121',
    marginBottom: 10,
  },
  offerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  offerText: {
    fontSize: 13,
    color: '#212121',
    marginLeft: 8,
    flex: 1,
    lineHeight: 18,
  },
  subText: {
    fontSize: 13,
    color: '#666',
    marginBottom: 15,
  },
  dateInputs: {
    flexDirection: 'row',
    gap: 15,
  },
  dateInputWrap: {
    flex: 1,
  },
  dateLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  dateInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 4,
    padding: 10,
    fontSize: 14,
    color: '#1193d4',
  },
  calcBox: {
    marginTop: 15,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 4,
    padding: 15,
  },
  calcRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  calcLabel: {
    fontSize: 14,
    color: '#212121',
  },
  calcValue: {
    fontSize: 14,
    color: '#212121',
  },
  calcTotalRow: {
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    marginTop: 5,
    paddingTop: 10,
    marginBottom: 0,
  },
  calcTotalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#212121',
  },
  calcTotalValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#212121',
  },
  deliveryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#1193d4',
    paddingBottom: 5,
  },
  pincodeInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 14,
  },
  checkText: {
    color: '#1193d4',
    fontWeight: '500',
  },
  description: {
    fontSize: 14,
    color: '#212121',
    lineHeight: 22,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    backgroundColor: '#fff',
    elevation: 10,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: -3 },
    height: 60,
  },
  btnCart: {
    flex: 1,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    borderTopColor: '#e0e0e0',
    borderTopWidth: 1,
  },
  btnCartText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#212121',
  },
  specGrid: {
    marginTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 15,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  specItem: {
    width: '50%',
    marginBottom: 12,
  },
  specLabel: {
    fontSize: 12,
    color: '#878787',
    marginBottom: 2,
  },
  specValue: {
    fontSize: 14,
    color: '#212121',
    fontWeight: '500',
  },
  btnBuy: {
    flex: 1,
    backgroundColor: '#ff9f00', // Flipkart orange
    justifyContent: 'center',
    alignItems: 'center',
  },

  btnBuyText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  }
});
