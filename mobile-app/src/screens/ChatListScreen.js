import React, { useState, useEffect, useContext, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, ActivityIndicator, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../context/AuthContext';
import api from '../api/api';
import { Header } from '../components/Header';

export default function ChatListScreen({ navigation }) {
  const { token, user } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState('borrower'); // 'borrower' or 'lender'
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchRooms = useCallback(async (isRefresh = false) => {
    if (!token) return;
    try {
      if (!isRefresh) setLoading(true);
      const res = await api.get('/chat/rooms', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRooms(res.data || []);
    } catch (err) {
      console.error('Failed to fetch rooms:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token]);

  useEffect(() => {
    fetchRooms();
  }, [fetchRooms]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchRooms(true);
  };

  const filteredRooms = rooms.filter(room => room.my_role === activeTab);

  const renderRoomItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.roomItem}
      onPress={() => {
        navigation.navigate('ChatRoom', { roomId: item.id, otherName: item.other_first_name });
        // Locally clear unread count for better responsiveness
        setRooms(prev => prev.map(r => r.id === item.id ? { ...r, unread_count: 0 } : r));
      }}
    >
      <View style={styles.avatarContainer}>
        {item.other_avatar ? (
          <Image source={{ uri: item.other_avatar }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarFallback}>
            <Text style={styles.avatarText}>{item.other_first_name?.charAt(0).toUpperCase()}</Text>
          </View>
        )}
      </View>
      
      <View style={styles.roomInfo}>
        <View style={styles.roomHeader}>
          <Text style={styles.userName}>{item.other_first_name}</Text>
          <View style={styles.roleBadge}>
             <Text style={styles.roleBadgeText}>{item.my_role === 'lender' ? 'Borrower' : 'Lender'}</Text>
          </View>
        </View>
        
        {item.product_name && (
          <Text style={styles.productName} numberOfLines={1}>
            📦 {item.product_name}
          </Text>
        )}
        
        <Text style={styles.lastMessage} numberOfLines={1}>
          {item.last_message || 'No messages yet'}
        </Text>
      </View>

      {Number(item.unread_count) > 0 && (
        <View style={styles.unreadBadge}>
          <Text style={styles.unreadText}>{item.unread_count}</Text>
        </View>
      )}
      
      <Ionicons name="chevron-forward" size={20} color="#ccc" />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Header />
      
      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'borrower' && styles.activeTab]}
          onPress={() => setActiveTab('borrower')}
        >
          <Text style={[styles.tabText, activeTab === 'borrower' && styles.activeTabText]}>Buying / Renting</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'lender' && styles.activeTab]}
          onPress={() => setActiveTab('lender')}
        >
          <Text style={[styles.tabText, activeTab === 'lender' && styles.activeTabText]}>Selling / Lending</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#2874f0" />
        </View>
      ) : (
        <FlatList
          data={filteredRooms}
          keyExtractor={item => item.id.toString()}
          renderItem={renderRoomItem}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#2874f0']} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="chatbubbles-outline" size={64} color="#ccc" />
              <Text style={styles.emptyText}>
                No {activeTab === 'lender' ? 'lending' : 'renting'} conversations yet
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 4,
    margin: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 6,
  },
  activeTab: {
    backgroundColor: '#2874f0',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
  },
  activeTabText: {
    color: '#fff',
  },
  listContent: {
    paddingHorizontal: 15,
    paddingBottom: 20,
  },
  roomItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  avatarContainer: {
    marginRight: 15,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  avatarFallback: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#2874f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  roomInfo: {
    flex: 1,
  },
  roomHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0f172a',
    marginRight: 10,
  },
  roleBadge: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  roleBadgeText: {
    fontSize: 10,
    color: '#64748b',
    fontWeight: '600',
  },
  productName: {
    fontSize: 13,
    color: '#2874f0',
    marginBottom: 4,
  },
  lastMessage: {
    fontSize: 14,
    color: '#64748b',
  },
  unreadBadge: {
    backgroundColor: '#ef4444',
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 5,
    marginRight: 10,
  },
  unreadText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 60,
  },
  emptyText: {
    marginTop: 15,
    fontSize: 16,
    color: '#94a3b8',
    textAlign: 'center',
  }
});
