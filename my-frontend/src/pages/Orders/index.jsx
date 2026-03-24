import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import { Package } from 'lucide-react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5001';

export default function Orders() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get(`${API}/api/orders/my-orders`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setOrders(res.data?.orders || []);
      } catch (err) {
        console.error("Orders fetch failed", err);
      } finally {
        setLoading(false);
      }
    };
    if (user) fetchOrders();
    else setLoading(false);
  }, [user]);

  const getDynamicStatus = (order) => {
    if (order.status === 'CANCELLED' || order.status === 'REJECTED') {
      return order.status;
    }
    const product = order.products?.[0];
    if (!product || !product.rentalPeriod?.start || !product.rentalPeriod?.end) {
      return order.status;
    }

    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const start = new Date(product.rentalPeriod.start);
    start.setHours(0, 0, 0, 0);

    const end = new Date(product.rentalPeriod.end);
    end.setHours(23, 59, 59, 999);

    if (now < start) {
      return 'Upcoming Order';
    } else if (now > end) {
      return 'Completed / Past Order';
    } else {
      return 'Active';
    }
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case 'Active': return { bg: '#dcfce7', color: '#166534' };
      case 'Upcoming Order': return { bg: '#e0e7ff', color: '#3730a3' };
      case 'Completed / Past Order': return { bg: '#f1f5f9', color: '#475569' };
      case 'CANCELLED': 
      case 'REJECTED': return { bg: '#fee2e2', color: '#991b1b' };
      default: return { bg: '#f1f5f9', color: '#475569' };
    }
  };

  if (!user) return <div className="container" style={{ padding: '100px 20px', minHeight: '60vh', textAlign: 'center' }}>Please login to view your orders.</div>;

  return (
    <div className="container" style={{ padding: '60px 20px', minHeight: '60vh' }}>
      <h2 style={{ fontSize: '2rem', marginBottom: '20px' }}>My Orders</h2>
      {loading ? <p>Loading orders...</p> : orders.length === 0 ? (
        <div style={{ textAlign: 'center', marginTop: '60px', color: '#666' }}>
          <Package size={50} style={{ margin: '0 auto 15px', display: 'block' }} />
          <h3>No previous orders found.</h3>
          <p>You haven't rented any items yet.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '20px' }}>
          {orders.map(o => {
            const dynamicStatus = getDynamicStatus(o);
            const style = getStatusStyle(dynamicStatus);
            return (
            <div key={o.id} style={{ border: '1px solid #e2e8f0', padding: '20px', borderRadius: '12px', background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px', marginBottom: '16px' }}>
                <div>
                  <h4 style={{ margin: '0 0 4px 0', color: '#0f172a' }}>Order #{o.id}</h4>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>Placed on {new Date(o.createdAt).toLocaleDateString()}</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ 
                    display: 'inline-block', 
                    padding: '4px 12px', 
                    borderRadius: '20px', 
                    fontSize: '0.85rem', 
                    fontWeight: 600, 
                    background: style.bg,
                    color: style.color
                  }}>
                    {dynamicStatus}
                  </span>
                  <p style={{ margin: '4px 0 0 0', fontWeight: 'bold' }}>Total: ₹{o.totalAmount}</p>
                </div>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {(o.products || []).map((p, idx) => (
                  <div key={idx} style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                    <div style={{ width: '80px', height: '80px', borderRadius: '8px', overflow: 'hidden', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                      <img 
                        src={p.product?.images?.[0]?.url || '/assets/images/placeholder.jpg'} 
                        alt={p.product?.name} 
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    </div>
                    <div style={{ flex: 1 }}>
                      <h4 style={{ margin: '0 0 4px 0', fontSize: '1.05rem', color: '#1e293b' }}>{p.product?.name}</h4>
                      <p style={{ margin: '0 0 4px 0', color: '#64748b', fontSize: '0.9rem' }}>Qty: {p.quantity}</p>
                      {p.rentalPeriod && p.rentalPeriod.start && (
                        <p style={{ margin: 0, color: '#3b82f6', fontSize: '0.9rem', fontWeight: 500 }}>
                          Rental: {new Date(p.rentalPeriod.start).toLocaleDateString()} to {new Date(p.rentalPeriod.end).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
