import React from 'react';
import { View, Text, StyleSheet, ScrollView, Image, Dimensions, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Header } from '../components/Header';

const { width } = Dimensions.get('window');

export default function AboutUsScreen() {
  return (
    <View style={styles.container}>
      <Header />
      
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.banner}>
          <Image 
            source={{ uri: 'https://images.unsplash.com/photo-1521737711867-e3b97375f902?q=80&w=1000' }} 
            style={styles.bannerImg}
          />
          <View style={styles.bannerOverlay}>
            <Text style={styles.bannerTitle}>About EveryThing Rental</Text>
            <Text style={styles.bannerSub}>Empowering circular economy through seamless rentals.</Text>
          </View>
        </View>

        <View style={styles.content}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Our Journey</Text>
            <Text style={styles.text}>
              Started with a vision to make high-quality products accessible to everyone without the burden of ownership, EveryThing Rental has grown into India's most trusted rental marketplace. We believe in "Rent, Use, Return" to reduce waste and promote sustainability.
            </Text>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statNum}>10K+</Text>
              <Text style={styles.statLabel}>Products</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNum}>50K+</Text>
              <Text style={styles.statLabel}>Happy Users</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNum}>100+</Text>
              <Text style={styles.statLabel}>Cities</Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Why Choose Us?</Text>
            
            <View style={styles.featureItem}>
              <View style={styles.featureIcon}>
                <Ionicons name="shield-checkmark" size={24} color="#2874f0" />
              </View>
              <View style={styles.featureText}>
                <Text style={styles.featureTitle}>Verified Products</Text>
                <Text style={styles.featureDesc}>Every item is inspected for quality and functionality before it reaches you.</Text>
              </View>
            </View>

            <View style={styles.featureItem}>
              <View style={styles.featureIcon}>
                <Ionicons name="flash" size={24} color="#2874f0" />
              </View>
              <View style={styles.featureText}>
                <Text style={styles.featureTitle}>Instant Delivery</Text>
                <Text style={styles.featureDesc}>Get your rentals delivered to your doorstep within 24 hours.</Text>
              </View>
            </View>

            <View style={styles.featureItem}>
              <View style={styles.featureIcon}>
                <Ionicons name="wallet" size={24} color="#2874f0" />
              </View>
              <View style={styles.featureText}>
                <Text style={styles.featureTitle}>Affordable Pricing</Text>
                <Text style={styles.featureDesc}>Rent high-end items at a fraction of their market price.</Text>
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Our Vision</Text>
            <Text style={styles.text}>
              To redefine consumption patterns by making renting as easy as buying, while fostering a community of shared resources and environmental responsibility.
            </Text>
          </View>
        </View>

        <View style={styles.footerInfo}>
          <Text style={styles.footerText}>© 2026 EveryThing Rental. All Rights Reserved.</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  banner: { height: 200, position: 'relative' },
  bannerImg: { width: '100%', height: '100%' },
  bannerOverlay: { 
    position: 'absolute', 
    top: 0, left: 0, right: 0, bottom: 0, 
    backgroundColor: 'rgba(0,0,0,0.5)', 
    justifyContent: 'center', 
    alignItems: 'center',
    padding: 20
  },
  bannerTitle: { fontSize: 24, fontWeight: 'bold', color: '#fff', textAlign: 'center' },
  bannerSub: { fontSize: 14, color: 'rgba(255,255,255,0.8)', textAlign: 'center', marginTop: 10 },
  content: { padding: 20 },
  section: { marginBottom: 30 },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', color: '#1a1a1a', marginBottom: 12 },
  text: { fontSize: 15, color: '#4b5563', lineHeight: 24 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 30, backgroundColor: '#f8fafc', padding: 20, borderRadius: 12 },
  statItem: { alignItems: 'center' },
  statNum: { fontSize: 20, fontWeight: 'bold', color: '#2874f0' },
  statLabel: { fontSize: 12, color: '#64748b', marginTop: 4 },
  featureItem: { flexDirection: 'row', marginBottom: 20 },
  featureIcon: { width: 48, height: 48, backgroundColor: '#eff6ff', borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  featureText: { flex: 1 },
  featureTitle: { fontSize: 16, fontWeight: 'bold', color: '#1a1a1a', marginBottom: 4 },
  featureDesc: { fontSize: 14, color: '#64748b', lineHeight: 20 },
  footerInfo: { padding: 30, backgroundColor: '#f9fafb', alignItems: 'center' },
  footerText: { fontSize: 12, color: '#9ca3af' }
});
