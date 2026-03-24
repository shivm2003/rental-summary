import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';
import { User, Settings, Shield, Trash2, LogOut, Loader2, Save } from 'lucide-react';
import './index.css';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5001';

export default function Profile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const [loading, setLoading] = useState(false);
  
  const [activeTab, setActiveTab] = useState('settings');
  
  // Settings form
  const [settingsForm, setSettingsForm] = useState({
    notificationsEnabled: true,
    newsletterSubscribed: false,
    theme: 'light'
  });

  const [deleteConfirm, setDeleteConfirm] = useState('');

  // Handle settings save
  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Simulate saving settings or call real API
      await new Promise(res => setTimeout(res, 800));
      toast.success('Settings updated successfully!');
    } catch (error) {
      toast.error('Failed to update settings');
    } finally {
      setLoading(false);
    }
  };

  // Handle account deletion
  const handleDeleteAccount = async () => {
    if (deleteConfirm !== 'DELETE') {
      toast.error('Please type DELETE to confirm');
      return;
    }
    
    setLoading(true);
    try {
      await axios.delete(`${API}/api/user/account`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Account deleted successfully');
      logout();
      navigate('/');
    } catch (error) {
      console.error('Delete account error:', error);
      toast.error(error.response?.data?.message || 'Failed to delete account');
    } finally {
      setLoading(false);
      setDeleteConfirm('');
    }
  };

  if (!user) {
    return (
      <div className="profile-container">
        <div className="profile-loading">
          <Loader2 className="spinner" size={32} />
          <p>Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-container">
      <div className="profile-sidebar">
        <div className="profile-user-card">
          <div className="profile-avatar">
            {user.profilePictureUrl ? (
              <img src={user.profilePictureUrl} alt="Profile" />
            ) : (
              <span>{user.firstName?.charAt(0) || user.username?.charAt(0) || 'U'}</span>
            )}
          </div>
          <h3>{user.firstName} {user.lastName}</h3>
          <p>{user.email}</p>
          <span className="profile-role-badge">{user.role || 'User'}</span>
        </div>

        <nav className="profile-nav">
          <button 
            className={`profile-nav-btn ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => setActiveTab('settings')}
          >
            <Settings size={20} /> Settings
          </button>
          <button 
            className={`profile-nav-btn ${activeTab === 'security' ? 'active' : ''}`}
            onClick={() => setActiveTab('security')}
          >
            <Shield size={20} /> Security & Privacy
          </button>
          <button 
            className="profile-nav-btn danger"
            onClick={() => setActiveTab('danger')}
          >
            <Trash2 size={20} /> Danger Zone
          </button>
          <button className="profile-nav-btn logout-btn" onClick={logout}>
            <LogOut size={20} /> Sign Out
          </button>
        </nav>
      </div>

      <div className="profile-content">
        {activeTab === 'settings' && (
          <div className="profile-section">
            <h2>Account Settings</h2>
            <p className="section-desc">Manage your application preferences and settings.</p>
            
            <form onSubmit={handleSaveSettings} className="settings-form">
              <div className="form-group toggle-group">
                <div>
                  <label>Push Notifications</label>
                  <p>Receive alerts for bookings and messages</p>
                </div>
                <label className="switch">
                  <input 
                    type="checkbox" 
                    checked={settingsForm.notificationsEnabled}
                    onChange={(e) => setSettingsForm({...settingsForm, notificationsEnabled: e.target.checked})}
                  />
                  <span className="slider round"></span>
                </label>
              </div>

              <div className="form-group toggle-group">
                <div>
                  <label>Email Newsletter</label>
                  <p>Get updates on offers and new features</p>
                </div>
                <label className="switch">
                  <input 
                    type="checkbox" 
                    checked={settingsForm.newsletterSubscribed}
                    onChange={(e) => setSettingsForm({...settingsForm, newsletterSubscribed: e.target.checked})}
                  />
                  <span className="slider round"></span>
                </label>
              </div>

              <div className="form-actions">
                <button type="submit" className="btn-primary" disabled={loading}>
                  {loading ? <Loader2 className="spinner" size={18} /> : <Save size={18} />}
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        )}

        {activeTab === 'security' && (
          <div className="profile-section">
            <h2>Security</h2>
            <p className="section-desc">Manage your password and security settings.</p>
            <div className="security-info">
              <p>To change your password or update sensitive information, please contact support or use the forgot password flow if you are logged out.</p>
            </div>
          </div>
        )}

        {activeTab === 'danger' && (
          <div className="profile-section danger-section">
            <h2 className="text-danger">Delete Account</h2>
            <p className="section-desc">Once you delete your account, there is no going back. Please be certain.</p>
            
            <div className="danger-zone-box">
              <div className="danger-warning">
                <Shield className="text-danger" size={24} />
                <div>
                  <h4>Warning</h4>
                  <p>This action will permanently delete your data, listings, and order history.</p>
                </div>
              </div>
              
              <div className="delete-confirm-box">
                <label>To verify, type <strong>DELETE</strong> below:</label>
                <input 
                  type="text" 
                  value={deleteConfirm}
                  onChange={(e) => setDeleteConfirm(e.target.value)}
                  placeholder="DELETE"
                />
                <button 
                  className="btn-danger" 
                  onClick={handleDeleteAccount}
                  disabled={deleteConfirm !== 'DELETE' || loading}
                >
                  {loading ? <Loader2 className="spinner" size={18} /> : 'Delete My Account'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
