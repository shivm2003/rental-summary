import React, { useState, useEffect } from 'react';
import { 
  Plus, Filter, Package, RefreshCw, Banknote, Wrench, 
  Edit2, EyeOff, CheckCircle, ChevronLeft, ChevronRight,
  Upload, Sparkles, Loader2
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import './AssetInventory.scss';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

export default function AssetInventory() {
  const { user } = useAuth();
  const token = localStorage.getItem('token');
  const [activeTab, setActiveTab] = useState('All Assets');
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProducts();
  }, [token]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}/api/lender/dashboard/products`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setAssets(res.data.products);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const tabs = ['All Assets', 'Available', 'Rented', 'Maintenance'];

  // Filter computation
  const filteredAssets = assets.filter(a => {
    if (activeTab === 'All Assets') return true;
    if (activeTab === 'Available') return a.status === 'Available';
    if (activeTab === 'Rented') return a.status === 'Rented';
    if (activeTab === 'Maintenance') return a.status === 'Maintenance';
    return true;
  });

  return (
    <div className="asset-inventory">
      <div className="page-header">
        <div>
          <h1 className="page-title">My Products</h1>
          <p className="page-subtitle">Manage your rental inventory and track asset health.</p>
        </div>
        <div className="header-actions">
          <button className="btn-secondary"><Filter size={16}/> Filter</button>
          <button className="btn-primary"><Plus size={16}/> Add New Asset</button>
        </div>
      </div>

      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-icon bg-blue-100"><Package size={20} className="text-blue-600"/></div>
          <div className="stat-badge">+0 this month</div>
          <div className="stat-lbl">TOTAL ASSETS</div>
          <div className="stat-val">{assets.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon bg-gray-100"><RefreshCw size={20} className="text-gray-600"/></div>
          <div className="stat-badge neutral">0% utilization</div>
          <div className="stat-lbl">CURRENTLY RENTED</div>
          <div className="stat-val">0</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon bg-orange-100"><Banknote size={20} className="text-orange-600"/></div>
          <div className="stat-lbl">MONTHLY REVENUE</div>
          <div className="stat-val">₹0</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon bg-red-100"><Wrench size={20} className="text-red-600"/></div>
          <div className="stat-lbl">IN MAINTENANCE</div>
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
          <div className="sort-by">
            Sort by: <strong>Newly Added</strong>
          </div>
        </div>

        <table className="inventory-table">
          <thead>
            <tr>
              <th>ASSET ID</th>
              <th>PRODUCT NAME</th>
              <th>CATEGORY</th>
              <th>PRICE/DAY</th>
              <th>STATUS</th>
              <th>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '2rem' }}>
                  <Loader2 className="spinning" style={{ animation: 'spin 1s linear infinite', margin: '0 auto' }} />
                </td>
              </tr>
            ) : filteredAssets.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                  No assets found in this category.
                </td>
              </tr>
            ) : (
              filteredAssets.map((asset, i) => (
                <tr key={i}>
                  <td className="font-bold text-blue">AST{asset.id}</td>
                  <td>
                    <div className="prod-cell">
                      {asset.img ? (
                        <img src={asset.img} alt={asset.name} className="prod-img" />
                      ) : (
                        <div className="prod-img empty-imgbg" style={{background:'#e2e8f0'}}></div>
                      )}
                      <div>
                        <div className="prod-name">{asset.name}</div>
                        <div className="prod-sub">{asset.sub}</div>
                      </div>
                    </div>
                  </td>
                  <td className="text-secondary">{asset.cat}</td>
                  <td className="font-bold">{asset.price}</td>
                  <td>
                    <span className={`badge badge-${asset.status.toLowerCase()}`}>
                      {asset.status}
                    </span>
                  </td>
                  <td>
                    <div className="actions">
                      <button className="icon-btn"><Edit2 size={16}/></button>
                      {asset.status === 'Inactive' ? 
                        <button className="icon-btn text-blue"><CheckCircle size={16}/></button> :
                        <button className="icon-btn"><EyeOff size={16}/></button>
                      }
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        <div className="pagination">
          <span className="info">Showing <strong>{filteredAssets.length > 0 ? 1 : 0}-{filteredAssets.length}</strong> of <strong>{assets.length}</strong> assets</span>
          <div className="pages">
            <button className="page-btn"><ChevronLeft size={16}/></button>
            <button className="page-btn active">1</button>
            <button className="page-btn">2</button>
            <button className="page-btn">3</button>
            <button className="page-btn"><ChevronRight size={16}/></button>
          </div>
        </div>
      </div>

      <div className="bottom-panels">
        <div className="panel action-panel">
          <div className="p-icon"><Upload size={24}/></div>
          <div className="p-content">
            <h3>Bulk Manage Assets</h3>
            <p>Update status or pricing for multiple assets at once using our spreadsheet importer.</p>
            <a href="#">Open Bulk Editor &rarr;</a>
          </div>
        </div>
        <div className="panel suggestion-panel">
          <div className="p-icon"><Sparkles size={24}/></div>
          <div className="p-content">
            <h3>Smart Pricing Suggestion</h3>
            <p>Your DSLR Camera could earn 15% more based on current market trends in Mumbai.</p>
            <a href="#">View Suggestions &rarr;</a>
          </div>
        </div>
      </div>
    </div>
  );
}
