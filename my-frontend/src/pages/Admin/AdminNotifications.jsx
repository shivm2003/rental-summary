/* my-frontend/src/pages/Admin/AdminNotifications.jsx */
import React, { useState, useEffect } from 'react';
import { Bell, Search, Package, Megaphone, Send, Info, ExternalLink } from 'lucide-react';
import { sendGlobalPush } from '../../services/admin';
import { fetchProducts } from '../../services/products';
import { toast } from 'react-hot-toast';

export default function AdminNotifications() {
  const [activeTab, setActiveTab] = useState('global');
  const [pushData, setPushData] = useState({ title: '', message: '', url: '' });
  const [sending, setSending] = useState(false);

  // Product search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  const handleSendPush = async (e) => {
    e.preventDefault();
    if (!pushData.title || !pushData.message) {
      toast.error('Title and message are required');
      return;
    }

    setSending(true);
    try {
      await sendGlobalPush(pushData);
      toast.success('Notification sent to all subscribers!');
      if (activeTab === 'global') {
        setPushData({ title: '', message: '', url: '' });
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send notification');
    } finally {
      setSending(false);
    }
  };

  const handleSearchProducts = async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    try {
      const data = await fetchProducts({ search: searchQuery });
      setSearchResults(data.products || []);
    } catch (err) {
      toast.error('Failed to search products');
    } finally {
      setSearching(false);
    }
  };

  const selectProduct = (product) => {
    setSelectedProduct(product);
    setPushData({
      title: `Check out: ${product.item_name}`,
      message: `Rent ${product.item_name} for just ₹${product.rental_price_per_day}/${product.price_unit || 'day'}!`,
      url: `/product/${product.id}`
    });
    setSearchResults([]);
    setSearchQuery('');
  };

  return (
    <div style={{ padding: '32px', fontFamily: "'DM Sans', sans-serif", maxWidth: '1000px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Bell size={24} color="#ef4444" /> Platform Notifications
        </h2>
        <p style={{ color: '#64748b', fontSize: '14px', marginTop: '4px' }}>
          Send real-time push notifications to all users and PWA-installed apps.
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', background: '#f1f5f9', padding: '4px', borderRadius: '10px', width: 'fit-content', marginBottom: '32px' }}>
        <button 
          onClick={() => { setActiveTab('global'); setSelectedProduct(null); setPushData({ title: '', message: '', url: '' }); }}
          style={{ 
            padding: '10px 20px', border: 'none', 
            background: activeTab === 'global' ? '#fff' : 'transparent', 
            color: activeTab === 'global' ? '#111' : '#64748b', 
            borderRadius: '8px', cursor: 'pointer', fontWeight: 600,
            display: 'flex', alignItems: 'center', gap: '8px',
            boxShadow: activeTab === 'global' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
          }}
        >
          <Megaphone size={18} /> Global Announcement
        </button>
        <button 
          onClick={() => setActiveTab('product')}
          style={{ 
            padding: '10px 20px', border: 'none', 
            background: activeTab === 'product' ? '#fff' : 'transparent', 
            color: activeTab === 'product' ? '#111' : '#64748b', 
            borderRadius: '8px', cursor: 'pointer', fontWeight: 600,
            display: 'flex', alignItems: 'center', gap: '8px',
            boxShadow: activeTab === 'product' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
          }}
        >
          <Package size={18} /> Product Alert
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: activeTab === 'product' ? '1fr 1fr' : '1fr', gap: '32px' }}>
        
        {/* Left Side: Form */}
        <div style={{ background: '#fff', padding: '28px', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
          <div style={{ marginBottom: '20px', fontSize: '16px', fontWeight: 600, color: '#0f172a' }}>
            {activeTab === 'global' ? 'Craft Global Notification' : 'Notification Details'}
          </div>

          <form onSubmit={handleSendPush} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#64748b', marginBottom: '8px' }}>Title</label>
              <input 
                type="text"
                placeholder="e.g. New Year Bonanza!"
                value={pushData.title}
                onChange={e => setPushData({ ...pushData, title: e.target.value })}
                style={{ width: '100%', padding: '12px 14px', borderRadius: '10px', border: '1px solid #e2e8f0', outline: 'none', fontSize: '14px', boxSizing: 'border-box' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#64748b', marginBottom: '8px' }}>Action URL</label>
              <div style={{ display: 'flex', alignItems: 'center', position: 'relative' }}>
                <input 
                  type="text"
                  placeholder="e.g. /offers or /product/123"
                  value={pushData.url}
                  onChange={e => setPushData({ ...pushData, url: e.target.value })}
                  style={{ width: '100%', padding: '12px 14px', borderRadius: '10px', border: '1px solid #e2e8f0', outline: 'none', fontSize: '14px', boxSizing: 'border-box' }}
                />
                <ExternalLink size={16} style={{ position: 'absolute', right: '14px', color: '#94a3b8' }} />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#64748b', marginBottom: '8px' }}>Message Body</label>
              <textarea 
                placeholder="Type your alert message here..."
                value={pushData.message}
                onChange={e => setPushData({ ...pushData, message: e.target.value })}
                rows={4}
                style={{ width: '100%', padding: '12px 14px', borderRadius: '10px', border: '1px solid #e2e8f0', outline: 'none', fontSize: '14px', resize: 'vertical', boxSizing: 'border-box', fontFamily: 'inherit' }}
              />
            </div>

            <button 
              type="submit" 
              disabled={sending}
              style={{
                background: sending ? '#94a3b8' : '#ef4444',
                color: '#fff',
                padding: '14px',
                borderRadius: '10px',
                border: 'none',
                fontWeight: 700,
                fontSize: '15px',
                cursor: sending ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                marginTop: '10px'
              }}
            >
              {sending ? 'Sending Broadcast...' : <><Send size={18} /> Send to All Devices</>}
            </button>
          </form>

          <div style={{ marginTop: '24px', padding: '16px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0', display: 'flex', gap: '12px' }}>
            <Info size={20} color="#3b82f6" style={{ flexShrink: 0 }} />
            <p style={{ margin: 0, fontSize: '12px', color: '#64748b', lineHeight: '1.5' }}>
              <strong>Tip:</strong> Keep titles under 40 characters and messages under 150 for best visibility on mobile devices.
            </p>
          </div>
        </div>

        {/* Right Side: Product Search (Only for Product Alert tab) */}
        {activeTab === 'product' && (
          <div style={{ background: '#fff', padding: '28px', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
            <div style={{ marginBottom: '20px', fontSize: '16px', fontWeight: 600, color: '#0f172a' }}>
              Link a Product
            </div>
            
            <div style={{ position: 'relative', marginBottom: '16px' }}>
              <input 
                type="text"
                placeholder="Search products by name..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSearchProducts()}
                style={{ width: '100%', padding: '12px 45px 12px 14px', borderRadius: '10px', border: '1px solid #e2e8f0', outline: 'none', fontSize: '14px', boxSizing: 'border-box' }}
              />
              <button 
                onClick={handleSearchProducts}
                style={{ position: 'absolute', right: '5px', top: '5px', bottom: '5px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '8px', padding: '0 12px', cursor: 'pointer' }}
              >
                <Search size={18} />
              </button>
            </div>

            {selectedProduct && (
              <div style={{ padding: '12px', background: '#ecfdf5', borderRadius: '10px', border: '1px solid #10b981', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '40px', height: '40px', background: '#10b981', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyCenter: 'center', color: '#fff' }}>
                  <Package size={20} style={{ margin: 'auto' }} />
                </div>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: '#065f46' }}>{selectedProduct.item_name}</div>
                  <div style={{ fontSize: '12px', color: '#059669' }}>Selected Target</div>
                </div>
                <button 
                  onClick={() => setSelectedProduct(null)}
                  style={{ marginLeft: 'auto', background: 'transparent', border: 'none', color: '#b91c1c', cursor: 'pointer', fontSize: '12px', fontWeight: 600 }}
                >
                  Clear
                </button>
              </div>
            )}

            <div style={{ maxHeight: '350px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {searching ? (
                <p style={{ textAlign: 'center', color: '#94a3b8', fontSize: '14px' }}>Searching...</p>
              ) : searchResults.length > 0 ? (
                searchResults.map(p => (
                  <div 
                    key={p.id} 
                    onClick={() => selectProduct(p)}
                    style={{ 
                      padding: '12px', border: '1px solid #f1f5f9', borderRadius: '10px', cursor: 'pointer',
                      transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '12px'
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <div style={{ width: '45px', height: '45px', background: '#f1f5f9', borderRadius: '8px', overflow: 'hidden' }}>
                      {p.image_url ? (
                        <img src={p.image_url} alt={p.item_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <Package size={20} color="#94a3b8" style={{ margin: '12px' }} />
                      )}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a' }}>{p.item_name}</div>
                      <div style={{ fontSize: '12px', color: '#64748b' }}>₹{p.rental_price_per_day}/{p.price_unit || 'day'} · {p.city}</div>
                    </div>
                  </div>
                ))
              ) : searchQuery && !searching ? (
                <p style={{ textAlign: 'center', color: '#94a3b8', fontSize: '14px' }}>No products found.</p>
              ) : (
                <div style={{ textAlign: 'center', padding: '40px 20px', color: '#cbd5e1' }}>
                   <Search size={40} style={{ marginBottom: '12px' }} />
                   <div style={{ fontSize: '14px' }}>Find a product to create an instant alert</div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
