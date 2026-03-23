import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import axios from 'axios';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const { user } = useAuth();
  
  useEffect(() => {
    let newSocket;
    
    // Only connect if user is logged in
    if (user && user.id) {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';
      
      newSocket = io(API_URL, {
        withCredentials: true,
        transports: ['websocket', 'polling'] // Try websocket first
      });

      newSocket.on('connect', () => {
        console.log('🔌 Socket connected successfully:', newSocket.id);
        // Join personal notification room
        newSocket.emit('join_user', user.id);
      });

      newSocket.on('connect_error', (err) => {
        console.warn('Socket connection error:', err.message);
      });

      // Fetch initial notifications
      const fetchNotifications = async () => {
        try {
          const { data } = await axios.get(`${API_URL}/api/notifications`, {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
          });
          setNotifications(data);
          setUnreadCount(data.filter(n => !n.is_read).length);
        } catch (err) {
          console.error('Error fetching notifications:', err);
        }
      };
      fetchNotifications();

      newSocket.on('new_notification', (notification) => {
        setNotifications(prev => [notification, ...prev]);
        setUnreadCount(prev => prev + 1);
      });

      setSocket(newSocket);
    }

    return () => {
      if (newSocket) {
        newSocket.off('new_notification');
        newSocket.disconnect();
      }
    };
  }, [user]);

  return (
    <SocketContext.Provider value={{ socket, notifications, unreadCount, setUnreadCount, setNotifications }}>
      {children}
    </SocketContext.Provider>
  );
};
