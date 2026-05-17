import React, { useState, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../context/AuthContext';
import api from '../api/api';

export default function LenderNotificationsScreen({ navigation }) {
  const { token } = useContext(AuthContext);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchNotifications(); }, []);

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications', { headers: { Authorization: `Bearer ${token}` } });
      setNotifications(res.data || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const markAsRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`, {}, { headers: { Authorization: `Bearer ${token}` } });
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    } catch {}
  };

  const markAllAsRead = async () => {
    try {
      await api.put('/notifications/read-all', {}, { headers: { Authorization: `Bearer ${token}` } });
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch {}
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const renderItem = ({ item }) => (
    <View style={[styles.card, !item.is_read && styles.unread]}>
      <View style={[styles.iconBox, { backgroundColor: item.is_read ? '#f1f5f9' : '#e0f2fe' }]}>
        <Ionicons name="notifications" size={18} color={item.is_read ? '#94a3b8' : '#0ea5e9'} />
      </View>
      <View style={styles.content}>
        <Text style={[styles.title, !item.is_read && { fontWeight: 'bold' }]}>{item.title}</Text>
        <Text style={styles.message} numberOfLines={2}>{item.message}</Text>
        <Text style={styles.time}>{new Date(item.created_at).toLocaleString()}</Text>
      </View>
      {!item.is_read && (
        <TouchableOpacity style={styles.readBtn} onPress={() => markAsRead(item.id)}>
          <Ionicons name="checkmark" size={18} color="#0ea5e9" />
        </TouchableOpacity>
      )}
    </View>
  );

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#2874f0" /></View>;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        {unreadCount > 0 && (
          <TouchableOpacity onPress={markAllAsRead}>
            <Text style={styles.markAll}>Read All</Text>
          </TouchableOpacity>
        )}
        {unreadCount === 0 && <View style={{ width: 50 }} />}
      </View>

      {unreadCount > 0 && (
        <View style={styles.banner}>
          <Text style={styles.bannerTxt}>You have {unreadCount} unread notification{unreadCount > 1 ? 's' : ''}</Text>
        </View>
      )}

      <FlatList
        data={notifications}
        keyExtractor={item => String(item.id)}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="notifications-off-outline" size={48} color="#cbd5e1" />
            <Text style={styles.emptyTxt}>No notifications yet</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: { paddingTop: 50, paddingBottom: 15, paddingHorizontal: 20, backgroundColor: '#fff', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  headerTitle: { fontSize: 18, fontWeight: 'bold' },
  markAll: { color: '#0ea5e9', fontWeight: 'bold', fontSize: 13 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  banner: { backgroundColor: '#e0f2fe', padding: 10, alignItems: 'center' },
  bannerTxt: { fontSize: 13, color: '#0369a1', fontWeight: '500' },
  list: { padding: 15 },
  card: { flexDirection: 'row', backgroundColor: '#fff', padding: 15, borderRadius: 12, marginBottom: 10, alignItems: 'flex-start', borderWidth: 1, borderColor: '#f1f5f9' },
  unread: { backgroundColor: '#f8fafc', borderColor: '#e0f2fe' },
  iconBox: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  content: { flex: 1 },
  title: { fontSize: 14, color: '#0f172a', marginBottom: 4 },
  message: { fontSize: 13, color: '#475569', lineHeight: 18 },
  time: { fontSize: 11, color: '#94a3b8', marginTop: 6 },
  readBtn: { padding: 8 },
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyTxt: { fontSize: 15, color: '#94a3b8', marginTop: 12 }
});
