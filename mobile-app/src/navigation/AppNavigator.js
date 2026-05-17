import React, { useContext } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, ActivityIndicator } from 'react-native';
import { AuthContext } from '../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { useCart } from '../context/CartContext';

// Core screens
import LoginScreen from '../screens/LoginScreen';
import HomeScreen from '../screens/HomeScreen';
import ProductDetailsScreen from '../screens/ProductDetailsScreen';
import CartScreen from '../screens/CartScreen';
import CheckoutScreen from '../screens/CheckoutScreen';
import OrdersScreen from '../screens/OrdersScreen';
import ProfileScreen from '../screens/ProfileScreen';
import RegisterScreen from '../screens/RegisterScreen';
import ForgotPasswordScreen from '../screens/ForgotPasswordScreen';
import SearchResultsScreen from '../screens/SearchResultsScreen';

// Product & Category
import AllCategoriesScreen from '../screens/AllCategoriesScreen';
import CategoryPageScreen from '../screens/CategoryPageScreen';

// User features
import OrderDetailsScreen from '../screens/OrderDetailsScreen';
import WishlistScreen from '../screens/WishlistScreen';
import ChatListScreen from '../screens/ChatListScreen';
import ChatRoomScreen from '../screens/ChatRoomScreen';
import AddressBookScreen from '../screens/AddressBookScreen';
import EditProfileScreen from '../screens/EditProfileScreen';

// Lender screens
import BecomeLenderScreen from '../screens/BecomeLenderScreen';
import KYCUploadScreen from '../screens/KYCUploadScreen';
import ListProductScreen from '../screens/ListProductScreen';
import EditProductScreen from '../screens/EditProductScreen';
import LenderProductsScreen from '../screens/LenderProductsScreen';
import LenderOrdersScreen from '../screens/LenderOrdersScreen';
import LenderDashboardScreen from '../screens/LenderDashboardScreen';
import LenderEarningsScreen from '../screens/LenderEarningsScreen';
import LenderAnalyticsScreen from '../screens/LenderAnalyticsScreen';
import LenderNotificationsScreen from '../screens/LenderNotificationsScreen';
import LenderCouponsScreen from '../screens/LenderCouponsScreen';
import MaintenanceScreen from '../screens/MaintenanceScreen';

// Info pages
import InfoScreen from '../screens/InfoScreen';
import ContactScreen from '../screens/ContactScreen';
import CareersScreen from '../screens/CareersScreen';
import AboutUsScreen from '../screens/AboutUsScreen';


const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabs() {
  const { getCartCount } = useCart();
  const cartCount = getCartCount();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === 'HomeTab') iconName = focused ? 'home' : 'home-outline';
          else if (route.name === 'CategoriesTab') iconName = focused ? 'grid' : 'grid-outline';
          else if (route.name === 'CartTab') iconName = focused ? 'cart' : 'cart-outline';
          else if (route.name === 'Orders') iconName = focused ? 'cube' : 'cube-outline';
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#2874f0',
        tabBarInactiveTintColor: 'gray',
        tabBarStyle: { height: 60, paddingBottom: 5 }
      })}
    >
      <Tab.Screen name="HomeTab" component={HomeScreen} options={{ title: 'Home' }} />
      <Tab.Screen name="CategoriesTab" component={AllCategoriesScreen} options={{ title: 'Categories' }} />
      <Tab.Screen name="CartTab" component={CartScreen} options={{ title: 'Cart', tabBarBadge: cartCount > 0 ? cartCount : null }} />
      <Tab.Screen name="Orders" component={OrdersScreen} options={{ title: 'My Orders' }} />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const { user, loading } = useContext(AuthContext);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {user ? (
          <Stack.Group>
            <Stack.Screen name="Main" component={MainTabs} />
            <Stack.Screen name="ProductDetails" component={ProductDetailsScreen} />
            <Stack.Screen name="Cart" component={CartScreen} />
            <Stack.Screen name="SearchResults" component={SearchResultsScreen} />
            <Stack.Screen name="AllCategories" component={AllCategoriesScreen} />
            <Stack.Screen name="CategoryPage" component={CategoryPageScreen} />
            <Stack.Screen name="Wishlist" component={WishlistScreen} />
            <Stack.Screen name="AboutUs" component={AboutUsScreen} />
            <Stack.Screen name="Info" component={InfoScreen} />

            <Stack.Screen name="Contact" component={ContactScreen} />
            <Stack.Screen name="Careers" component={CareersScreen} />
            <Stack.Screen name="Checkout" component={CheckoutScreen} />
            <Stack.Screen name="OrderDetails" component={OrderDetailsScreen} />
            <Stack.Screen name="Chat" component={ChatListScreen} />
            <Stack.Screen name="ChatRoom" component={ChatRoomScreen} />
            <Stack.Screen name="AddressBook" component={AddressBookScreen} />
            <Stack.Screen name="EditProfile" component={EditProfileScreen} />
            <Stack.Screen name="BecomeLender" component={BecomeLenderScreen} />
            <Stack.Screen name="KYCUpload" component={KYCUploadScreen} />
            <Stack.Screen name="ListProduct" component={ListProductScreen} />
            <Stack.Screen name="EditProduct" component={EditProductScreen} />
            <Stack.Screen name="LenderProducts" component={LenderProductsScreen} />
            <Stack.Screen name="LenderOrders" component={LenderOrdersScreen} />
            <Stack.Screen name="LenderDashboard" component={LenderDashboardScreen} />
            <Stack.Screen name="LenderEarnings" component={LenderEarningsScreen} />
            <Stack.Screen name="LenderAnalytics" component={LenderAnalyticsScreen} />
            <Stack.Screen name="LenderNotifications" component={LenderNotificationsScreen} />
            <Stack.Screen name="LenderCoupons" component={LenderCouponsScreen} />
            <Stack.Screen name="Maintenance" component={MaintenanceScreen} />
            <Stack.Screen name="Profile" component={ProfileScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
            <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
            <Stack.Screen name="Login" component={LoginScreen} />
          </Stack.Group>

        ) : (
          <Stack.Group>
            <Stack.Screen name="Main" component={MainTabs} />
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
            <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
            <Stack.Screen name="ProductDetails" component={ProductDetailsScreen} />
            <Stack.Screen name="Cart" component={CartScreen} />
            <Stack.Screen name="SearchResults" component={SearchResultsScreen} />
            <Stack.Screen name="AllCategories" component={AllCategoriesScreen} />
            <Stack.Screen name="CategoryPage" component={CategoryPageScreen} />
            <Stack.Screen name="Wishlist" component={WishlistScreen} />
            <Stack.Screen name="Info" component={InfoScreen} />
            <Stack.Screen name="Contact" component={ContactScreen} />
            <Stack.Screen name="Careers" component={CareersScreen} />
            <Stack.Screen name="AboutUs" component={AboutUsScreen} />
          </Stack.Group>

        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
