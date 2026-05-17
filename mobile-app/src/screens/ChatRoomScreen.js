import React, { useState, useEffect, useRef, useContext } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import api from '../api/api';

export default function ChatRoomScreen({ route, navigation }) {
  const { roomId, otherName } = route.params;
  const { user, token } = useContext(AuthContext);
  const { socket, markRoomAsRead } = useSocket();
  const [messages, setMessages] = useState([]);

  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [typingUser, setTypingUser] = useState(null);
  const flatListRef = useRef(null);
  const typingTimeout = useRef(null);

  useEffect(() => {
    fetchMessages();
    if (markRoomAsRead) markRoomAsRead(roomId);

    // Socket.io real-time listeners
    if (socket) {
      socket.emit('join_room', roomId);

      socket.on('new_message', (message) => {
        if (message.room_id === roomId || message.roomId === roomId) {
          setMessages(prev => [...prev, message]);
          setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
        }
      });

      socket.on('user_typing', ({ userId, name }) => {
        if (userId !== user.id) {
          setTypingUser(name);
          clearTimeout(typingTimeout.current);
          typingTimeout.current = setTimeout(() => setTypingUser(null), 2000);
        }
      });

      return () => {
        socket.off('new_message');
        socket.off('user_typing');
        socket.emit('leave_room', roomId);
      };
    } else {
      // Fallback polling if no socket
      const interval = setInterval(fetchMessages, 5000);
      return () => clearInterval(interval);
    }
  }, [roomId, socket]);

  const fetchMessages = async () => {
    try {
      const res = await api.get(`/chat/rooms/${roomId}/messages`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessages(res.data || []);
    } catch (err) {
      console.error('Failed to fetch messages:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || sending) return;

    const optimisticMsg = {
      id: `temp-${Date.now()}`,
      content: newMessage,
      sender_id: user.id,
      created_at: new Date().toISOString(),
      room_id: roomId
    };

    // Optimistic update
    setMessages(prev => [...prev, optimisticMsg]);
    setNewMessage('');
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);

    try {
      setSending(true);
      const res = await api.post(`/chat/rooms/${roomId}/messages`,
        { content: optimisticMsg.content },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      // Replace optimistic with server response
      setMessages(prev => prev.map(m => m.id === optimisticMsg.id ? res.data : m));

      // Emit via socket for real-time delivery
      if (socket) {
        socket.emit('send_message', { roomId, message: res.data });
      }
    } catch (err) {
      console.error('Failed to send message:', err);
      // Remove optimistic on failure
      setMessages(prev => prev.filter(m => m.id !== optimisticMsg.id));
      setNewMessage(optimisticMsg.content);
    } finally {
      setSending(false);
    }
  };

  const handleTyping = () => {
    if (socket) {
      socket.emit('typing', { roomId, userId: user.id, name: user.firstName || user.username });
    }
  };

  const renderMessage = ({ item }) => {
    const isMine = item.sender_id === user.id;
    return (
      <View style={[styles.messageWrapper, isMine ? styles.myMessageWrapper : styles.theirMessageWrapper]}>
        <View style={[styles.bubble, isMine ? styles.myBubble : styles.theirBubble]}>
          <Text style={[styles.messageText, isMine ? styles.myMessageText : styles.theirMessageText]}>
            {item.content}
          </Text>
          <Text style={[styles.timeText, isMine ? styles.myTimeText : styles.theirTimeText]}>
            {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <View style={styles.header}>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>{otherName}</Text>
          <Text style={styles.headerSubtitle}>
            {typingUser ? `${typingUser} is typing...` : 'Active now'}
          </Text>
        </View>
      </View>


      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#2874f0" />
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item, idx) => (item.id || idx).toString()}
          renderItem={renderMessage}
          contentContainerStyle={styles.messageList}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
        />
      )}

      <View style={styles.inputArea}>
        <TextInput
          style={styles.input}
          placeholder="Type a message..."
          value={newMessage}
          onChangeText={(t) => { setNewMessage(t); handleTyping(); }}
          multiline
        />
        <TouchableOpacity
          style={[styles.sendBtn, !newMessage.trim() && styles.sendBtnDisabled]}
          onPress={handleSendMessage}
          disabled={!newMessage.trim() || sending}
        >
          {sending ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Ionicons name="send" size={20} color="#fff" />
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fdfdfd' },
  header: { 
    paddingTop: Platform.OS === 'ios' ? 50 : 30, 
    paddingBottom: 15, 
    paddingHorizontal: 20, 
    backgroundColor: '#fff', 
    flexDirection: 'row', 
    alignItems: 'center', 
    borderBottomWidth: 3, 
    borderBottomColor: '#000000',

    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },

  headerTitleContainer: { flex: 1 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#1a1a1a' },
  headerSubtitle: { fontSize: 12, color: '#10b981', fontWeight: '600' },
  messageList: { padding: 15, paddingBottom: 20 },
  messageWrapper: { marginBottom: 10, flexDirection: 'row' },
  myMessageWrapper: { justifyContent: 'flex-end' },
  theirMessageWrapper: { justifyContent: 'flex-start' },
  bubble: { maxWidth: '80%', padding: 12, borderRadius: 18 },
  myBubble: { backgroundColor: '#2874f0', borderBottomRightRadius: 2 },
  theirBubble: { backgroundColor: '#f1f5f9', borderBottomLeftRadius: 2 },
  messageText: { fontSize: 15, lineHeight: 20 },
  myMessageText: { color: '#fff' },
  theirMessageText: { color: '#1e293b' },
  timeText: { fontSize: 10, marginTop: 4, alignSelf: 'flex-end' },
  myTimeText: { color: 'rgba(255,255,255,0.7)' },
  theirTimeText: { color: '#94a3b8' },
  inputArea: { padding: 10, backgroundColor: '#fff', flexDirection: 'row', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#eee' },
  input: { flex: 1, backgroundColor: '#f1f5f9', borderRadius: 25, paddingHorizontal: 15, paddingVertical: 8, marginRight: 10, fontSize: 15, maxHeight: 100 },
  sendBtn: { width: 45, height: 45, borderRadius: 22.5, backgroundColor: '#2874f0', justifyContent: 'center', alignItems: 'center' },
  sendBtnDisabled: { backgroundColor: '#cbd5e1' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' }
});
