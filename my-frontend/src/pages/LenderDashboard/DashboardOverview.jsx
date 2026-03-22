import React, { useState, useEffect } from 'react';
import { 
  DollarSign, Package, CheckCircle, AlertTriangle, 
  MessageSquare, Settings, ArrowUpRight, Banknote, ShoppingBag, Wrench, Loader2
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import './DashboardOverview.scss';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

export default function DashboardOverview() {
  const { user } = useAuth();
  const token = localStorage.getItem('token');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`${API_URL}/api/lender/dashboard/stats`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.data.success) {
          setData(res.data);
        }
      } catch (err) {
        console.error(err);
        toast.error('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };
    if (token) fetchStats();
  }, [token]);

  if (loading || !data) {
    return (
      <div className="dashboard-overview" style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
        <Loader2 className="spinning" style={{ animation: 'spin 1s linear infinite' }} size={48} color="#2874f0" />
      </div>
    );
  }

  const { stats, topAssets, recentActivity } = data;

  return (
    <div className="dashboard-overview">
      <div className="page-header">
        <div>
          <h1 className="page-title">Lender Ledger Overview</h1>
          <p className="page-subtitle">Real-time performance metrics for your asset portfolio.</p>
        </div>
        <div className="header-actions">
          <button className="btn-secondary">📅 Last 30 Days</button>
          <button className="btn-primary">⬇ Export Report</button>
        </div>
      </div>

      <div className="grid top-cards">
        {/* Earnings Card */}
        <div className="card hero-card">
          <div className="card-lbl">TOTAL LIFETIME EARNINGS</div>
          <div className="card-val-lg">₹{stats.totalEarnings}</div>
          <DollarSign className="hero-icon" size={64} />
          
          <div className="bottom-stats">
            <div>
              <div className="sub-lbl">MONTHLY EARNINGS</div>
              <div className="sub-val">₹{stats.monthlyEarnings}</div>
            </div>
            <div>
              <div className="sub-lbl">PENDING PAYOUTS</div>
              <div className="sub-val">₹{stats.pendingPayouts}</div>
            </div>
          </div>
        </div>

        {/* Total Products */}
        <div className="card stat-card">
          <div className="card-header">
            <div>
              <div className="card-lbl">TOTAL PRODUCTS</div>
              <div className="card-val">{stats.totalProducts}</div>
            </div>
            <div className="icon-wrapper blue">
              <Package size={24} />
            </div>
          </div>
          <div className="card-footer pos">
            <ArrowUpRight size={16} />
            <span>+0 since last month</span>
          </div>
        </div>

        {/* Available */}
        <div className="card stat-card">
          <div className="card-header">
            <div>
              <div className="card-lbl">AVAILABLE</div>
              <div className="card-val">{stats.availableProducts}</div>
            </div>
            <div className="icon-wrapper green">
              <CheckCircle size={24} />
            </div>
          </div>
          <div className="card-footer neutral">
            <span>{stats.totalProducts > 0 ? Math.round((stats.availableProducts / stats.totalProducts) * 100) : 0}% of total inventory</span>
          </div>
        </div>
      </div>

      <div className="grid middle-cards">
        {/* Chart Proxy */}
        <div className="card col-span-2 chart-card">
          <div className="card-header-flex">
            <h3 className="card-title">Monthly Revenue Performance</h3>
            <div className="legend">
              <span className="dot blue"></span> REVENUE
              <span className="dot orange"></span> GOAL
            </div>
          </div>
          <div className="chart-placeholder">
            {/* CSS bars for visualization */}
            <div className="bars-container">
              <div className="bar-group"><div className="bar orange" style={{height:'40%'}}></div><div className="bar blue" style={{height:'35%'}}></div><span className="blbl">JAN</span></div>
              <div className="bar-group"><div className="bar orange" style={{height:'45%'}}></div><div className="bar blue" style={{height:'50%'}}></div><span className="blbl">FEB</span></div>
              <div className="bar-group"><div className="bar orange" style={{height:'50%'}}></div><div className="bar blue" style={{height:'45%'}}></div><span className="blbl">MAR</span></div>
              <div className="bar-group"><div className="bar orange" style={{height:'55%'}}></div><div className="bar blue" style={{height:'65%'}}></div><span className="blbl">APR</span></div>
              <div className="bar-group"><div className="bar orange" style={{height:'60%'}}></div><div className="bar blue" style={{height:'55%'}}></div><span className="blbl">MAY</span></div>
              <div className="bar-group"><div className="bar orange" style={{height:'65%'}}></div><div className="bar blue" style={{height:'80%'}}></div><span className="blbl">JUN</span></div>
            </div>
          </div>
        </div>

        {/* Utilization Gauge */}
        <div className="card utilization-card">
          <h3 className="card-title">Asset Utilization</h3>
          <p className="card-subtitle">Current operational capacity</p>
          
          <div className="gauge-container">
             <div className="empty-gauge" style={{ width: '120px', height: '120px', borderRadius: '50%', border: '8px solid #cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '1rem auto' }}>
               <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#64748b' }}>0%</span>
             </div>
          </div>
          
          <div className="util-stats">
            <div className="util-row"><span>Rented Units</span> <span className="val text-dark">{stats.rentedUnits}</span></div>
            <div className="util-row"><span>Under Maintenance</span> <span className="val text-red">{stats.maintenanceUnits}</span></div>
          </div>
        </div>
      </div>

      <div className="grid middle-cards lower">
        {/* Top 3 Assets */}
        <div className="card col-span-2 table-card">
          <div className="card-header-flex">
            <h3 className="card-title">Top 3 Performing Assets</h3>
            <a href="/lender/products" className="view-all">View All</a>
          </div>
          <table className="asset-table">
            <thead>
              <tr>
                <th>PRODUCT DETAIL</th>
                <th>RENTAL COUNT</th>
                <th>REVENUE GENERATED</th>
                <th>STATUS</th>
              </tr>
            </thead>
            <tbody>
              {topAssets.length > 0 ? topAssets.map((asset, i) => (
                <tr key={i}>
                  <td>
                    <div className="prod-cell">
                      <div className="prod-img img-1" style={{ backgroundImage: `url(${asset.img})` }}></div>
                      <div>
                        <div className="prod-name">{asset.name}</div>
                        <div className="prod-meta">{asset.cat}</div>
                      </div>
                    </div>
                  </td>
                  <td>{asset.rentals}</td>
                  <td className="text-blue font-bold">₹{asset.revenue}</td>
                  <td><span className={`badge badge-${asset.status.toLowerCase()}`}>{asset.status}</span></td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="4" style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                    No rental data available yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Activity Feed */}
        <div className="card feed-card">
          <div className="card-header-flex">
            <h3 className="card-title">Activity Feed</h3>
            {recentActivity.length > 0 && <span className="badge-new">{recentActivity.length} New</span>}
          </div>

          <div className="feed-list">
            {recentActivity.length > 0 ? recentActivity.map((act, i) => (
              <div className="feed-item" key={i}>
                <div className={`f-icon bg-${act.color || 'blue'}`}><ShoppingBag size={16}/></div>
                <div className="f-content">
                  <div className="f-title">{act.title}</div>
                  <div className="f-desc">{act.desc}</div>
                  <div className="f-time">{act.time}</div>
                </div>
              </div>
            )) : (
              <div className="empty-feed" style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                No recent activity.
              </div>
            )}
          </div>
          <div className="view-history">
            <a href="#">View Full History</a>
          </div>
        </div>
      </div>

      <div className="grid alert-cards">
        <div className="alert-box danger">
          <AlertTriangle size={24} />
          <div>
            <div className="alert-title">Maintenance Alert</div>
            <div className="alert-desc">3 products need immediate attention</div>
          </div>
        </div>
        <div className="alert-box info">
          <MessageSquare size={24} />
          <div>
            <div className="alert-title">Lender Rating</div>
            <div className="alert-desc">4.9 / 5.0 (Based on 124 rentals)</div>
          </div>
        </div>
        <div className="alert-box neutral">
          <Settings size={24} />
          <div>
            <div className="alert-title">Inactive Assets</div>
            <div className="alert-desc">2 products hidden from listings</div>
          </div>
        </div>
      </div>
    </div>
  );
}
