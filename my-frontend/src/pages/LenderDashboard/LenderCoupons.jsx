import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { Tag, Plus, ToggleLeft, ToggleRight, Trash2, Ticket } from 'lucide-react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5001';

export default function LenderCoupons() {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    code: '', discount_type: 'percentage', discount_value: '',
    min_order_amount: '', max_discount: '', usage_limit: '100', expires_at: ''
  });

  const token = localStorage.getItem('token');

  useEffect(() => { fetchCoupons(); }, []);

  const fetchCoupons = async () => {
    try {
      const res = await axios.get(`${API}/api/admin/coupons/my`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCoupons(res.data.coupons || []);
    } catch { } finally { setLoading(false); }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.code || !form.discount_value) return toast.error('Code and discount required');
    try {
      await axios.post(`${API}/api/admin/coupons`, {
        ...form,
        discount_value: parseFloat(form.discount_value),
        min_order_amount: parseFloat(form.min_order_amount) || 0,
        max_discount: form.max_discount ? parseFloat(form.max_discount) : null,
        usage_limit: parseInt(form.usage_limit) || 100,
        expires_at: form.expires_at || null
      }, { headers: { Authorization: `Bearer ${token}` } });
      toast.success('Coupon created!');
      setShowForm(false);
      setForm({ code: '', discount_type: 'percentage', discount_value: '', min_order_amount: '', max_discount: '', usage_limit: '100', expires_at: '' });
      fetchCoupons();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create coupon');
    }
  };

  const toggleCoupon = async (id) => {
    try {
      await axios.patch(`${API}/api/admin/coupons/${id}/toggle`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchCoupons();
    } catch { toast.error('Failed to toggle'); }
  };

  const inputStyle = { width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px', fontFamily: 'inherit' };
  const labelStyle = { display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '4px' };

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Ticket size={24} /> My Coupons
        </h2>
        <button onClick={() => setShowForm(!showForm)} style={{
          display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 20px', background: '#2563eb', color: '#fff',
          border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', fontSize: '14px'
        }}>
          <Plus size={18} /> Create Coupon
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} style={{ background: '#f8fafc', padding: '24px', borderRadius: '12px', marginBottom: '24px', border: '1px solid #e2e8f0' }}>
          <h3 style={{ marginTop: 0, marginBottom: '16px' }}>New Coupon</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={labelStyle}>Coupon Code *</label>
              <input value={form.code} onChange={e => setForm({...form, code: e.target.value.toUpperCase()})} placeholder="E.g. RENT20" style={inputStyle} required />
            </div>
            <div>
              <label style={labelStyle}>Discount Type</label>
              <select value={form.discount_type} onChange={e => setForm({...form, discount_type: e.target.value})} style={inputStyle}>
                <option value="percentage">Percentage (%)</option>
                <option value="flat">Flat (₹)</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>Discount Value *</label>
              <input type="number" value={form.discount_value} onChange={e => setForm({...form, discount_value: e.target.value})} placeholder={form.discount_type === 'percentage' ? 'E.g. 10' : 'E.g. 50'} style={inputStyle} required />
            </div>
            <div>
              <label style={labelStyle}>Min Order Amount (₹)</label>
              <input type="number" value={form.min_order_amount} onChange={e => setForm({...form, min_order_amount: e.target.value})} placeholder="0" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Max Discount (₹)</label>
              <input type="number" value={form.max_discount} onChange={e => setForm({...form, max_discount: e.target.value})} placeholder="No limit" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Usage Limit</label>
              <input type="number" value={form.usage_limit} onChange={e => setForm({...form, usage_limit: e.target.value})} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Expires At</label>
              <input type="date" value={form.expires_at} onChange={e => setForm({...form, expires_at: e.target.value})} style={inputStyle} />
            </div>
          </div>
          <div style={{ marginTop: '16px', display: 'flex', gap: '12px' }}>
            <button type="submit" style={{ padding: '10px 24px', background: '#16a34a', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}>Create</button>
            <button type="button" onClick={() => setShowForm(false)} style={{ padding: '10px 24px', background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: '8px', cursor: 'pointer' }}>Cancel</button>
          </div>
        </form>
      )}

      {loading ? <p>Loading...</p> : coupons.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#94a3b8' }}>
          <Tag size={48} style={{ margin: '0 auto 12px', display: 'block' }} />
          <p>No coupons created yet</p>
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', background: '#fff', borderRadius: '12px', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
            <thead>
              <tr style={{ background: '#f8fafc' }}>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>Code</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>Discount</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>Min Order</th>
                <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '12px', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>Used</th>
                <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '12px', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>Status</th>
                <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '12px', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {coupons.map(c => (
                <tr key={c.id} style={{ borderTop: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '14px 16px', fontWeight: 700, color: '#0f172a', fontFamily: 'monospace', fontSize: '15px' }}>{c.code}</td>
                  <td style={{ padding: '14px 16px' }}>{c.discount_type === 'percentage' ? `${c.discount_value}%` : `₹${c.discount_value}`}{c.max_discount ? ` (max ₹${c.max_discount})` : ''}</td>
                  <td style={{ padding: '14px 16px' }}>₹{c.min_order_amount || 0}</td>
                  <td style={{ padding: '14px 16px', textAlign: 'center' }}>{c.used_count}/{c.usage_limit}</td>
                  <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                    <span style={{ padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 600, background: c.active ? '#dcfce7' : '#fee2e2', color: c.active ? '#166534' : '#991b1b' }}>
                      {c.active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                    <button onClick={() => toggleCoupon(c.id)} title={c.active ? 'Deactivate' : 'Activate'} style={{ background: 'none', border: 'none', cursor: 'pointer', color: c.active ? '#16a34a' : '#dc2626' }}>
                      {c.active ? <ToggleRight size={24} /> : <ToggleLeft size={24} />}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
