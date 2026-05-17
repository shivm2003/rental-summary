import React, { useState, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../context/AuthContext';
import api from '../api/api';
import Toast from 'react-native-toast-message';

export default function EditProfileScreen({ navigation }) {
  const { token, user } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState('profile');
  const [form, setForm] = useState({ firstName: '', lastName: '', phone: '' });
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [panNumber, setPanNumber] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchProfile(); }, []);

  const fetchProfile = async () => {
    try {
      const res = await api.get('/user/profile', { headers: { Authorization: `Bearer ${token}` } });
      setForm({
        firstName: res.data.first_name || '',
        lastName: res.data.last_name || '',
        phone: res.data.phone || ''
      });
      setPanNumber(res.data.pan_number || '');
    } catch (err) { console.error('Failed to fetch profile:', err); }
    finally { setLoading(false); }
  };

  const handleSave = async () => {
    if (!form.firstName.trim()) { Alert.alert('Error', 'First name is required'); return; }
    try {
      setSaving(true);
      await api.put('/user/profile', form, { headers: { Authorization: `Bearer ${token}` } });
      Toast.show({ type: 'success', text1: 'Profile Updated', text2: 'Your personal info has been saved.' });
      navigation.goBack();
    } catch (err) { Alert.alert('Error', 'Failed to update profile'); }
    finally { setSaving(false); }
  };

  const handlePasswordChange = async () => {
    const { currentPassword, newPassword, confirmPassword } = passwordForm;
    if (!currentPassword || !newPassword) { Alert.alert('Error', 'All fields are required'); return; }
    if (newPassword.length < 6) { Alert.alert('Error', 'New password must be at least 6 characters'); return; }
    if (newPassword !== confirmPassword) { Alert.alert('Error', 'Passwords do not match'); return; }
    try {
      setSaving(true);
      await api.put('/user/change-password', { currentPassword, newPassword }, { headers: { Authorization: `Bearer ${token}` } });
      Toast.show({ type: 'success', text1: 'Password Changed', text2: 'Your password has been updated.' });
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to change password');
    } finally { setSaving(false); }
  };

  const handleSavePAN = async () => {
    if (!panNumber.match(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/)) {
      Alert.alert('Error', 'Please enter a valid PAN number (e.g. ABCDE1234F)');
      return;
    }
    try {
      setSaving(true);
      await api.put('/user/profile', { panNumber }, { headers: { Authorization: `Bearer ${token}` } });
      Toast.show({ type: 'success', text1: 'PAN Saved', text2: 'Your PAN card information has been saved.' });
    } catch (err) { Alert.alert('Error', 'Failed to save PAN'); }
    finally { setSaving(false); }
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#2874f0" /></View>;

  const Tab = ({ id, label, icon }) => (
    <TouchableOpacity style={[styles.tab, activeTab === id && styles.tabActive]} onPress={() => setActiveTab(id)}>
      <Ionicons name={icon} size={18} color={activeTab === id ? '#2874f0' : '#94a3b8'} />
      <Text style={[styles.tabTxt, activeTab === id && styles.tabTxtActive]}>{label}</Text>
    </TouchableOpacity>
  );

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.tabBar}>
        <Tab id="profile" label="Personal" icon="person-outline" />
        <Tab id="password" label="Password" icon="lock-closed-outline" />
        <Tab id="pan" label="PAN Card" icon="card-outline" />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {activeTab === 'profile' && (
          <>
            <View style={styles.field}>
              <Text style={styles.label}>First Name *</Text>
              <TextInput style={styles.input} value={form.firstName} onChangeText={t => setForm({...form, firstName: t})} placeholder="Enter first name" />
            </View>
            <View style={styles.field}>
              <Text style={styles.label}>Last Name</Text>
              <TextInput style={styles.input} value={form.lastName} onChangeText={t => setForm({...form, lastName: t})} placeholder="Enter last name" />
            </View>
            <View style={styles.field}>
              <Text style={styles.label}>Mobile Number</Text>
              <TextInput style={styles.input} value={form.phone} onChangeText={t => setForm({...form, phone: t})} placeholder="Enter mobile number" keyboardType="phone-pad" />
            </View>
            <TouchableOpacity style={[styles.saveBtn, saving && styles.saveBtnDisabled]} onPress={handleSave} disabled={saving}>
              {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Save Changes</Text>}
            </TouchableOpacity>
          </>
        )}

        {activeTab === 'password' && (
          <>
            <View style={styles.infoBox}>
              <Ionicons name="information-circle" size={18} color="#0369a1" />
              <Text style={styles.infoTxt}>Password must be at least 6 characters.</Text>
            </View>
            <View style={styles.field}>
              <Text style={styles.label}>Current Password *</Text>
              <TextInput style={styles.input} secureTextEntry value={passwordForm.currentPassword} onChangeText={t => setPasswordForm({...passwordForm, currentPassword: t})} placeholder="Enter current password" />
            </View>
            <View style={styles.field}>
              <Text style={styles.label}>New Password *</Text>
              <TextInput style={styles.input} secureTextEntry value={passwordForm.newPassword} onChangeText={t => setPasswordForm({...passwordForm, newPassword: t})} placeholder="Enter new password" />
            </View>
            <View style={styles.field}>
              <Text style={styles.label}>Confirm New Password *</Text>
              <TextInput style={styles.input} secureTextEntry value={passwordForm.confirmPassword} onChangeText={t => setPasswordForm({...passwordForm, confirmPassword: t})} placeholder="Re-enter new password" />
            </View>
            <TouchableOpacity style={[styles.saveBtn, saving && styles.saveBtnDisabled]} onPress={handlePasswordChange} disabled={saving}>
              {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Change Password</Text>}
            </TouchableOpacity>
          </>
        )}

        {activeTab === 'pan' && (
          <>
            <View style={styles.infoBox}>
              <Ionicons name="shield-checkmark" size={18} color="#0369a1" />
              <Text style={styles.infoTxt}>PAN is required for payouts above ₹50,000 per financial year.</Text>
            </View>
            <View style={styles.field}>
              <Text style={styles.label}>PAN Card Number</Text>
              <TextInput style={styles.input} value={panNumber} onChangeText={t => setPanNumber(t.toUpperCase())} placeholder="ABCDE1234F" autoCapitalize="characters" maxLength={10} />
            </View>
            <TouchableOpacity style={[styles.saveBtn, saving && styles.saveBtnDisabled]} onPress={handleSavePAN} disabled={saving}>
              {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Save PAN Info</Text>}
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: { paddingTop: 50, paddingBottom: 15, paddingHorizontal: 20, backgroundColor: '#fff', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  headerTitle: { fontSize: 18, fontWeight: 'bold' },
  tabBar: { flexDirection: 'row', backgroundColor: '#fff', paddingHorizontal: 10, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 14 },
  tabActive: { borderBottomWidth: 2, borderBottomColor: '#2874f0' },
  tabTxt: { fontSize: 13, color: '#94a3b8', fontWeight: '500' },
  tabTxtActive: { color: '#2874f0', fontWeight: 'bold' },
  content: { padding: 25 },
  field: { marginBottom: 20 },
  label: { fontSize: 14, color: '#64748b', marginBottom: 8, fontWeight: '500' },
  input: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 10, padding: 14, fontSize: 15, color: '#0f172a' },
  saveBtn: { backgroundColor: '#2874f0', padding: 16, borderRadius: 10, alignItems: 'center', marginTop: 20, elevation: 4 },
  saveBtnDisabled: { backgroundColor: '#94a3b8' },
  saveBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  infoBox: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#e0f2fe', padding: 12, borderRadius: 8, marginBottom: 20 },
  infoTxt: { fontSize: 13, color: '#0369a1', flex: 1 }
});
