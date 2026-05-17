import React, { useContext } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Image, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useCart } from '../context/CartContext';
import { AuthContext } from '../context/AuthContext';
import { Header } from '../components/Header';

export default function CartScreen({ navigation }) {
  const { cart, removeFromCart, updateQuantity, getCartTotal, clearCart } = useCart();
  const { user } = useContext(AuthContext);

  const handleCheckout = () => {
    if (!user) {
      navigation.navigate('Login', { redirectTo: 'Checkout' });
    } else {
      navigation.navigate('Checkout');
    }
  };

  const handleIncrement = (item) => {
    updateQuantity(item.id || item._id, (item.quantity || 1) + 1);
  };

  const handleDecrement = (item) => {
    if ((item.quantity || 1) > 1) {
      updateQuantity(item.id || item._id, (item.quantity || 1) - 1);
    }
  };

  if (cart.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        {/* Simple Header for unauthenticated or empty states */}
      <Header showBack={true} />
        <View style={styles.emptyContent}>
           <Image 
             source={{ uri: 'https://rukminim2.flixcart.com/www/800/800/promos/16/05/2019/d438a32e-765a-4d8b-b4a6-520b560971e8.png?q=90' }} 
             style={styles.emptyImage} 
           />
           <Text style={styles.emptyTitle}>Your cart is empty!</Text>
           <Text style={styles.emptySub}>Add items to it now.</Text>
           <TouchableOpacity style={styles.shopBtn} onPress={() => navigation.navigate('HomeTab')}>
             <Text style={styles.shopBtnText}>Shop Now</Text>
           </TouchableOpacity>
        </View>
      </View>
    );
  }

  const total = getCartTotal();

  return (
    <View style={styles.container}>
      <Header showBack={true} />
      <View style={{ backgroundColor: '#fff', padding: 10, borderBottomWidth: 1, borderBottomColor: '#eee', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
         <Text style={{ fontSize: 18, fontWeight: 'bold' }}>My Cart</Text>
         <TouchableOpacity onPress={clearCart}>
            <Text style={{ color: '#ef4444', fontWeight: 'bold' }}>Clear Cart</Text>
         </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        {cart.map((item, index) => {
          const image = item.photos && item.photos.length > 0 
            ? (item.photos[0].full_url || item.photos[0].fullUrl) : null;
          const price = item.rental_price_per_day || item.price || 0;
          const days = item.rentalDays || 1;

          return (
            <View key={item.id || item._id || index} style={styles.cartItem}>
              <View style={styles.itemTop}>
                <Image 
                  source={image ? { uri: image } : require('../../assets/adaptive-icon.png')} 
                  style={styles.itemImage}
                  resizeMode="contain"
                />
                <View style={styles.itemInfo}>
                  <Text style={styles.itemName} numberOfLines={2}>{item.item_name || item.name}</Text>
                  <Text style={styles.itemSeller}>Seller: {item.lender || item.lender_name || 'Retailer'}</Text>
                  
                  <View style={styles.priceRow}>
                    <Text style={styles.priceCurrent}>₹{price}</Text>
                    <Text style={styles.priceUnit}> x {days} {days === 1 ? 'day' : 'days'}</Text>
                  </View>
                </View>
              </View>

              <View style={styles.itemBottom}>
                <View style={styles.qtyBox}>
                  <TouchableOpacity style={styles.qtyBtn} onPress={() => handleDecrement(item)}>
                    <Text style={styles.qtyBtnText}>-</Text>
                  </TouchableOpacity>
                  <View style={styles.qtyNumWrap}>
                    <Text style={styles.qtyNum}>{item.quantity || 1}</Text>
                  </View>
                  <TouchableOpacity style={styles.qtyBtn} onPress={() => handleIncrement(item)}>
                    <Text style={styles.qtyBtnText}>+</Text>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity style={styles.removeBtn} onPress={() => removeFromCart(item.id || item._id)}>
                  <Text style={styles.removeText}>Remove</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })}

        {/* Price Details */}
        <View style={styles.priceDetailsWrap}>
           <Text style={styles.pdTitle}>Price Details</Text>
           <View style={styles.pdRow}>
             <Text style={styles.pdLabel}>Price ({cart.length} item{cart.length > 1 ? 's' : ''})</Text>
             <Text style={styles.pdValue}>₹{total}</Text>
           </View>
           <View style={styles.pdRow}>
             <Text style={styles.pdLabel}>Delivery</Text>
             <Text style={styles.pdFree}>Free</Text>
           </View>
           <View style={[styles.pdRow, styles.pdTotal]}>
             <Text style={styles.pdTotalLabel}>Total Amount</Text>
             <Text style={styles.pdTotalValue}>₹{total}</Text>
           </View>
        </View>
      </ScrollView>

      {/* Sticky Bottom Bar */}
      <View style={styles.bottomBar}>
        <View style={styles.bottomPrice}>
           <Text style={styles.bottomAmount}>₹{total}</Text>
           <Text style={styles.viewDetailsText}>View price details</Text>
        </View>
        <TouchableOpacity style={styles.checkoutBtn} onPress={handleCheckout}>
           <Text style={styles.checkoutText}>Place Order</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f1f3f6', 
  },
  emptyContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    height: 56,
    backgroundColor: '#1193d4',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    justifyContent: 'space-between',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '500',
  },
  clearText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  emptyContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyImage: {
    width: 200,
    height: 150,
    resizeMode: 'contain',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 18,
    color: '#212121',
    fontWeight: '500',
    marginBottom: 8,
  },
  emptySub: {
    color: '#878787',
    fontSize: 14,
    marginBottom: 20,
  },
  shopBtn: {
    backgroundColor: '#1193d4',
    paddingHorizontal: 40,
    paddingVertical: 12,
    borderRadius: 4,
  },
  shopBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  cartItem: {
    backgroundColor: '#fff',
    marginBottom: 8,
    padding: 15,
  },
  itemTop: {
    flexDirection: 'row',
    marginBottom: 15,
  },
  itemImage: {
    width: 80,
    height: 80,
    marginRight: 15,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 15,
    color: '#212121',
    fontWeight: '400',
    marginBottom: 5,
  },
  itemSeller: {
    fontSize: 13,
    color: '#878787',
    marginBottom: 10,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  priceCurrent: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#212121',
  },
  priceUnit: {
    fontSize: 13,
    color: '#878787',
    marginLeft: 5,
  },
  itemBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 15,
  },
  qtyBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 'auto',
  },
  qtyBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#c2c2c2',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  qtyBtnText: {
    fontSize: 18,
    fontWeight: '500',
    color: '#212121',
  },
  qtyNumWrap: {
    width: 40,
    height: 30,
    borderWidth: 1,
    borderColor: '#c2c2c2',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 10,
  },
  qtyNum: {
    fontSize: 14,
    fontWeight: '500',
  },
  removeBtn: {
    paddingHorizontal: 15,
  },
  removeText: {
    color: '#212121',
    fontWeight: 'bold',
    fontSize: 15,
  },
  priceDetailsWrap: {
    backgroundColor: '#fff',
    marginTop: 10,
    padding: 15,
  },
  pdTitle: {
    color: '#878787',
    fontWeight: '600',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    paddingBottom: 15,
    marginBottom: 15,
  },
  pdRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  pdLabel: {
    fontSize: 15,
    color: '#212121',
  },
  pdValue: {
    fontSize: 15,
    color: '#212121',
  },
  pdFree: {
    fontSize: 15,
    color: '#388e3c',
  },
  pdTotal: {
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 15,
    marginTop: 5,
  },
  pdTotalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#212121',
  },
  pdTotalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#212121',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    backgroundColor: '#fff',
    elevation: 20,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: -3 },
    paddingVertical: 10,
    paddingHorizontal: 15,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bottomPrice: {
    flex: 1,
  },
  bottomAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#212121',
  },
  viewDetailsText: {
    fontSize: 12,
    color: '#1193d4',
    fontWeight: 'bold',
  },
  checkoutBtn: {
    backgroundColor: '#fbbf24',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 4,
  },
  checkoutText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  }
});
