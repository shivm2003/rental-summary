import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { MessageSquare, Clock, CheckCircle, AlertTriangle } from 'lucide-react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5001';

const STATUS_CONFIG = {
  OPEN: { label: 'Open', bg: '#fee2e2', color: '#991b1b', icon: AlertTriangle },
  IN_PROGRESS: { label: 'In Progress', bg: '#fef3c7', color: '#92400e', icon: Clock },
  RESOLVED: { label: 'Resolved', bg: '#dcfce7', color: '#166534', icon: CheckCircle },
};

export default function AdminQueries() {
  const [queries, setQueries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');

  useEffect(() => { fetchQueries(); }, []);

  const fetchQueries = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API}/api/admin/queries`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setQueries(res.data.queries || []);
    } catch (err) {
      toast.error('Failed to load queries');
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id, status) => {
    try {
      const token = localStorage.getItem('token');
      await axios.patch(`${API}/api/admin/queries/${id}/status`, { status }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success(`Status updated to ${status}`);
      fetchQueries();
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  const filtered = filter === 'ALL' ? queries : queries.filter(q => q.status === filter);

  return (
    <div style={{ padding: '32px', fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#0f172a', margin: 0 }}>
            <MessageSquare size={24} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
            Customer Queries
          </h1>
          <p style={{ color: '#64748b', marginTop: '4px' }}>{queries.length} total queries</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          {['ALL', 'OPEN', 'IN_PROGRESS', 'RESOLVED'].map(s => (
            <button key={s} onClick={() => setFilter(s)} style={{
              padding: '8px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '13px',
              background: filter === s ? '#1d4ed8' : '#f1f5f9',
              color: filter === s ? '#fff' : '#475569'
            }}>
              {s === 'ALL' ? 'All' : STATUS_CONFIG[s]?.label || s}
            </button>
          ))}
        </div>
      </div>

      {loading ? <p>Loading...</p> : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#94a3b8' }}>
          <MessageSquare size={48} style={{ margin: '0 auto 12px', display: 'block' }} />
          <p>No queries found</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {filtered.map(q => {
            const cfg = STATUS_CONFIG[q.status] || STATUS_CONFIG.OPEN;
            const StatusIcon = cfg.icon;
            return (
              <div key={q.id} style={{
                background: '#fff', borderRadius: '12px', padding: '20px',
                border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <div>
                    <h3 style={{ margin: '0 0 4px', fontSize: '16px', color: '#0f172a' }}>
                      {q.subject || 'No Subject'}
                    </h3>
                    <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>
                      Order: {q.order_id} &nbsp;|&nbsp; Product: {q.product_name || q.product_id} &nbsp;|&nbsp; 
                      By: {q.user_name} ({q.user_email})
                    </p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: '4px',
                      padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 600,
                      background: cfg.bg, color: cfg.color
                    }}>
                      <StatusIcon size={14} /> {cfg.label}
                    </span>
                  </div>
                </div>
                <p style={{ margin: '0 0 16px', padding: '12px', background: '#f8fafc', borderRadius: '8px', fontSize: '14px', color: '#334155', lineHeight: 1.6 }}>
                  {q.message}
                </p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                    {new Date(q.created_at).toLocaleString()}
                  </span>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {q.status !== 'IN_PROGRESS' && (
                      <button onClick={() => updateStatus(q.id, 'IN_PROGRESS')} style={{
                        padding: '6px 14px', borderRadius: '6px', border: '1px solid #fbbf24',
                        background: '#fffbeb', color: '#92400e', fontSize: '12px', fontWeight: 600, cursor: 'pointer'
                      }}>Mark In Progress</button>
                    )}
                    {q.status !== 'RESOLVED' && (
                      <button onClick={() => updateStatus(q.id, 'RESOLVED')} style={{
                        padding: '6px 14px', borderRadius: '6px', border: '1px solid #4ade80',
                        background: '#f0fdf4', color: '#166534', fontSize: '12px', fontWeight: 600, cursor: 'pointer'
                      }}>Resolve</button>
                    )}
                    {q.status === 'RESOLVED' && (
                      <button onClick={() => updateStatus(q.id, 'OPEN')} style={{
                        padding: '6px 14px', borderRadius: '6px', border: '1px solid #e2e8f0',
                        background: '#f8fafc', color: '#64748b', fontSize: '12px', fontWeight: 600, cursor: 'pointer'
                      }}>Reopen</button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
