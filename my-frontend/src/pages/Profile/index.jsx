import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';
import { 
  User, 
  ChevronRight, 
  Power, 
  CreditCard, 
  FolderHeart, 
  MessageSquare, 
  Bell, 
  Wallet,
  Package,
  MapPin,
  Smartphone,
  ShieldCheck,
  Plus,
  Trash2,
  CheckCircle2
} from 'lucide-react';
import './index.css';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5001';

export default function Profile() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const token = localStorage.getItem('token');
  
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'profile');

  useEffect(() => {
    fetchProfile();
  }, []);

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab) setActiveTab(tab);
  }, [searchParams]);

  const fetchProfile = async () => {
    try {
      const { data } = await axios.get(`${API}/api/user/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProfile(data);
    } catch (error) {
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  if (loading) return <div className="profile-page-wrapper"><div className="profile-container">Loading Profile...</div></div>;

  return (
    <div className="profile-page-wrapper">
      <div className="profile-container">
        
        {/* Sidebar */}
        <aside className="profile-sidebar">
          <div className="sidebar-user-card">
            <div className="avatar-initials">
              {profile?.profile_picture_url ? (
                <img src={profile.profile_picture_url} alt="Profile" style={{width:'100%', height:'100%', borderRadius:'50%'}} />
              ) : (
                (profile?.first_name?.[0] || profile?.username?.[0] || 'U').toUpperCase()
              )}
            </div>
            <div className="user-greeting">
              <span className="greeting-text">Hello,</span>
              <span className="user-full-name">{profile?.first_name} {profile?.last_name}</span>
            </div>
          </div>

          <div className="sidebar-menu">
            <div className="menu-group">
              <div className="menu-header link-header" onClick={() => navigate('/orders')}>
                <Package size={20} color="#2874f0" />
                <span>MY ORDERS</span>
                <ChevronRight size={18} style={{marginLeft:'auto'}} />
              </div>
            </div>

            <div className="menu-group">
              <div className="menu-header">
                <User size={20} color="#2874f0" />
                <span>ACCOUNT SETTINGS</span>
              </div>
              <div className="menu-items">
                <button className={`menu-link ${activeTab === 'profile' ? 'active' : ''}`} onClick={() => handleTabChange('profile')}>Profile Information</button>
                <button className={`menu-link ${activeTab === 'addresses' ? 'active' : ''}`} onClick={() => handleTabChange('addresses')}>Manage Addresses</button>
                <button className={`menu-link ${activeTab === 'pan' ? 'active' : ''}`} onClick={() => handleTabChange('pan')}>PAN Card Information</button>
              </div>
            </div>

            <div className="menu-group">
              <div className="menu-header">
                <Wallet size={20} color="#2874f0" />
                <span>PAYMENTS</span>
              </div>
              <div className="menu-items">
                <button className={`menu-link ${activeTab === 'gift-cards' ? 'active' : ''}`} onClick={() => handleTabChange('gift-cards')}>Gift Cards</button>
                <button className={`menu-link ${activeTab === 'saved-upi' ? 'active' : ''}`} onClick={() => handleTabChange('saved-upi')}>Saved UPI</button>
                <button className={`menu-link ${activeTab === 'saved-cards' ? 'active' : ''}`} onClick={() => handleTabChange('saved-cards')}>Saved Cards</button>
              </div>
            </div>

            <div className="menu-group">
              <div className="menu-header">
                <FolderHeart size={20} color="#2874f0" />
                <span>MY STUFF</span>
              </div>
              <div className="menu-items">
                <button className={`menu-link ${activeTab === 'coupons' ? 'active' : ''}`} onClick={() => handleTabChange('coupons')}>My Coupons</button>
                <button className={`menu-link ${activeTab === 'reviews' ? 'active' : ''}`} onClick={() => handleTabChange('reviews')}>My Reviews & Ratings</button>
                <button className={`menu-link ${activeTab === 'notifications' ? 'active' : ''}`} onClick={() => handleTabChange('notifications')}>All Notifications</button>
                <button className={`menu-link`} onClick={() => navigate('/wishlist')}>My Wishlist</button>
              </div>
            </div>

            <button className="logout-menu-item" onClick={logout}>
              <Power size={20} color="#2874f0" />
              <span>Logout</span>
            </button>
          </div>
        </aside>

        {/* Content Area */}
        <main className="profile-content">
           <ProfileContent activeTab={activeTab} profile={profile} token={token} onRefresh={fetchProfile} />
        </main>
      </div>
    </div>
  );
}

// Sub-component switcher
function ProfileContent({ activeTab, profile, token, onRefresh }) {
  switch (activeTab) {
    case 'profile': return <PersonalInformation profile={profile} token={token} onRefresh={onRefresh} />;
    case 'addresses': return <ManageAddresses token={token} />;
    case 'pan': return <PanInformation token={token} />;
    case 'gift-cards': return <GiftCards token={token} />;
    case 'saved-upi': return <SavedUPI token={token} />;
    case 'saved-cards': return <SavedCards token={token} />;
    case 'coupons': return <MyCoupons token={token} />;
    case 'reviews': return <MyReviews token={token} />;
    case 'notifications': return <AllNotifications token={token} />;
    default: return <PersonalInformation profile={profile} token={token} onRefresh={onRefresh} />;
  }
}

/* ==========================================================================
   Sub-components Implementation
   ========================================================================== */

function PersonalInformation({ profile, token, onRefresh }) {
  const [editMode, setEditMode] = useState({p: false, e: false, m: false});
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
      firstName: profile?.first_name || '',
      lastName: profile?.last_name || '',
      gender: profile?.gender || '',
      email: profile?.email || '',
      phone: profile?.phone || ''
  });

  const handleSave = async (section) => {
    setSaving(true);
    try {
      await axios.put(`${API}/api/user/profile`, form, { headers: { Authorization: `Bearer ${token}` } });
      toast.success('Successfully updated');
      setEditMode({...editMode, [section]: false});
      onRefresh();
    } catch (e) { toast.error(e.response?.data?.message || 'Update failed'); }
    finally { setSaving(false); }
  };

  return (
    <div className="content-section">
      <div className="section-header">
        <span className="section-title">Personal Information</span>
        <button className="edit-link" onClick={() => setEditMode({...editMode, p: !editMode.p})}>
          {editMode.p ? 'Cancel' : 'Edit'}
        </button>
      </div>
      <div className="info-form-grid">
        <input type="text" className="input-box" disabled={!editMode.p} value={form.firstName} onChange={e => setForm({...form, firstName: e.target.value})} placeholder="First Name" />
        <input type="text" className="input-box" disabled={!editMode.p} value={form.lastName} onChange={e => setForm({...form, lastName: e.target.value})} placeholder="Last Name" />
      </div>
      <div className="gender-box">
        <span className="gender-label">Your Gender</span>
        <div className="radio-group">
          {['Male', 'Female'].map(g => (
            <label key={g} className="radio-option">
              <input type="radio" value={g} checked={form.gender === g} disabled={!editMode.p} onChange={e => setForm({...form, gender: e.target.value})} /> {g}
            </label>
          ))}
        </div>
      </div>
      {editMode.p && <button className="save-btn" onClick={() => handleSave('p')} disabled={saving}>{saving ? 'Saving...' : 'SAVE'}</button>}

      <div className="sub-section-wrap" style={{marginTop:'48px'}}>
         <div className="section-header">
           <span className="section-title">Email Address</span>
           <button className="edit-link" onClick={() => setEditMode({...editMode, e: !editMode.e})}>{editMode.e ? 'Cancel' : 'Edit'}</button>
         </div>
         <div className="contact-info-row">
            <input type="email" className="input-box" style={{width:'280px'}} disabled={!editMode.e} value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
            {editMode.e && <button className="save-btn" onClick={() => handleSave('e')} disabled={saving}>SAVE</button>}
         </div>
      </div>

      <div className="sub-section-wrap">
         <div className="section-header">
           <span className="section-title">Mobile Number</span>
           <button className="edit-link" onClick={() => setEditMode({...editMode, m: !editMode.m})}>{editMode.m ? 'Cancel' : 'Edit'}</button>
         </div>
         <div className="contact-info-row">
            <input type="tel" className="input-box" style={{width:'280px'}} disabled={!editMode.m} value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} />
            {editMode.m && <button className="save-btn" onClick={() => handleSave('m')} disabled={saving}>SAVE</button>}
         </div>
      </div>
    </div>
  );
}

function ManageAddresses({ token }) {
  const [addresses, setAddresses] = useState([]);
  const [isAdding, setIsAdding] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', pincode: '', locality: '', address: '', city: '', state: '', landmark: '', altPhone: '', type: 'Home' });

  useEffect(() => { fetchAddresses(); }, []);

  const fetchAddresses = async () => {
    try {
      const { data } = await axios.get(`${API}/api/user/addresses`, { headers: { Authorization: `Bearer ${token}` } });
      setAddresses(data);
    } catch (e) { toast.error('Failed to load addresses'); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/api/user/addresses`, form, { headers: { Authorization: `Bearer ${token}` } });
      toast.success('Address saved');
      setIsAdding(false);
      fetchAddresses();
    } catch (e) { toast.error('Failed to save address'); }
  };

  return (
    <div className="content-section">
      <div className="section-header">
        <span className="section-title">Manage Addresses</span>
        {!isAdding && <button className="add-btn-outline" onClick={() => setIsAdding(true)}><Plus size={16}/> ADD A NEW ADDRESS</button>}
      </div>

      {isAdding && (
        <form className="address-form" onSubmit={handleSubmit}>
          <div className="form-grid">
            <input type="text" className="input-box" required placeholder="Name" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
            <input type="tel" className="input-box" required placeholder="10-digit mobile number" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} />
            <input type="text" className="input-box" required placeholder="Pincode" value={form.pincode} onChange={e => setForm({...form, pincode: e.target.value})} />
            <input type="text" className="input-box" required placeholder="Locality" value={form.locality} onChange={e => setForm({...form, locality: e.target.value})} />
            <textarea className="input-box span-2" required placeholder="Address (Area and Street)" value={form.address} onChange={e => setForm({...form, address: e.target.value})} rows="3" />
            <input type="text" className="input-box" required placeholder="City/District/Town" value={form.city} onChange={e => setForm({...form, city: e.target.value})} />
            <select className="input-box" required value={form.state} onChange={e => setForm({...form, state: e.target.value})}><option value="">--Select State--</option><option value="UP">Uttar Pradesh</option><option value="DL">Delhi</option></select>
          </div>
          <div className="form-actions" style={{marginTop:'20px', display:'flex', gap:'16px'}}>
            <button type="submit" className="save-btn" style={{padding:'12px 64px'}}>SAVE</button>
            <button type="button" className="cancel-btn" onClick={() => setIsAdding(false)}>CANCEL</button>
          </div>
        </form>
      )}

      <div className="address-list" style={{marginTop:'24px'}}>
        {addresses.map(addr => (
          <div key={addr.id} className="address-item">
            <div className="addr-header">
               <span className="addr-tag">{addr.type}</span>
            </div>
            <div className="addr-body">
              <span className="addr-name">{addr.name}</span>
              <span className="addr-phone">{addr.phone}</span>
              <p className="addr-text">{addr.address}, {addr.locality}, {addr.city}, {addr.state} - {addr.pincode}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PanInformation({ token }) {
  const [form, setForm] = useState({ panNumber: '', fullName: '' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(`${API}/api/user/pan`, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => setForm({ panNumber: res.data.pan_number || '', fullName: res.data.full_name || '' }))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    try {
      await axios.put(`${API}/api/user/pan`, form, { headers: { Authorization: `Bearer ${token}` } });
      toast.success('PAN updated');
    } catch (e) { toast.error('Update failed'); }
  };

  if (loading) return null;

  return (
    <div className="content-section">
      <div className="section-header"><span className="section-title">PAN Card Information</span></div>
      <div style={{maxWidth:'400px', display:'flex', flexDirection:'column', gap:'16px'}}>
        <input type="text" className="input-box" placeholder="PAN Number" value={form.panNumber} onChange={e => setForm({...form, panNumber: e.target.value.toUpperCase()})} maxLength={10} />
        <input type="text" className="input-box" placeholder="Full Name (As per PAN)" value={form.fullName} onChange={e => setForm({...form, fullName: e.target.value})} />
        <p style={{fontSize:'12px', color:'#878787'}}>By continuing, you agree to the Terms of Use and Privacy Policy.</p>
        <button className="save-btn" onClick={handleSave}>SAVE</button>
      </div>
    </div>
  );
}

function GiftCards({ token }) {
  const [cards, setCards] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ cardNumber: '', pin: '' });

  useEffect(() => {
    axios.get(`${API}/api/user/gift-cards`, { headers: { Authorization: `Bearer ${token}` } }).then(res => setCards(res.data));
  }, []);

  const handleAdd = async () => {
    try {
      await axios.post(`${API}/api/user/gift-cards`, form, { headers: { Authorization: `Bearer ${token}` } });
      toast.success('Gift card added');
      setShowAdd(false);
      setForm({cardNumber:'', pin:''});
    } catch (e) { toast.error('Failed to add'); }
  };

  return (
    <div className="content-section">
      <div className="section-header">
        <span className="section-title">Gift Cards</span>
        <button className="add-btn-outline" onClick={() => setShowAdd(!showAdd)}>+ ADD GIFT CARD</button>
      </div>
      {showAdd && (
        <div style={{background:'#f9f9f9', padding:'20px', marginBottom:'20px', borderRadius:'4px', display:'flex', gap:'12px'}}>
           <input className="input-box" placeholder="Card Number" value={form.cardNumber} onChange={e => setForm({...form, cardNumber: e.target.value})} />
           <input className="input-box" placeholder="PIN" value={form.pin} onChange={e => setForm({...form, pin: e.target.value})} />
           <button className="save-btn" onClick={handleAdd}>ADD</button>
        </div>
      )}
      <div className="gift-card-list">
        {cards.map(c => (
          <div key={c.id} style={{padding:'16px', border:'1px solid #f0f0f0', borderRadius:'2px', display:'flex', justifyContent:'space-between'}}>
             <span>{c.card_number.replace(/\d(?=\d{4})/g, "*")}</span>
             <span style={{fontWeight:'600', color:'#2874f0'}}>Balance: ₹{c.balance}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function SavedUPI({ token }) {
  const [upis, setUpis] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ vpa: '', name: '' });

  useEffect(() => {
    axios.get(`${API}/api/user/saved-upi`, { headers: { Authorization: `Bearer ${token}` } }).then(res => setUpis(res.data));
  }, []);

  const handleAdd = async () => {
    try {
      await axios.post(`${API}/api/user/saved-upi`, form, { headers: { Authorization: `Bearer ${token}` } });
      toast.success('UPI ID saved');
      setShowAdd(false);
      setForm({vpa:'', name:''});
    } catch (e) { toast.error('Failed to save'); }
  };

  return (
    <div className="content-section">
      <div className="section-header"><span className="section-title">Saved UPI</span></div>
      <button className="add-btn-outline" style={{marginBottom:'20px'}} onClick={() => setShowAdd(!showAdd)}>+ ADD UPI ID</button>
      {showAdd && (
        <div style={{display:'flex', gap:'12px', marginBottom:'20px'}}>
          <input className="input-box" placeholder="UPI ID (VPA)" value={form.vpa} onChange={e => setForm({...form, vpa: e.target.value})} />
          <input className="input-box" placeholder="Name" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
          <button className="save-btn" onClick={handleAdd}>SAVE</button>
        </div>
      )}
      {upis.map(u => (
        <div key={u.id} style={{padding:'16px', borderBottom:'1px solid #f0f0f0', display:'flex', gap:'16px', alignItems:'center'}}>
           <CheckCircle2 color="#2874f0" size={20} />
           <div style={{display:'flex', flexDirection:'column'}}>
             <span style={{fontWeight:'600'}}>{u.vpa}</span>
             <span style={{fontSize:'12px', color:'#878787'}}>{u.name}</span>
           </div>
        </div>
      ))}
    </div>
  );
}

function SavedCards({ token }) { return <div className="content-section"><h2>Saved Cards</h2><p>Your saved credit and debit cards will appear here.</p></div>; }
function MyCoupons({ token }) { return <div className="content-section"><h2>My Coupons</h2><p>Exclusive coupons just for you!</p></div>; }
function MyReviews({ token }) {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Note: We need to create this endpoint or similar
    axios.get(`${API}/api/products/user/reviews`, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => setReviews(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div>Loading reviews...</div>;

  return (
    <div className="content-section">
      <div className="section-header"><span className="section-title">My Reviews & Ratings</span></div>
      {reviews.length === 0 ? (
        <p>You haven't reviewed any products yet.</p>
      ) : (
        <div className="review-list">
          {reviews.map(r => (
            <div key={r.id} className="review-item">
              <div style={{display:'flex', gap:'12px', alignItems:'center', marginBottom:'8px'}}>
                 <span className="rating-badge">{r.rating} ★</span>
                 <span style={{fontWeight:'700', fontSize:'15px'}}>{r.product_name}</span>
              </div>
              <p style={{fontSize:'14px', color:'#333', margin:'0 0 8px 0', lineHeight:'1.5'}}>{r.comment}</p>
              <span style={{fontSize:'12px', color:'var(--text-light)'}}>{new Date(r.created_at).toLocaleDateString(undefined, {year:'numeric', month:'long', day:'numeric'})}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function AllNotifications({ token }) {
  const [notifs, setNotifs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(`${API}/api/notifications`, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => setNotifs(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div>Loading notifications...</div>;

  return (
    <div className="content-section">
      <div className="section-header"><span className="section-title">All Notifications</span></div>
      {notifs.length === 0 ? (
        <p>No new notifications.</p>
      ) : (
        <div className="notif-list">
          {notifs.map(n => (
            <div key={n.id} className="notif-item">
              <Bell size={20} color={n.is_read ? '#cbd5e1' : 'var(--primary-blue)'} style={{marginTop:'2px', flexShrink:0}} />
              <div style={{flex:1}}>
                <p style={{fontSize:'14px', margin:'0 0 4px 0', color: n.is_read ? 'var(--text-light)' : 'var(--text-dark)', fontWeight: n.is_read ? '400' : '600', lineHeight:'1.4'}}>{n.message}</p>
                <span style={{fontSize:'12px', color:'var(--text-light)'}}>{new Date(n.created_at).toLocaleString()}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
