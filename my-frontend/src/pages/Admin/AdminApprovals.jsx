import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Edit } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

export default function AdminApprovals() {
  const [activeTab, setActiveTab] = useState('products');
  
  // Data State
  const [pendingProducts, setPendingProducts] = useState([]);
  const [pendingLenders, setPendingLenders] = useState([]);
  const [categories, setCategories] = useState([]);
  
  // Editing State
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editCategory, setEditCategory] = useState({ id: '', name: '' });

  // Reject Modal State
  const [rejectModal, setRejectModal] = useState({ open: false, type: '', id: null });
  const [rejectRemark, setRejectRemark] = useState('');

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      if (activeTab === 'products') {
        const [listRes, catRes] = await Promise.all([
          fetch(`${API_URL}/api/admin/listings/pending`, { headers }),
          fetch(`${API_URL}/api/categories`)
        ]);
        const listData = await listRes.json();
        const catData = await catRes.json();
        if (listData.success) setPendingProducts(listData.listings);
        if (catData.success || catData.categories) setCategories(catData.categories || catData.data?.categories || []);
      } else {
        const lendRes = await fetch(`${API_URL}/api/admin/lenders/pending`, { headers });
        const lendData = await lendRes.json();
        if (lendData.success) setPendingLenders(lendData.applications);
      }
    } catch (err) {
      console.error('Error fetching admin approval data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveProduct = async (id, catId, catName) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/admin/listings/${id}/approve`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ category_id: catId, category: catName })
      });
      const data = await res.json();
      if (data.success) {
        alert('Product approved successfully!');
        setEditingId(null);
        setPendingProducts(prev => prev.filter(p => p.id !== id));
      } else alert(data.message || 'Error approving product');
    } catch (err) {
      alert('Network error');
    }
  };

  const handleApproveLender = async (id) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/admin/lenders/${id}/approve`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        alert('Lender approved successfully!');
        setPendingLenders(prev => prev.filter(l => l.id !== id));
      } else alert(data.message || 'Error approving lender');
    } catch (err) {
      alert('Network error');
    }
  };

  const openRejectModal = (type, id) => {
    setRejectModal({ open: true, type, id });
    setRejectRemark('');
  };

  const handleReject = async () => {
    if (!rejectRemark.trim()) return alert('Please enter a remark for rejection.');
    const { type, id } = rejectModal;
    const endpoint = type === 'product'
      ? `${API_URL}/api/admin/listings/${id}/reject`
      : `${API_URL}/api/admin/lenders/${id}/reject`;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(endpoint, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ remark: rejectRemark.trim() })
      });
      const data = await res.json();
      if (data.success) {
        alert(type === 'product' ? 'Product rejected.' : 'Lender application rejected.');
        if (type === 'product') {
          setPendingProducts(prev => prev.filter(p => p.id !== id));
        } else {
          setPendingLenders(prev => prev.filter(l => l.id !== id));
        }
        setRejectModal({ open: false, type: '', id: null });
        setRejectRemark('');
      } else alert(data.message || 'Error rejecting');
    } catch (err) {
      alert('Network error');
    }
  };

  // ====================== MODAL ==========================
  const RejectModal = () => {
    if (!rejectModal.open) return null;
    return (
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
      }}>
        <div style={{
          background: '#fff', borderRadius: '12px', padding: '28px 32px', width: '420px', maxWidth: '92vw',
          boxShadow: '0 12px 40px rgba(0,0,0,0.18)'
        }}>
          <h3 style={{ margin: '0 0 6px', fontSize: '18px', fontWeight: 700, color: '#0f172a' }}>
            Reject {rejectModal.type === 'product' ? 'Product' : 'Lender Application'}
          </h3>
          <p style={{ color: '#64748b', fontSize: '14px', margin: '0 0 16px' }}>
            Please provide a reason for rejection. This will be stored for records.
          </p>
          <textarea
            value={rejectRemark}
            onChange={e => setRejectRemark(e.target.value)}
            placeholder="Enter rejection reason / remark..."
            rows={4}
            style={{
              width: '100%', padding: '10px 12px', border: '1.5px solid #cbd5e1', borderRadius: '8px',
              fontSize: '14px', resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box'
            }}
          />
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' }}>
            <button
              onClick={() => { setRejectModal({ open: false, type: '', id: null }); setRejectRemark(''); }}
              style={{ padding: '8px 18px', background: '#e2e8f0', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, color: '#475569' }}
            >Cancel</button>
            <button
              onClick={handleReject}
              style={{ padding: '8px 18px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}
            >Reject</button>
          </div>
        </div>
      </div>
    );
  };

  // ====================== RENDER ==========================
  return (
    <div style={{ padding: '32px', fontFamily: "'DM Sans', sans-serif" }}>
      <RejectModal />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: '700' }}>Pending Approvals</h2>
        
        <div style={{ display: 'flex', gap: '8px', background: '#e2e8f0', padding: '4px', borderRadius: '8px' }}>
          <button 
            onClick={() => setActiveTab('products')} 
            style={{ padding: '8px 16px', border: 'none', background: activeTab === 'products' ? '#fff' : 'transparent', color: activeTab === 'products' ? '#0f172a' : '#64748b', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, boxShadow: activeTab === 'products' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }}
          >
            Products
          </button>
          <button 
            onClick={() => setActiveTab('lenders')} 
            style={{ padding: '8px 16px', border: 'none', background: activeTab === 'lenders' ? '#fff' : 'transparent', color: activeTab === 'lenders' ? '#0f172a' : '#64748b', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, boxShadow: activeTab === 'lenders' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }}
          >
            Lender Applications
          </button>
        </div>
      </div>
      
      {loading ? (
        <div style={{ padding: '32px', textAlign: 'center' }}>Loading...</div>
      ) : activeTab === 'products' ? (
        pendingProducts.length === 0 ? <p>No products currently pending approval.</p> : (
          <div style={{ overflowX: 'auto', background: '#fff', borderRadius: '10px', padding: '20px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <th style={{ padding: '12px' }}>Item Name</th>
                  <th style={{ padding: '12px' }}>Lender</th>
                  <th style={{ padding: '12px' }}>Category</th>
                  <th style={{ padding: '12px' }}>Price/Day</th>
                  <th style={{ padding: '12px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pendingProducts.map(listing => (
                  <tr key={listing.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '12px' }}>{listing.item_name}</td>
                    <td style={{ padding: '12px' }}>{listing.lender_name}</td>
                    <td style={{ padding: '12px' }}>
                      {editingId === listing.id ? (
                        <select 
                          value={editCategory.id} 
                          onChange={(e) => {
                            const option = e.target.options[e.target.selectedIndex];
                            setEditCategory({ id: e.target.value, name: option.text });
                          }}
                          style={{ padding: '6px', borderRadius: '4px', border: '1px solid #ccc' }}
                        >
                          <option value="">Select Category</option>
                          {categories.map(c => (
                            <option key={c.id || c._id} value={c.id || c._id}>{c.name}</option>
                          ))}
                        </select>
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {listing.category}
                          <Edit size={14} style={{ cursor: 'pointer', color: '#3b82f6' }} onClick={() => {
                            setEditingId(listing.id);
                            setEditCategory({ id: listing.category_id, name: listing.category });
                          }} />
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '12px' }}>₹{listing.rental_price_per_day}</td>
                    <td style={{ padding: '12px' }}>
                      {editingId === listing.id ? (
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button onClick={() => handleApproveProduct(listing.id, editCategory.id, editCategory.name)} style={{ padding: '6px 12px', background: '#10b981', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Save & Approve</button>
                          <button onClick={() => setEditingId(null)} style={{ padding: '6px 12px', background: '#94a3b8', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Cancel</button>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button onClick={() => handleApproveProduct(listing.id, listing.category_id, listing.category)} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', background: '#10b981', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                            <CheckCircle size={16} /> Approve
                          </button>
                          <button onClick={() => openRejectModal('product', listing.id)} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                            <XCircle size={16} /> Reject
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      ) : (
        pendingLenders.length === 0 ? <p>No lenders currently pending approval.</p> : (
          <div style={{ overflowX: 'auto', background: '#fff', borderRadius: '10px', padding: '20px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <th style={{ padding: '12px' }}>Username</th>
                  <th style={{ padding: '12px' }}>Email</th>
                  <th style={{ padding: '12px' }}>Type</th>
                  <th style={{ padding: '12px' }}>Location</th>
                  <th style={{ padding: '12px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pendingLenders.map(app => (
                  <tr key={app.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '12px' }}>{app.username}</td>
                    <td style={{ padding: '12px' }}>{app.email}<br/><small style={{color:'#64748b'}}>{app.phone}</small></td>
                    <td style={{ padding: '12px', textTransform: 'capitalize' }}>{app.lender_type}</td>
                    <td style={{ padding: '12px' }}>{app.city}, {app.state}</td>
                    <td style={{ padding: '12px' }}>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button onClick={() => handleApproveLender(app.id)} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', background: '#10b981', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                          <CheckCircle size={16} /> Approve
                        </button>
                        <button onClick={() => openRejectModal('lender', app.id)} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                          <XCircle size={16} /> Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}
    </div>
  );
}
