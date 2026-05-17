import React, { useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { AuthContext } from '../context/AuthContext';

export default function Footer() {
  const navigation = useNavigation();
  const { user } = useContext(AuthContext);

  return (
    <View style={styles.footerContainer}>
      
      {/* Brand & Info */}
      <View style={styles.section}>
        <Text style={styles.brandTitle}>EveryThing Rental</Text>
        <Text style={styles.brandDesc}>
          Your premium destination for renting everything you need. Experience quality, affordability, and seamless rentals globally.
        </Text>
        
        <View style={styles.contactItem}>
          <Ionicons name="call" size={16} color="#666" style={styles.iconMargin} />
          <Text style={styles.contactText}>+91 9198496753</Text>
        </View>
        <View style={styles.contactItem}>
          <Ionicons name="mail" size={16} color="#666" style={styles.iconMargin} />
          <Text style={styles.contactText} onPress={() => Linking.openURL('mailto:shivam@everythingrental.in')}>shivam@everythingrental.in</Text>
        </View>
        <View style={styles.contactItem}>
          <Ionicons name="location" size={16} color="#666" style={styles.iconMargin} />
          <Text style={styles.contactText}>Gurgaon, India</Text>
        </View>
      </View>

      {/* Quick Links */}
      <View style={styles.section}>
        <Text style={styles.heading}>Quick Links</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Main', { screen: 'HomeTab' })}><Text style={styles.linkText}>Home</Text></TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate('AboutUs')}><Text style={styles.linkText}>About Us</Text></TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate('AllCategories')}><Text style={styles.linkText}>All Categories</Text></TouchableOpacity>
        
        {user ? (
          <>
            <TouchableOpacity onPress={() => navigation.navigate('BecomeLender')}><Text style={styles.linkText}>Become a Lender</Text></TouchableOpacity>
            <TouchableOpacity onPress={() => navigation.navigate('Profile')}><Text style={styles.linkText}>My Profile</Text></TouchableOpacity>
          </>
        ) : (
          <>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}><Text style={styles.linkText}>Become a Lender</Text></TouchableOpacity>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}><Text style={styles.linkText}>Login / Register</Text></TouchableOpacity>
          </>
        )}
      </View>

      {/* Help & Support */}
      <View style={styles.section}>
        <Text style={styles.heading}>Help & Support</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Main', { screen: 'CartTab' })}><Text style={styles.linkText}>Shopping Cart</Text></TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate('Info', { type: 'faq' })}><Text style={styles.linkText}>FAQ</Text></TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate('Info', { type: 'terms' })}><Text style={styles.linkText}>Terms & Conditions</Text></TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate('Contact')}><Text style={styles.linkText}>Contact Us</Text></TouchableOpacity>
      </View>


      {/* Newsletter / Social */}
      <View style={[styles.section, { borderBottomWidth: 0 }]}>
        <Text style={styles.heading}>Newsletter</Text>
        <Text style={styles.newsletterText}>Subscribe for new listings and special offers.</Text>
        <View style={styles.socialRow}>
          <TouchableOpacity style={styles.socialIcon}><Ionicons name="logo-facebook" size={24} color="#333" /></TouchableOpacity>
          <TouchableOpacity style={styles.socialIcon}><Ionicons name="logo-twitter" size={24} color="#333" /></TouchableOpacity>
          <TouchableOpacity style={styles.socialIcon}><Ionicons name="logo-instagram" size={24} color="#333" /></TouchableOpacity>
          <TouchableOpacity style={styles.socialIcon}><Ionicons name="logo-youtube" size={24} color="#333" /></TouchableOpacity>
        </View>
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  footerContainer: {
    backgroundColor: '#0d1117',
    borderTopWidth: 1,
    borderTopColor: '#30363d',
    padding: 24,
    marginTop: 20,
  },
  section: {
    marginBottom: 24,
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#161b22',
  },
  brandTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#38bdf8', // matches --primary-light or PWA brand
    marginBottom: 12,
  },
  brandDesc: {
    fontSize: 14,
    color: '#8b949e',
    lineHeight: 22,
    marginBottom: 20,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconMargin: {
    marginRight: 12,
    width: 20,
  },
  contactText: {
    fontSize: 14,
    color: '#c9d1d9',
  },
  heading: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: '#30363d',
    paddingBottom: 4,
    alignSelf: 'flex-start',
  },
  linkText: {
    fontSize: 15,
    color: '#8b949e',
    marginBottom: 14,
  },
  newsletterText: {
    fontSize: 14,
    color: '#8b949e',
    marginBottom: 18,
    lineHeight: 22,
  },
  socialRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  socialIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#21262d',
    justifyContent: 'center',
    alignItems: 'center',
  }
});
