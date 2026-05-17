import React, { useEffect, useState, useContext } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, TextInput, Alert, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../context/AuthContext';
import api from '../api/api';
import { Header } from '../components/Header';

export default function ProfileScreen({ navigation }) {
  const { user, token, logout } = useContext(AuthContext);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Tabs: 'overview', 'edit', 'addresses'
  const [activeTab, setActiveTab] = useState('overview');

  // Edit form
  const [form, setForm] = useState({ firstName: '', lastName: '', phone: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, [user, token]);

  const fetchProfile = async () => {
    if (!token) { setLoading(false); return; }
    try {
      const res = await api.get('/user/profile', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProfile(res.data);
      setForm({
        firstName: res.data.first_name || '',
        lastName: res.data.last_name || '',
        phone: res.data.phone || ''
      });
    } catch (e) {
      console.error("Profile fetch error", e);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      await api.put('/user/profile', form, {
        headers: { Authorization: `Bearer ${token}` }
      });
      Alert.alert("Success", "Profile updated successfully");
      fetchProfile();
      setActiveTab('overview');
    } catch (e) {
      Alert.alert("Error", e.response?.data?.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      "Logout", 
      "Are you sure you want to log out?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Log Out", style: "destructive", onPress: async () => {
           await logout();
           navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
        }}
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.centerItem}>
        <ActivityIndicator size="large" color="#1193d4" />
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.centerItem}>
        <Ionicons name="person-circle-outline" size={60} color="#ccc" />
        <Text style={styles.emptyText}>Please login to view your profile.</Text>
        <TouchableOpacity style={styles.btnPrimary} onPress={() => navigation.navigate('Login')}>
          <Text style={styles.btnPrimaryTxt}>Login</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const avatarLetter = (profile?.first_name?.[0] || profile?.username?.[0] || 'U').toUpperCase();

  return (
    <View style={styles.container}>
      <Header showBack={true} />
      <View style={{ backgroundColor: '#fff', padding: 15, borderBottomWidth: 1, borderBottomColor: '#eee' }}>
         <Text style={{ fontSize: 20, fontWeight: 'bold' }}>My Account</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {/* User Card */}
        <View style={styles.userCard}>
          <View style={styles.avatarWrap}>
            <Text style={styles.avatarTxt}>{avatarLetter}</Text>
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{profile?.first_name} {profile?.last_name}</Text>
            <Text style={styles.userEmail}>{profile?.email}</Text>
          </View>
        </View>

        {activeTab === 'overview' && (
          <View>
            <View style={styles.menuGroup}>
              <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('EditProfile')}>
                <Ionicons name="person-outline" size={22} color="#2874f0" />
                <Text style={styles.menuItemTxt}>Edit Personal Info</Text>
                <Ionicons name="chevron-forward" size={20} color="#ccc" />
              </TouchableOpacity>
              <View style={styles.divider} />

              <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('AddressBook')}>
                <Ionicons name="location-outline" size={22} color="#2874f0" />
                <Text style={styles.menuItemTxt}>Address Book</Text>
                <Ionicons name="chevron-forward" size={20} color="#ccc" />
              </TouchableOpacity>
              <View style={styles.divider} />
              
              <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('Main', { screen: 'Orders' })}>
                <Ionicons name="cube-outline" size={22} color="#2874f0" />
                <Text style={styles.menuItemTxt}>My Orders</Text>
                <Ionicons name="chevron-forward" size={20} color="#ccc" />
              </TouchableOpacity>
              <View style={styles.divider} />

              <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('Chat')}>
                <Ionicons name="chatbubbles-outline" size={22} color="#2874f0" />
                <Text style={styles.menuItemTxt}>Messages</Text>
                <Ionicons name="chevron-forward" size={20} color="#ccc" />
              </TouchableOpacity>
              <View style={styles.divider} />

              <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('Contact')}>
                <Ionicons name="help-buoy-outline" size={22} color="#2874f0" />
                <Text style={styles.menuItemTxt}>Help & Support</Text>
                <Ionicons name="chevron-forward" size={20} color="#ccc" />
              </TouchableOpacity>
              <View style={styles.divider} />

              <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('Info', { type: 'FAQ' })}>
                <Ionicons name="information-circle-outline" size={22} color="#2874f0" />
                <Text style={styles.menuItemTxt}>FAQ</Text>
                <Ionicons name="chevron-forward" size={20} color="#ccc" />
              </TouchableOpacity>
              <View style={styles.divider} />

              <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('Wishlist')}>
                <Ionicons name="heart-outline" size={22} color="#2874f0" />
                <Text style={styles.menuItemTxt}>My Wishlist</Text>
                <Ionicons name="chevron-forward" size={20} color="#ccc" />
              </TouchableOpacity>
              <View style={styles.divider} />

              <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('Careers')}>
                <Ionicons name="briefcase-outline" size={22} color="#2874f0" />
                <Text style={styles.menuItemTxt}>Careers</Text>
                <Ionicons name="chevron-forward" size={20} color="#ccc" />
              </TouchableOpacity>
              <View style={styles.divider} />

              {user?.lender && (
                <>
                  <Text style={styles.sectionHeaderLabel}>LENDER DASHBOARD</Text>

                  <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('LenderDashboard')}>
                    <Ionicons name="speedometer-outline" size={22} color="#10b981" />
                    <Text style={styles.menuItemTxt}>Dashboard Overview</Text>
                    <Ionicons name="chevron-forward" size={20} color="#ccc" />
                  </TouchableOpacity>
                  <View style={styles.divider} />
                </>
              )}

              <TouchableOpacity style={styles.menuItem} onPress={handleLogout}>
                <Ionicons name="log-out-outline" size={22} color="#ef4444" />
                <Text style={[styles.menuItemTxt, { color: '#ef4444' }]}>Log Out</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f1f3f6' },
  centerItem: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  header: {
    backgroundColor: '#fff',
    height: 60,
    justifyContent: 'center',
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#212121' },
  scrollContent: { padding: 15 },
  emptyText: { marginTop: 15, fontSize: 16, color: '#666' },

  userCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    elevation: 2
  },
  avatarWrap: {
    width: 60, height: 60, borderRadius: 30, backgroundColor: '#e0e7ff',
    justifyContent: 'center', alignItems: 'center', marginRight: 15
  },
  avatarTxt: { fontSize: 24, fontWeight: 'bold', color: '#3730a3' },
  userInfo: { flex: 1 },
  userName: { fontSize: 18, fontWeight: 'bold', color: '#212121', marginBottom: 4 },
  userEmail: { fontSize: 13, color: '#878787' },

  menuGroup: {
    backgroundColor: '#fff',
    marginTop: 10,
    paddingVertical: 5,
  },
  sectionHeaderLabel: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#94a3b8',
    paddingHorizontal: 20,
    marginTop: 20,
    marginBottom: 10,
    letterSpacing: 1,
  },
  menuItem: {
    flexDirection: 'row', alignItems: 'center', padding: 16
  },
  menuItemTxt: { flex: 1, marginLeft: 15, fontSize: 16, color: '#212121' },
  divider: { height: 1, backgroundColor: '#f0f0f0', marginHorizontal: 16 },

  editSection: {
     backgroundColor: '#fff', borderRadius: 8, padding: 20, elevation: 1
  },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 20, color: '#212121' },
  inputLabel: { fontSize: 13, color: '#878787', marginBottom: 6 },
  input: {
    borderWidth: 1, borderColor: '#e0e0e0', borderRadius: 6, padding: 12, marginBottom: 15, fontSize: 15
  },

  btnPrimary: { backgroundColor: '#1193d4', padding: 14, borderRadius: 6, alignItems: 'center' },
  btnPrimaryTxt: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
  btnSecondary: { padding: 14, marginTop: 10, alignItems: 'center' },
  btnSecondaryTxt: { color: '#1193d4', fontWeight: 'bold', fontSize: 15 }
});
