import React, { useContext, useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Image, Platform, Modal, SafeAreaView, Dimensions, ScrollView } from 'react-native';
import { AuthContext } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useLocationContext } from '../context/LocationContext';
import { useSocket } from '../context/SocketContext';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

const { height, width } = Dimensions.get('window');

export function Header({ onChatPress, onCartPress, showBack = false, showSearch = false }) {
  const { user, logout } = useContext(AuthContext);
  const { unreadCount } = useSocket();
  const { getCartCount } = useCart();
  const { state: district, city, cities: districts, setManualCity: setManualDistrict } = useLocationContext();




  const navigation = useNavigation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuView, setMenuView] = useState('main'); // 'main' or 'lender'
  const [locationModalVisible, setLocationModalVisible] = useState(false);
  const [locationSearch, setLocationSearch] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const handleMenuPress = () => {
    setMenuView('main');
    setMenuOpen(true);
  };
  const handleCloseMenu = () => {
    setMenuOpen(false);
    // Use a small delay to reset view after modal starts closing to avoid flicker
    setTimeout(() => setMenuView('main'), 300);
  };

  const handleNav = (screen) => {
    handleCloseMenu();
    if (navigation && navigation.navigate) {
      const tabScreens = ['Orders', 'CategoriesTab', 'HomeTab', 'CartTab'];
      if (tabScreens.includes(screen)) {
        navigation.navigate('Main', { screen });
      } else {
        navigation.navigate(screen);
      }
    }
  };

  const handleNavWithParams = (screen, params) => {
    handleCloseMenu();
    if (navigation && navigation.navigate) {
      navigation.navigate(screen, params);
    }
  };

  const handleLogout = () => {
    handleCloseMenu();
    logout();
  };

  const handleSelectCity = (d) => {
    setManualDistrict(d);
    setLocationModalVisible(false);
    setLocationSearch('');
  };

  const handleSearchSubmit = () => {
    if (searchQuery.trim()) {
      navigation.navigate('SearchResults', { query: searchQuery.trim() });
      setSearchQuery('');
    }
  };

  const cartCount = getCartCount();
  const displayLocation = district || city || 'Select Location';


  const filteredDistricts = districts.filter(d => d.toLowerCase().includes(locationSearch.toLowerCase()));

  return (
    <>
      <View style={styles.headerContainer}>
        {/* Top Row: Logo, Location Badge, Icons */}
        <View style={styles.topRow}>
          <View style={styles.leftSection}>
            <TouchableOpacity style={styles.menuBtn} onPress={handleMenuPress}>
              <Ionicons name="menu-outline" size={36} color="#0f172a" />
            </TouchableOpacity>

            <TouchableOpacity onPress={() => navigation.navigate('Main')}>


              <Image
                source={require('../../assets/logo.png')}
                style={styles.logo}
                resizeMode="contain"
              />
            </TouchableOpacity>
          </View>

          <View style={styles.rightSection}>
            <TouchableOpacity style={styles.iconWrapper} onPress={onChatPress || (() => handleNav('Chat'))}>
              <Ionicons name="chatbubbles-outline" size={32} color="#0f172a" />
              {unreadCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{unreadCount}</Text>
                </View>
              )}
            </TouchableOpacity>

            {user ? (
              <TouchableOpacity style={styles.avatarWrapper} onPress={() => handleNav('Profile')}>
                <View style={styles.avatarFallback}>
                  <Text style={styles.avatarText}>{user.first_name ? user.first_name.charAt(0).toUpperCase() : 'U'}</Text>
                </View>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={styles.btnLogin} onPress={() => handleNav('Login')}>
                <Text style={styles.btnLoginText}>Login</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Mobile Location Bar below header, above search */}
        <TouchableOpacity style={styles.mobileLocationBar} onPress={() => setLocationModalVisible(true)}>
          <Ionicons name="location-outline" size={20} color="#0f172a" />
          <Text style={styles.locationText}>Deliver to: <Text style={{ fontWeight: 'bold' }}>{displayLocation}</Text></Text>
          <Ionicons name="chevron-down-outline" size={18} color="#0f172a" />
        </TouchableOpacity>

        {/* Straight line separator */}
        {showSearch && <View style={styles.separator} />}

        {/* Search Bar Container */}
        {showSearch && (
          <View style={styles.searchBarContainer}>

            <View style={styles.searchInputWrapper}>
              <TextInput
                style={styles.searchInput}
                placeholder="Search products..."
                placeholderTextColor="#64748b"
                value={searchQuery}
                onChangeText={setSearchQuery}
                onSubmitEditing={handleSearchSubmit}
                returnKeyType="search"
              />
              <TouchableOpacity style={styles.searchButton} onPress={handleSearchSubmit}>
                <Ionicons name="search-outline" size={26} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
        )}

      </View>

      {/* Location Modal */}
      <Modal visible={locationModalVisible} transparent={true} animationType="slide" onRequestClose={() => setLocationModalVisible(false)}>
        <View style={styles.locModalOverlay}>
          <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={() => setLocationModalVisible(false)} />
          <View style={styles.locModalContent}>
            <View style={styles.locModalHeader}>
              <Text style={styles.locModalTitle}>Choose Your City</Text>
              <TouchableOpacity onPress={() => setLocationModalVisible(false)}>
                <Ionicons name="close-outline" size={28} color="#000" />
              </TouchableOpacity>
            </View>

            <View style={styles.locSearchBox}>
              <Ionicons name="search-outline" size={20} color="#666" style={{ marginLeft: 10 }} />
              <TextInput
                style={styles.locSearchInput}
                placeholder="Search city..."
                value={locationSearch}
                onChangeText={setLocationSearch}
              />
              {locationSearch.length > 0 && (
                <TouchableOpacity onPress={() => setLocationSearch('')} style={{ marginRight: 10 }}>
                  <Ionicons name="close-circle" size={18} color="#999" />
                </TouchableOpacity>
              )}
            </View>

            <ScrollView contentContainerStyle={styles.locGrid}>
              {filteredDistricts.map(d => (
                <TouchableOpacity
                  key={d}
                  style={[styles.locBtn, (district === d || city === d) && styles.locBtnActive]}
                  onPress={() => handleSelectCity(d)}
                >
                  <Text style={[styles.locBtnTxt, (district === d || city === d) && styles.locBtnTxtActive]}>{d}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Slide-In Mobile Menu */}
      <Modal visible={menuOpen} transparent={true} animationType="fade" onRequestClose={handleCloseMenu}>
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={styles.modalCloseOverlay} activeOpacity={1} onPress={handleCloseMenu} />

          <View style={styles.menuDrawer}>
            <View style={styles.menuHeader}>
              <TouchableOpacity style={styles.closeBtn} onPress={handleCloseMenu}>
                <Ionicons name="close-outline" size={32} color="#0f172a" />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.menuContent}>
              {menuView === 'main' ? (
                <>
                  {user && (
                    <View style={styles.mobileUserCard}>
                      <View style={styles.mobileAvatar}>
                        <Text style={styles.mobileAvatarText}>{user.first_name ? user.first_name.charAt(0).toUpperCase() : 'U'}</Text>
                      </View>
                      <View style={styles.mobileUserInfo}>
                        <Text style={styles.mobileUserName}>{user.first_name || 'User'}</Text>
                        <Text style={styles.mobileUserEmail}>{user.email || ''}</Text>
                      </View>
                    </View>
                  )}

                  <TouchableOpacity style={styles.menuItem} onPress={onCartPress || (() => handleNav('Cart'))}>
                    <Ionicons name="cart-outline" size={24} color="#0f172a" />
                    <Text style={styles.menuItemText}>Cart</Text>
                    {cartCount > 0 && (
                      <View style={styles.drawerBadge}>
                        <Text style={styles.badgeText}>{cartCount}</Text>
                      </View>
                    )}
                  </TouchableOpacity>

                  {user ? (
                    <>
                      <TouchableOpacity style={styles.menuItem} onPress={() => handleNav('Orders')}>
                        <Ionicons name="cube-outline" size={24} color="#0f172a" />
                        <Text style={styles.menuItemText}>My Orders</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.menuItem} onPress={() => handleNav('Profile')}>
                        <Ionicons name="person-outline" size={24} color="#0f172a" />
                        <Text style={styles.menuItemText}>Profile</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.menuItem} onPress={() => handleNav('Chat')}>
                        <Ionicons name="chatbubbles-outline" size={24} color="#0f172a" />
                        <Text style={styles.menuItemText}>Messages</Text>
                      </TouchableOpacity>

                      {/* Lender Suite Entry */}
                      {user.lender ? (
                        <>
                          <View style={styles.menuDivider}><Text style={styles.menuDividerText}>LENDER MANAGEMENT</Text></View>
                          <TouchableOpacity 
                            style={[styles.menuItem, { backgroundColor: '#f8fafc', borderRadius: 8, marginTop: 5 }]} 
                            onPress={() => setMenuView('lender')}
                          >
                            <Ionicons name="storefront-outline" size={24} color="#2874f0" />
                            <Text style={[styles.menuItemText, { color: '#2874f0', fontWeight: 'bold' }]}>Lender Suite</Text>
                            <Ionicons name="chevron-forward" size={20} color="#2874f0" style={{ marginLeft: 'auto' }} />
                          </TouchableOpacity>

                          <TouchableOpacity style={[styles.menuItem, styles.menuItemCta]} onPress={() => handleNav('ListProduct')}>
                            <Ionicons name="add-circle-outline" size={24} color="#2874f0" />
                            <Text style={[styles.menuItemText, { color: '#2874f0', fontWeight: 'bold' }]}>List a Product</Text>
                          </TouchableOpacity>
                        </>
                      ) : (
                        <TouchableOpacity style={[styles.menuItem, styles.menuItemCta]} onPress={() => handleNav('BecomeLender')}>
                          <Ionicons name="storefront-outline" size={24} color="#2874f0" />
                          <Text style={[styles.menuItemText, { color: '#2874f0', fontWeight: 'bold' }]}>Become a Lender</Text>
                        </TouchableOpacity>
                      )}


                    </>
                  ) : (
                    <>
                      <TouchableOpacity style={styles.menuItem} onPress={() => handleNav('Login')}>
                        <Ionicons name="log-in-outline" size={24} color="#0f172a" />
                        <Text style={styles.menuItemText}>Login</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={[styles.menuItem, styles.menuItemCta]} onPress={() => handleNavWithParams('Login', { redirectTo: 'BecomeLender' })}>
                        <Ionicons name="storefront-outline" size={24} color="#2874f0" />
                        <Text style={[styles.menuItemText, { color: '#2874f0', fontWeight: 'bold' }]}>Become a Lender</Text>
                      </TouchableOpacity>
                    </>
                  )}
                </>
              ) : (
                <>
                  {/* Lender Sub-Menu View */}
                  <TouchableOpacity 
                    style={[styles.menuItem, { marginBottom: 15, borderBottomWidth: 0 }]} 
                    onPress={() => setMenuView('main')}
                  >
                    <Ionicons name="arrow-back" size={24} color="#64748b" />
                    <Text style={[styles.menuItemText, { color: '#64748b' }]}>Back to Main Menu</Text>
                  </TouchableOpacity>

                  <View style={styles.menuDivider}><Text style={styles.menuDividerText}>LENDER SUITE OPTIONS</Text></View>
                  
                  <TouchableOpacity style={styles.menuItem} onPress={() => handleNav('LenderDashboard')}>
                    <Ionicons name="speedometer-outline" size={24} color="#0f172a" />
                    <Text style={styles.menuItemText}>Dashboard Overview</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity style={styles.menuItem} onPress={() => handleNav('LenderProducts')}>
                    <Ionicons name="albums-outline" size={24} color="#0f172a" />
                    <Text style={styles.menuItemText}>Asset Inventory</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity style={styles.menuItem} onPress={() => handleNav('LenderOrders')}>
                    <Ionicons name="clipboard-outline" size={24} color="#0f172a" />
                    <Text style={styles.menuItemText}>Rental Orders</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.menuItem} onPress={() => handleNav('LenderEarnings')}>
                    <Ionicons name="wallet-outline" size={24} color="#0f172a" />
                    <Text style={styles.menuItemText}>Earnings & Payouts</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.menuItem} onPress={() => handleNav('LenderCoupons')}>
                    <Ionicons name="ticket-outline" size={24} color="#0f172a" />
                    <Text style={styles.menuItemText}>Coupons</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.menuItem} onPress={() => handleNav('Maintenance')}>
                    <Ionicons name="construct-outline" size={24} color="#0f172a" />
                    <Text style={styles.menuItemText}>Maintenance</Text>
                  </TouchableOpacity>
                </>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    backgroundColor: '#ffffff',
    borderBottomWidth: 3,
    borderBottomColor: '#000000',

    paddingTop: Platform.OS === 'ios' ? 50 : 40,
    width: '100%',
    elevation: 3, // Add shadow for Android
    shadowColor: '#000', // Add shadow for iOS
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  separator: {
    height: 1.5,
    backgroundColor: '#f1f5f9',
    marginHorizontal: 15,
    marginBottom: 12,
  },

  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    height: 80,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuBtn: {
    marginRight: 12,
    padding: 6,
  },
  logo: {
    height: 48,
    width: 160,
  },

  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconWrapper: {
    marginRight: 15,
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -6,
    backgroundColor: '#ef4444',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  drawerBadge: {
    backgroundColor: '#ef4444',
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  btnLogin: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#1193d4',
  },
  btnLoginText: {
    color: '#1193d4',
    fontWeight: '700',
    fontSize: 15,
  },
  avatarWrapper: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#1193d4',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarFallback: {
    width: '100%',
    height: '100%',
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1193d4',
  },
  avatarText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 18,
  },
  mobileLocationBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  locationText: {
    fontSize: 14,
    color: '#0f172a',
    marginHorizontal: 8,
  },
  searchBarContainer: {
    paddingHorizontal: 20,
    paddingBottom: 15,
  },
  searchInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#1193d4',
    borderRadius: 8,
    height: 52,
    paddingLeft: 15,
    paddingRight: 6,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    fontSize: 15,
    color: '#0f172a',
    fontWeight: '500',
  },
  searchButton: {
    backgroundColor: '#1193d4',
    width: 42,
    height: 42,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    flexDirection: 'row',
  },
  modalCloseOverlay: {
    flex: 1,
  },
  menuDrawer: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: width * 0.85,
    maxWidth: 360,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 5, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
    paddingTop: Platform.OS === 'ios' ? 45 : 20,
  },
  menuHeader: {
    alignItems: 'flex-end',
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  closeBtn: {
    backgroundColor: 'rgba(40, 116, 240, 0.1)',
    borderRadius: 8,
    padding: 6,
  },
  menuContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  mobileUserCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
  },
  mobileAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#1193d4',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  mobileAvatarText: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
  },
  mobileUserInfo: {
    flex: 1,
  },
  mobileUserName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
  },
  mobileUserEmail: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 3,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  menuItemText: {
    fontSize: 16,
    color: '#0f172a',
    marginLeft: 15,
    fontWeight: '500',
  },
  menuItemCta: {
    marginTop: 10,
    backgroundColor: 'rgba(40, 116, 240, 0.05)',
    borderRadius: 8,
    paddingHorizontal: 15,
    borderBottomWidth: 0,
  },
  menuDivider: {
    marginTop: 25,
    marginBottom: 10,
    paddingHorizontal: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    paddingBottom: 5,
  },
  menuDividerText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#64748b',
    letterSpacing: 1,
  },
  logoutItem: {
    marginTop: 20,
    borderBottomWidth: 0,
  },
  locModalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end'
  },
  locModalContent: {
    backgroundColor: '#fff', height: height * 0.7, borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: 20
  },
  locModalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15
  },
  locModalTitle: {
    fontSize: 18, fontWeight: 'bold'
  },
  locSearchBox: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#f0f0f0', borderRadius: 8, height: 45, marginBottom: 15
  },
  locSearchInput: {
    flex: 1, marginLeft: 10, fontSize: 16
  },
  locGrid: {
    flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between'
  },
  locBtn: {
    width: '48%', backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 8, padding: 12, marginBottom: 10, alignItems: 'center'
  },
  locBtnActive: {
    borderColor: '#1193d4', backgroundColor: 'rgba(40, 116, 240, 0.1)'
  },
  locBtnTxt: {
    color: '#333'
  },
  locBtnTxtActive: {
    color: '#1193d4', fontWeight: 'bold'
  }
});

