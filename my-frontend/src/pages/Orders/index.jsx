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
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '20px' }}>
          {orders.map(o => (
            <div key={o.id} style={{ border: '1px solid #eee', padding: '15px', borderRadius: '8px' }}>
              <h4>Order #{o.id}</h4>
              <p>Total: ₹{o.total_amount}</p>
              <p>Status: {o.status}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
