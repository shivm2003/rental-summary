import React, { useState } from 'react';
import axios from 'axios';
import { Download, UploadCloud, FileText, CheckCircle, AlertCircle, Loader } from 'lucide-react';
import { toast } from 'react-hot-toast';
import './AdminDashboard.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

export default function AdminBulkUpload() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setResults(null);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
      setResults(null);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error('Please select a file to upload');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    setLoading(true);
    setResults(null);

    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(`${API_URL}/api/admin/bulk-upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`
        }
      });

      toast.success(res.data.message || 'Upload complete!');
      setResults({
        success: true,
        message: res.data.message,
        errors: res.data.errors || []
      });
      setFile(null);
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Upload failed');
      setResults({
        success: false,
        message: err.response?.data?.message || 'An error occurred during upload',
        errors: err.response?.data?.errors || []
      });
    } finally {
      setLoading(false);
    }
  };

  const downloadTemplate = () => {
    const csvContent = "item_name,category,subcategory,location,pincode,city,state,rental_price_per_day,price_unit,description,image_url,lender_id\n" +
      "Luxury PG Room,PG,Boys PG,Sector 14,122001,Gurgaon,Haryana,500,day,Fully furnished boys PG with WiFi and AC.,https://example.com/pg-image.jpg,";
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "bulk_upload_template.csv");
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="admin-dashboard">
      <div className="dash-header">
        <div className="dash-title">Bulk Upload Products</div>
      </div>

      <div className="dash-content">
        <div className="settings-card" style={{ maxWidth: '800px', margin: '0 auto' }}>
          <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0 }}>Upload CSV</h3>
            <button 
              className="btn-outline" 
              onClick={downloadTemplate}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', borderRadius: '6px', border: '1px solid #e2e8f0', background: 'white', cursor: 'pointer' }}
            >
              <Download size={16} /> Download Template
            </button>
          </div>

          <div 
            className="upload-dropzone" 
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            style={{
              border: '2px dashed #cbd5e1',
              borderRadius: '12px',
              padding: '40px',
              textAlign: 'center',
              marginTop: '20px',
              backgroundColor: '#f8fafc',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onClick={() => document.getElementById('csv-upload').click()}
          >
            <input 
              type="file" 
              id="csv-upload" 
              accept=".csv" 
              style={{ display: 'none' }} 
              onChange={handleFileChange} 
            />
            
            {file ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                <FileText size={48} color="#3b82f6" />
                <h4 style={{ margin: 0, color: '#1e293b' }}>{file.name}</h4>
                <p style={{ margin: 0, color: '#64748b' }}>{(file.size / 1024).toFixed(2)} KB</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                <UploadCloud size={48} color="#94a3b8" />
                <h4 style={{ margin: 0, color: '#334155' }}>Drag and drop your CSV file here</h4>
                <p style={{ margin: 0, color: '#64748b' }}>or click to browse</p>
              </div>
            )}
          </div>

          <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end' }}>
            <button 
              className="btn-primary" 
              onClick={handleUpload}
              disabled={!file || loading}
              style={{ 
                padding: '12px 24px', 
                borderRadius: '8px', 
                background: (!file || loading) ? '#94a3b8' : '#3b82f6', 
                color: 'white', 
                border: 'none',
                cursor: (!file || loading) ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontWeight: '600'
              }}
            >
              {loading ? <Loader size={18} className="spin" /> : <UploadCloud size={18} />}
              {loading ? 'Uploading...' : 'Start Upload'}
            </button>
          </div>
        </div>

        {results && (
          <div className="settings-card" style={{ maxWidth: '800px', margin: '20px auto' }}>
            <div className="card-header" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {results.success ? <CheckCircle color="#10b981" /> : <AlertCircle color="#ef4444" />}
              <h3 style={{ margin: 0 }}>Upload Results</h3>
            </div>
            
            <div style={{ padding: '20px', background: results.success ? '#ecfdf5' : '#fef2f2', borderRadius: '8px', marginTop: '16px' }}>
              <p style={{ fontWeight: '600', color: results.success ? '#065f46' : '#991b1b', margin: '0 0 10px 0' }}>
                {results.message}
              </p>
              
              {results.errors && results.errors.length > 0 && (
                <div style={{ marginTop: '16px' }}>
                  <h4 style={{ color: '#991b1b', marginBottom: '8px' }}>Errors Encountered:</h4>
                  <ul style={{ margin: 0, paddingLeft: '20px', color: '#7f1d1d', fontSize: '14px' }}>
                    {results.errors.map((err, i) => (
                      <li key={i} style={{ marginBottom: '4px' }}>{err}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="settings-card" style={{ maxWidth: '800px', margin: '20px auto' }}>
          <h3 style={{ marginTop: 0 }}>Required CSV Format</h3>
          <p style={{ color: '#64748b', marginBottom: '16px' }}>
            Your CSV file must contain the following headers exactly as written:
          </p>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                  <th style={{ padding: '12px' }}>Column Name</th>
                  <th style={{ padding: '12px' }}>Required</th>
                  <th style={{ padding: '12px' }}>Description</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '12px', fontWeight: '500' }}>item_name</td>
                  <td style={{ padding: '12px', color: '#ef4444' }}>Yes</td>
                  <td style={{ padding: '12px', color: '#64748b' }}>Name of the product/PG</td>
                </tr>
                <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '12px', fontWeight: '500' }}>category</td>
                  <td style={{ padding: '12px', color: '#ef4444' }}>Yes</td>
                  <td style={{ padding: '12px', color: '#64748b' }}>E.g. PG, Homes, Electronics</td>
                </tr>
                <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '12px', fontWeight: '500' }}>location</td>
                  <td style={{ padding: '12px', color: '#ef4444' }}>Yes</td>
                  <td style={{ padding: '12px', color: '#64748b' }}>Street address or area</td>
                </tr>
                <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '12px', fontWeight: '500' }}>rental_price_per_day</td>
                  <td style={{ padding: '12px', color: '#ef4444' }}>Yes</td>
                  <td style={{ padding: '12px', color: '#64748b' }}>Numeric value of the rent</td>
                </tr>
                <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '12px', fontWeight: '500' }}>pincode, city, state</td>
                  <td style={{ padding: '12px', color: '#ef4444' }}>Yes</td>
                  <td style={{ padding: '12px', color: '#64748b' }}>Address details</td>
                </tr>
                <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '12px', fontWeight: '500' }}>image_url</td>
                  <td style={{ padding: '12px', color: '#10b981' }}>No</td>
                  <td style={{ padding: '12px', color: '#64748b' }}>Direct link to an image to attach automatically</td>
                </tr>
                <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '12px', fontWeight: '500' }}>lender_id</td>
                  <td style={{ padding: '12px', color: '#10b981' }}>No</td>
                  <td style={{ padding: '12px', color: '#64748b' }}>Defaults to your Admin ID if left empty</td>
                </tr>
              </tbody>
            </table>
          </div>

          <h4 style={{ marginTop: '24px', marginBottom: '8px', color: '#1e293b' }}>Example CSV Data:</h4>
          <div style={{ background: '#1e293b', color: '#e2e8f0', padding: '16px', borderRadius: '8px', overflowX: 'auto', fontSize: '13px', fontFamily: 'monospace', whiteSpace: 'pre' }}>
{`item_name,category,subcategory,location,pincode,city,state,rental_price_per_day,price_unit,description,image_url,lender_id
Luxury PG Room,PG,Boys PG,Sector 14,122001,Gurgaon,Haryana,500,day,Fully furnished boys PG.,https://example.com/pg.jpg,
Cozy Home,Homes,2 BHK,DLF Phase 3,122002,Gurgaon,Haryana,1200,day,Beautiful 2 BHK.,https://example.com/home.jpg,`}
          </div>
        </div>
      </div>
    </div>
  );
}
