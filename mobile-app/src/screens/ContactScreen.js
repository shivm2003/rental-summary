import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function ContactScreen({ navigation }) {
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!form.message.trim()) {
      Alert.alert('Error', 'Please enter a message');
      return;
    }
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      Alert.alert('Sent', 'Your message has been received. We will get back to you soon!', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    }, 1500);
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Contact Us / Support</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.infoRow}>
          <Ionicons name="mail-outline" size={20} color="#2874f0" />
          <Text style={styles.infoText}>support@everythingrental.in</Text>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="call-outline" size={20} color="#2874f0" />
          <Text style={styles.infoText}>+91 99999 88888</Text>
        </View>

        <View style={styles.divider} />

        <Text style={styles.label}>Name</Text>
        <TextInput 
          style={styles.input} 
          value={form.name} 
          onChangeText={t => setForm({...form, name: t})} 
          placeholder="Your full name"
        />

        <Text style={styles.label}>Email</Text>
        <TextInput 
          style={styles.input} 
          value={form.email} 
          onChangeText={t => setForm({...form, email: t})} 
          placeholder="your@email.com"
          keyboardType="email-address"
        />

        <Text style={styles.label}>Message</Text>
        <TextInput 
          style={[styles.input, styles.textArea]} 
          value={form.message} 
          onChangeText={t => setForm({...form, message: t})} 
          placeholder="How can we help you?"
          multiline
          numberOfLines={6}
        />

        <TouchableOpacity 
          style={styles.submitBtn} 
          onPress={handleSubmit} 
          disabled={loading}
        >
          <Text style={styles.submitBtnText}>{loading ? 'Sending...' : 'SUBMIT MESSAGE'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    paddingTop: 50, paddingBottom: 15, paddingHorizontal: 20,
    backgroundColor: '#fff', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderBottomWidth: 1, borderBottomColor: '#f1f5f9'
  },
  headerTitle: { fontSize: 18, fontWeight: 'bold' },
  content: { padding: 25 },
  infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  infoText: { marginLeft: 12, fontSize: 15, color: '#334155' },
  divider: { height: 1, backgroundColor: '#f1f5f9', marginVertical: 20 },
  label: { fontSize: 14, fontWeight: '600', color: '#64748b', marginBottom: 8 },
  input: {
    borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 8, padding: 12, marginBottom: 20, fontSize: 16
  },
  textArea: { height: 120, textAlignVertical: 'top' },
  submitBtn: {
    backgroundColor: '#2874f0', padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 10
  },
  submitBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 }
});
