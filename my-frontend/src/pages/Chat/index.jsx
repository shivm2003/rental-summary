import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import { useSocket } from '../../contexts/SocketContext';
import { toast } from 'react-hot-toast';
import { Send, ArrowLeft } from 'lucide-react';
import './index.css';

export default function Chat() {
  const { user } = useAuth();
  const { socket } = useSocket();
  const [rooms, setRooms] = useState([]);
  const [activeTab, setActiveTab] = useState('borrower'); // 'borrower' or 'lender'
  const [activeRoomId, setActiveRoomId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loadingRooms, setLoadingRooms] = useState(true);
  const messagesEndRef = useRef(null);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

  // Fetch rooms
  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const { data } = await axios.get(`${API_URL}/api/chat/rooms`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        setRooms(data);
      } catch (err) {
        console.error('Failed to fetch rooms:', err);
      } finally {
        setLoadingRooms(false);
      }
    };
    if (user) fetchRooms();
  }, [user]);

  // Fetch messages for active room
  useEffect(() => {
    if (!activeRoomId) return;

    const fetchMessages = async () => {
      try {
        const { data } = await axios.get(`${API_URL}/api/chat/rooms/${activeRoomId}/messages`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        setMessages(data);
        scrollToBottom();

        // Optional: clear unread locally
        setRooms(prev => prev.map(r => r.id === activeRoomId ? { ...r, unread_count: 0 } : r));
      } catch (err) {
        console.error('Failed to fetch messages:', err);
      }
    };

    fetchMessages();

    if (socket) {
      socket.emit('join_chat', activeRoomId);

      const handleMessage = (message) => {
        if (message.room_id === activeRoomId) {
          setMessages(prev => [...prev, message]);
          scrollToBottom();
        } else {
          // Increment unread for the background room
          setRooms(prev => prev.map(r => 
            r.id === message.room_id ? { ...r, unread_count: parseInt(r.unread_count || 0) + 1, last_message: message.content } : r
          ));
        }
      };

      socket.on('receive_message', handleMessage);

      return () => {
        socket.off('receive_message', handleMessage);
        socket.emit('leave_chat', activeRoomId);
      };
    }
  }, [activeRoomId, socket]);

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeRoomId) return;

    try {
      const { data } = await axios.post(
        `${API_URL}/api/chat/rooms/${activeRoomId}/messages`,
        { content: newMessage },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      // Update local rooms last_message
      setRooms(prev => prev.map(r => r.id === activeRoomId ? { ...r, last_message: data.content } : r));
      setNewMessage('');
    } catch (err) {
      toast.error('Failed to send message');
    }
  };

  if (loadingRooms) return <div className="chat-loading">Loading conversations...</div>;

  const activeRoom = rooms.find(r => r.id === activeRoomId);

  // Filter rooms based on active tab
  const filteredRooms = rooms.filter(room => room.my_role === activeTab);

  return (
    <div className="chat-container">
      {/* Sidebar */}
      <div className={`chat-sidebar ${activeRoomId ? 'hidden-mobile' : ''}`}>
        <div className="chat-sidebar-header">
          <h2>Messages</h2>
          
          <div className="chat-tabs">
            <button 
              className={`chat-tab ${activeTab === 'borrower' ? 'active' : ''}`}
              onClick={() => { setActiveTab('borrower'); setActiveRoomId(null); }}
            >
              Buying / Renting
            </button>
            <button 
              className={`chat-tab ${activeTab === 'lender' ? 'active' : ''}`}
              onClick={() => { setActiveTab('lender'); setActiveRoomId(null); }}
            >
              Selling / Lending
            </button>
          </div>
        </div>
        
        <div className="chat-room-list">
          {filteredRooms.length === 0 ? (
            <div className="no-rooms" style={{ padding: '40px 20px', textAlign: 'center', color: '#888' }}>
              No {activeTab === 'lender' ? 'lending' : 'renting'} conversations yet
            </div>
          ) : (
            filteredRooms.map(room => (
              <div 
                key={room.id} 
                className={`chat-room-item ${activeRoomId === room.id ? 'active' : ''}`}
                onClick={() => setActiveRoomId(room.id)}
              >
                <div className="chat-avatar">
                  {room.other_avatar ? (
                    <img src={room.other_avatar} alt={room.other_first_name} />
                  ) : (
                    <div className="chat-avatar-fallback">{room.other_first_name?.charAt(0)?.toUpperCase()}</div>
                  )}
                </div>
                <div className="chat-room-info">
                  <div className="chat-room-name-wrapper">
                    <span className="chat-room-name">{room.other_first_name}</span>
                    <span className="chat-role-badge">{activeTab === 'lender' ? 'Borrower' : 'Lender'}</span>
                  </div>
                  {room.product_name && (
                    <div className="chat-room-product">
                      <span className="product-icon">📦</span> {room.product_name}
                    </div>
                  )}
                  <div className="chat-room-last-msg">{room.last_message || 'No messages yet'}</div>
                </div>
                {Number(room.unread_count) > 0 && (
                  <div className="chat-unread-badge">{room.unread_count}</div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className={`chat-main ${!activeRoomId ? 'hidden-mobile' : ''}`}>
        {activeRoomId ? (
          <>
            <div className="chat-header">
              <button className="back-btn mobile-only" onClick={() => setActiveRoomId(null)}>
                <ArrowLeft size={20} />
              </button>
              <div className="chat-avatar">
                  {activeRoom?.other_avatar ? (
                    <img src={activeRoom.other_avatar} alt={activeRoom.other_first_name} />
                  ) : (
                    <div className="chat-avatar-fallback">{activeRoom?.other_first_name?.charAt(0)?.toUpperCase()}</div>
                  )}
              </div>
              <div className="chat-header-info">
                <h3>{activeRoom?.other_first_name} <span className="chat-role-badge inline">{activeTab === 'lender' ? 'Borrower' : 'Lender'}</span></h3>
                {activeRoom?.product_name && (
                  <span className="chat-header-product">Regarding: {activeRoom.product_name}</span>
                )}
              </div>
            </div>
            
            <div className="chat-messages-container">
              {messages.map((msg, idx) => {
                const isMine = msg.sender_id == user.id;
                return (
                  <div key={msg.id || idx} className={`chat-message ${isMine ? 'mine' : 'theirs'}`}>
                    <div className="chat-bubble">
                      {msg.content}
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            <form className="chat-input-area" onSubmit={handleSendMessage}>
              <input 
                type="text" 
                placeholder="Type a message..." 
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
              />
              <button type="submit" disabled={!newMessage.trim()}>
                <Send size={20} />
              </button>
            </form>
          </>
        ) : (
          <div className="chat-empty-state">
            <div className="empty-icon" style={{ fontSize: '4rem', opacity: 0.5, marginBottom: '16px' }}>💬</div>
            <h3 style={{ color: '#212121' }}>Your Messages</h3>
            <p>Select a conversation from the left to start chatting.</p>
          </div>
        )}
      </div>
    </div>
  );
}
