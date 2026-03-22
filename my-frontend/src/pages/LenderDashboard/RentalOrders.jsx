import React, { useState, useEffect } from 'react';
import { 
  ClipboardList, Calendar, Wallet, ShoppingBag, 
  MessageSquare, Eye, Phone, Clock, HelpCircle,
  ChevronLeft, ChevronRight, Loader2
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import './RentalOrders.scss';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

export default function RentalOrders() {
  const { user } = useAuth();
  const token = localStorage.getItem('token');
  const [activeTab, setActiveTab] = useState('Active Rentals');
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const tabs = ['Active Rentals', 'Upcoming Bookings', 'Completed', 'Extensions/Returns'];

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`${API_URL}/api/lender/dashboard/orders`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.data.success) {
          setOrders(res.data.orders);
        }
      } catch (err) {
        console.error(err);
        toast.error('Failed to load orders');
      } finally {
        setLoading(false);
      }
    };
    if (token) fetchOrders();
  }, [token]);

  return (
    <div className="rental-orders">
      <div className="page-header">
        <div>
          <h1 className="page-title">Rental Orders</h1>
          <p className="page-subtitle">Manage your active, upcoming, and past rental transactions.</p>
        </div>
        <div className="header-actions">
          <button className="btn-secondary">All Orders</button>
          <button className="btn-primary-outline">Export CSV</button>
        </div>
      </div>

      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-header">
            <div className="stat-icon bg-blue-100"><ClipboardList size={20} className="text-blue-600"/></div>
            <div className="stat-badge text-blue-600">0% vs last mo</div>
          </div>
          <div className="stat-lbl">ACTIVE RENTALS</div>
          <div className="stat-val">0</div>
        </div>
        <div className="stat-card">
          <div className="stat-header">
            <div className="stat-icon bg-gray-100"><Calendar size={20} className="text-gray-600"/></div>
            <div className="stat-badge neutral">0 today</div>
          </div>
          <div className="stat-lbl">UPCOMING</div>
          <div className="stat-val">0</div>
        </div>
        <div className="stat-card">
          <div className="stat-header">
            <div className="stat-icon bg-orange-100"><Wallet size={20} className="text-orange-600"/></div>
            <div className="stat-badge text-orange-600">₹0 pending</div>
          </div>
          <div className="stat-lbl">EXPECTED REVENUE</div>
          <div className="stat-val">₹0</div>
        </div>
        <div className="stat-card">
          <div className="stat-header">
            <div className="stat-icon bg-red-100"><ShoppingBag size={20} className="text-red-600"/></div>
            <div className="stat-badge danger">0 Due Today</div>
          </div>
          <div className="stat-lbl">RETURNS DUE</div>
          <div className="stat-val">0</div>
        </div>
      </div>

      <div className="table-container">
        <div className="table-header">
          <div className="tabs">
            {tabs.map(tab => (
              <button 
                key={tab} 
                className={`tab ${activeTab === tab ? 'active' : ''}`}
                onClick={() => setActiveTab(tab)}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        <table className="orders-table">
          <thead>
            <tr>
              <th>RENTAL ID</th>
              <th>PRODUCT</th>
              <th>CUSTOMER</th>
              <th>DURATION</th>
              <th>STATUS</th>
              <th>TOTAL AMOUNT</th>
              <th>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '2rem' }}>
                  <Loader2 className="spinning" style={{ animation: 'spin 1s linear infinite', margin: '0 auto' }} />
                </td>
              </tr>
            ) : orders.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
                  <ShoppingBag size={48} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
                  <p style={{ fontSize: '1.2rem', fontWeight: '500' }}>No {activeTab.toLowerCase()} found.</p>
                  <p style={{ marginTop: '0.5rem', opacity: 0.8 }}>When customers rent your products, they will appear here.</p>
                </td>
              </tr>
            ) : (
              orders.map((order, i) => (
                <tr key={i}>
                  <td className="font-bold text-blue">{order.id}</td>
                  <td>
                    <div className="prod-cell">
                      <img src={order.img} alt={order.product} className="prod-img" />
                      <div className="prod-name">{order.product}</div>
                    </div>
                  </td>
                  <td>
                    <div className="customer-name">{order.customer}</div>
                    <div className="customer-loc">{order.location}</div>
                  </td>
                  <td>
                    <div className="date-range">{order.start} - {order.end}</div>
                    <div className={`duration ${order.duration.includes('OVERDUE') ? 'text-red' : order.duration.includes('Starts') ? 'text-orange' : 'text-secondary'}`}>
                      {order.duration}
                    </div>
                  </td>
                  <td>
                    <span className={`badge badge-${order.status.toLowerCase()}`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="font-bold">{order.amount}</td>
                  <td>
                    <div className="actions">
                      {order.status === 'MAINTENANCE' ? (
                        <>
                          <button className="icon-btn text-red"><Phone size={16}/></button>
                          <button className="icon-btn"><Eye size={16}/></button>
                        </>
                      ) : order.status === 'COMPLETED' ? (
                        <>
                          <button className="icon-btn"><Eye size={16}/></button>
                          <button className="icon-btn"><Clock size={16}/></button>
                        </>
                      ) : (
                        <>
                          <button className="icon-btn"><Eye size={16}/></button>
                          <button className="icon-btn"><MessageSquare size={16}/></button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        <div className="pagination">
          <span className="info">Showing {orders.length > 0 ? 1 : 0} to {orders.length} of {orders.length} orders</span>
          <div className="pages">
            <button className="page-btn"><ChevronLeft size={16}/></button>
            <button className="page-btn active">1</button>
            <button className="page-btn"><ChevronRight size={16}/></button>
          </div>
        </div>
      </div>

      <div className="bottom-panels">
        <div className="panel boost-panel">
          <div className="p-content">
            <h3>Boost Your Revenue</h3>
            <p>Items with "Instant Booking" enabled see a 40% higher rental frequency. Update your active products now.</p>
          </div>
          <button className="btn-white">Enable Now</button>
        </div>
        <div className="panel help-panel">
          <div className="p-icon"><HelpCircle size={28}/></div>
          <div className="p-content text-center">
            <h3>Need help?</h3>
            <p>Chat with our Lender Support team for resolving order disputes.</p>
            <a href="#">Open Help Center</a>
          </div>
        </div>
      </div>
    </div>
  );
}
