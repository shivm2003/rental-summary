import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, Wallet, Percent, BarChart2,
  ChevronDown, Plus, Loader2
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import './Earnings.scss';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

export default function Earnings() {
  const { user } = useAuth();
  const token = localStorage.getItem('token');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEarnings = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`${API_URL}/api/lender/dashboard/earnings`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.data.success) {
          setData(res.data);
        }
      } catch (err) {
        console.error(err);
        toast.error('Failed to load earnings');
      } finally {
        setLoading(false);
      }
    };
    if (token) fetchEarnings();
  }, [token]);

  if (loading || !data) {
    return (
      <div className="earnings-page" style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
        <Loader2 className="spinning" style={{ animation: 'spin 1s linear infinite' }} size={48} color="#2874f0" />
      </div>
    );
  }

  const { earnings, productPerformance } = data;

  return (
    <div className="earnings-page">
      <div className="grid top-grid">
        
        {/* Total Earnings Hero Card */}
        <div className="card hero-card col-span-2">
          <div className="card-header-flex">
            <span className="hero-lbl">TOTAL EARNINGS</span>
            <TrendingUp size={20} className="text-blue-200" />
          </div>
          <div className="hero-val">₹{earnings.total}</div>
          <div className="hero-sub font-bold text-white">+0% <span className="text-blue-200 font-normal">from last month</span></div>
          
          <div className="payout-row mt-6">
            <div>
              <div className="hero-lbl">PENDING PAYOUTS</div>
              <div className="hero-val-sm">₹{earnings.pending}</div>
            </div>
            <button className="btn-white">Request Payout</button>
          </div>
        </div>

        {/* Breakdown Cards Container */}
        <div className="breakdown-cards col-span-2">
          <div className="grid-2">
            
            <div className="card stat-card">
              <div className="stat-icon bg-gray-100"><Wallet size={20} className="text-gray-600"/></div>
              <div className="stat-lbl mt-4">GROSS REVENUE</div>
              <div className="stat-val">₹{earnings.gross}</div>
              <div className="progress-bar mt-4">
                <div className="progress fill-blue" style={{width: '0%'}}></div>
              </div>
            </div>

            <div className="card stat-card">
              <div className="stat-icon bg-red-50"><Percent size={20} className="text-red-500"/></div>
              <div className="stat-lbl mt-4">PLATFORM COMMISSION (15%)</div>
              <div className="stat-val">₹{earnings.commission}</div>
              <div className="stat-desc mt-2">Deducted automatically per transaction</div>
            </div>

            <div className="card stat-card col-span-2 pulse-card">
              <div className="display-flex align-center gap-4">
                <div className="stat-icon bg-orange-100"><BarChart2 size={24} className="text-orange-600"/></div>
                <div>
                  <div className="pulse-title">Revenue Pulse</div>
                  <div className="pulse-desc">Your monthly growth trajectory</div>
                </div>
              </div>
              <div className="toggle-group">
                <button className="toggle-btn active">6 MONTHS</button>
                <button className="toggle-btn">1 YEAR</button>
              </div>
            </div>

          </div>
        </div>

      </div>

      {/* Chart Section */}
      <div className="card chart-section mt-6">
        <div className="card-header-flex mb-8">
          <h3 className="card-title">Monthly Revenue Breakdown</h3>
          <div className="legend">
            <span className="dot blue"></span> Earnings
            <span className="dot orange"></span> Rentals
          </div>
        </div>
        
        <div className="chart-placeholder">
          <div className="bars-wrapper">
            {/* Visual simulation of chart */}
            <div className="bar-col"><div className="bar" style={{height:'30%'}}></div><span className="blbl">JAN</span></div>
            <div className="bar-col"><div className="bar" style={{height:'45%'}}></div><span className="blbl">FEB</span></div>
            <div className="bar-col"><div className="bar" style={{height:'40%'}}></div><span className="blbl">MAR</span></div>
            <div className="bar-col"><div className="bar" style={{height:'60%'}}></div><span className="blbl">APR</span></div>
            <div className="bar-col"><div className="bar" style={{height:'55%'}}></div><span className="blbl">MAY</span></div>
            <div className="bar-col"><div className="bar" style={{height:'70%'}}></div><span className="blbl">JUN</span></div>
            <div className="bar-col current">
              <div className="bar active" style={{height:'85%'}}>
                <div className="tooltip">₹82,500</div>
              </div>
              <span className="blbl">JUL (CURRENT)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Table Section */}
      <div className="card table-section mt-6">
        <div className="card-header-flex mb-4">
          <h3 className="card-title">Product Performance</h3>
          <a href="#" className="view-link text-secondary">View Detailed Inventory &rarr;</a>
        </div>

        <table className="performance-table">
          <thead>
            <tr>
              <th>PRODUCT NAME</th>
              <th>RENTAL PRICE (₹/DAY)</th>
              <th>TIMES RENTED</th>
              <th>STATUS</th>
              <th>TOTAL EARNINGS</th>
            </tr>
          </thead>
          <tbody>
            {productPerformance.length > 0 ? productPerformance.map((p, i) => (
              <tr key={i}>
                <td>
                  <div className="prod-cell">
                    <img src={p.img} alt={p.name} className="prod-img" />
                    <div>
                      <div className="prod-name">{p.name}</div>
                      <div className="prod-meta">{p.cat}</div>
                    </div>
                  </div>
                </td>
                <td className="font-medium">{p.price}</td>
                <td className="font-medium">{p.rented}</td>
                <td>
                  <span className={`badge badge-${p.status.toLowerCase()}`}>{p.status}</span>
                </td>
                <td className="font-bold text-blue">{p.earnings}</td>
              </tr>
            )) : (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                  No performance data available yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>

        <div className="load-more">
          <button className="load-btn">Load More Products <ChevronDown size={16}/></button>
        </div>
      </div>

    </div>
  );
}
