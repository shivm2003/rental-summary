import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { Bell, Check, CheckCircle, Clock } from 'lucide-react';
import { useSocket } from '../../contexts/SocketContext';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5001';

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem('token');
  const { setUnreadCount } = useSocket();

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await axios.get(`${API}/api/notifications`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(res.data);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id) => {
    try {
      await axios.put(`${API}/api/notifications/${id}/read`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(prev => 
        prev.map(n => n.id === id ? { ...n, is_read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      toast.error('Failed to mark as read');
    }
  };

  const markAllAsRead = async () => {
    try {
      await axios.put(`${API}/api/notifications/read-all`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
      toast.success('All marked as read');
    } catch (error) {
      toast.error('Failed to mark all as read');
    }
  };

  if (loading) {
    return <div style={{ padding: '2rem' }}>Loading notifications...</div>;
  }

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div style={{ padding: '2rem', background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', minHeight: '600px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Notifications</h1>
          <p style={{ color: '#64748b' }}>You have {unreadCount} unread messages.</p>
        </div>
        {unreadCount > 0 && (
          <button 
            onClick={markAllAsRead}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', background: '#f1f5f9', color: '#0f172a', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 500 }}
          >
            <CheckCircle size={18} />
            Mark all as read
          </button>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {notifications.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>
            <Bell size={48} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
            <p>No notifications yet.</p>
          </div>
        ) : (
          notifications.map(notif => (
            <div 
              key={notif.id} 
              style={{ 
                padding: '1.5rem', 
                border: '1px solid #e2e8f0', 
                borderRadius: '8px', 
                background: notif.is_read ? '#fff' : '#f8fafc',
                display: 'flex',
                gap: '1rem',
                alignItems: 'flex-start',
                position: 'relative'
              }}
            >
              <div style={{ 
                padding: '0.75rem', 
                background: notif.is_read ? '#f1f5f9' : '#e0f2fe', 
                color: notif.is_read ? '#64748b' : '#0ea5e9',
                borderRadius: '50%' 
              }}>
                <Bell size={20} />
              </div>
              
              <div style={{ flex: 1 }}>
                <h3 style={{ fontSize: '1.1rem', margin: '0 0 0.5rem 0', color: '#0f172a', fontWeight: notif.is_read ? '500' : '600' }}>
                  {notif.title}
                </h3>
                <p style={{ margin: '0 0 0.75rem 0', color: '#475569', lineHeight: '1.5' }}>
                  {notif.message}
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#94a3b8', fontSize: '0.875rem' }}>
                  <Clock size={14} />
                  <span>{new Date(notif.created_at).toLocaleString()}</span>
                </div>
              </div>

              {!notif.is_read && (
                <button 
                  onClick={() => markAsRead(notif.id)}
                  style={{
                    padding: '0.5rem',
                    background: 'transparent',
                    border: 'none',
                    color: '#0ea5e9',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                    fontSize: '0.875rem'
                  }}
                  title="Mark as read"
                >
                  <Check size={16} /> Mark Read
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
