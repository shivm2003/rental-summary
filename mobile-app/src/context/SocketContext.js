import React, { createContext, useContext, useEffect, useState } from 'react';
import io from 'socket.io-client';
import { AuthContext } from './AuthContext';
import api from '../api/api';
import Constants from 'expo-constants';

const SocketContext = createContext();

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const { user, token } = useContext(AuthContext);

  useEffect(() => {
    let newSocket;

    if (user && user.id && token) {
      const API_BASE = Constants.expoConfig?.extra?.apiUrl || 
                       process.env.EXPO_PUBLIC_API_URL?.replace('/api', '') ||
                       'http://192.168.1.202:5001';

      newSocket = io(API_BASE, {
        transports: ['websocket', 'polling'],
        reconnectionAttempts: 5,
        reconnectionDelay: 2000,
      });

      newSocket.on('connect', () => {
        console.log('🔌 Socket connected:', newSocket.id);
        newSocket.emit('join_user', user.id);
      });

      newSocket.on('connect_error', (err) => {
        console.warn('Socket error:', err.message);
      });

      // Fetch initial notifications
      const fetchNotifications = async () => {
        try {
          const res = await api.get('/notifications', {
            headers: { Authorization: `Bearer ${token}` }
          });
          setNotifications(res.data || []);
          setUnreadCount((res.data || []).filter(n => !n.is_read).length);
        } catch (err) {
          console.error('Error fetching notifications:', err);
        }
      };
      fetchNotifications();

      // Real-time listener
      newSocket.on('new_notification', (notification) => {
        setNotifications(prev => [notification, ...prev]);
        setUnreadCount(prev => prev + 1);
      });

      // Real-time chat message listener
      newSocket.on('new_message', (message) => {
        // Handled by ChatRoomScreen if mounted
      });

      setSocket(newSocket);
    }

    return () => {
      if (newSocket) {
        newSocket.off('new_notification');
        newSocket.off('new_message');
        newSocket.disconnect();
      }
    };
  }, [user, token]);

  const markRoomAsRead = async (roomId) => {
    try {
      // 1. Identify notifications related to this room
      const relatedNotifs = notifications.filter(n => {
        const data = n.data ? (typeof n.data === 'string' ? JSON.parse(n.data) : n.data) : {};
        // Reference ID is often used for the Room ID in NEW_MESSAGE notifications
        return !n.is_read && (n.type === 'NEW_MESSAGE' || n.category === 'chat') && 
               (data.roomId === roomId || data.room_id === roomId || String(n.reference_id) === String(roomId));
      });

      // 2. Mark them as read on the server one by one (or just trust local clear if no batch exists)
      for (const notif of relatedNotifs) {
        try {
          await api.put(`/notifications/${notif.id}/read`, {}, {
            headers: { Authorization: `Bearer ${token}` }
          });
        } catch (e) {}
      }

      // 3. Update local notifications state for immediate feedback
      setNotifications(prev => {
        let changed = false;
        const next = prev.map(n => {
          const data = n.data ? (typeof n.data === 'string' ? JSON.parse(n.data) : n.data) : {};
          const isRelated = (data.roomId === roomId || data.room_id === roomId || String(n.reference_id) === String(roomId));
          if (isRelated && !n.is_read) {
            changed = true;
            return { ...n, is_read: true };
          }
          return n;
        });
        if (changed) {
          setUnreadCount(next.filter(n => !n.is_read).length);
        }
        return next;
      });
    } catch (err) {
      console.warn('Failed to sync room read status:', err);
    }
  };


  return (
    <SocketContext.Provider value={{ 
      socket, notifications, unreadCount, setUnreadCount, setNotifications, markRoomAsRead 
    }}>
      {children}
    </SocketContext.Provider>
  );
};

