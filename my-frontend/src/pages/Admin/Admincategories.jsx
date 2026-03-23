import React, { useState, useEffect, useRef } from 'react';
import {
  Upload, Image as ImageIcon, Loader, CheckCircle,
  AlertCircle, RefreshCw, Edit2, Eye, EyeOff, FolderOpen, Plus
} from 'lucide-react';
import axios from 'axios';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

const authHeader = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export default function AdminCategories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [uploadingId, setUploadingId] = useState(null);
  const [successId, setSuccessId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const fileInputRefs = useRef({});

  useEffect(() => { loadCategories(); }, []);

  const loadCategories = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get(`${API}/categories/admin`, { headers: authHeader() });
      setCategories(res.data?.categories ?? []);
    } catch (err) {
      console.error('Load categories error:', err);
      setError(err?.response?.data?.message || err.message || 'Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  // FIXED: Use fetch instead of axios for S3 upload to avoid interceptors
  const handleImageUpload = async (categoryId, file) => {
    if (!file) return;
    
    // Validate file
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      alert('Only JPG, PNG, or WebP files allowed');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert('File must be under 5MB');
      return;
    }

    setUploadingId(categoryId);
    try {
      // Step 1: Get pre-signed URL from backend
      const { data } = await axios.post(
        `${API}/categories/${categoryId}/upload-url`,
        { 
          filename: file.name, 
          contentType: file.type 
        },
        { headers: authHeader() }
      );

      if (!data.uploadUrl) {
        throw new Error('No upload URL received from server');
      }

      // Step 2: Upload to S3 using fetch (not axios)
      const uploadRes = await fetch(data.uploadUrl, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type
        }
      });

      if (!uploadRes.ok) {
        const errorText = await uploadRes.text();
        console.error('S3 Error Response:', errorText);
        throw new Error(`Upload failed: ${uploadRes.status}`);
      }

      setSuccessId(categoryId);
      setTimeout(() => setSuccessId(null), 3000);
      loadCategories();
    } catch (err) {
      console.error('Upload error:', err);
      alert('Upload failed: ' + (err.message || 'Unknown error'));
    } finally {
      setUploadingId(null);
      // Reset file input
      if (fileInputRefs.current[categoryId]) {
        fileInputRefs.current[categoryId].value = '';
      }
    }
  };

  const handleToggleActive = async (cat) => {
    try {
      await axios.put(
        `${API}/categories/${cat.id}`, 
        { is_active: !cat.is_active }, 
        { headers: authHeader() }
      );
      loadCategories();
    } catch (err) {
      alert('Update failed: ' + (err?.response?.data?.message || err.message));
    }
  };

  const handleSaveName = async (cat) => {
    if (!editName.trim()) return;
    try {
      await axios.put(
        `${API}/categories/${cat.id}`, 
        { name: editName.trim() }, 
        { headers: authHeader() }
      );
      setEditingId(null);
      loadCategories();
    } catch (err) {
      alert('Update failed: ' + (err?.response?.data?.message || err.message));
    }
  };

  const handleAddCategory = async () => {
    const name = prompt('Enter new category name:');
    if (!name || !name.trim()) return;
    try {
      await axios.post(
        `${API}/categories`, 
        { name: name.trim(), description: '' }, 
        { headers: authHeader() }
      );
      loadCategories();
    } catch (err) {
      alert('Add failed: ' + (err?.response?.data?.message || err.message));
    }
  };

  const css = `
    @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=DM+Mono:wght@500&display=swap');
    *{box-sizing:border-box;}
    @keyframes spin{to{transform:rotate(360deg);}}
    @keyframes fadeUp{from{opacity:0;transform:translateY(6px);}to{opacity:1;transform:none;}}
    .spin{animation:spin .8s linear infinite;}

    .pg{padding:32px;font-family:'DM Sans',sans-serif;min-height:100vh;background:#f0f2f5;}
    .pg-hd{display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:28px;}
    .pg-title{font-size:22px;font-weight:700;color:#0f172a;letter-spacing:-.4px;display:flex;align-items:center;gap:10px;}
    .pg-chip{background:#dbeafe;color:#1d4ed8;font-size:12px;font-weight:600;padding:2px 10px;border-radius:99px;}
    .pg-sub{font-size:13px;color:#64748b;margin-top:4px;}
    .ref-btn{display:flex;align-items:center;gap:6px;background:#fff;border:1px solid #e2e8f0;border-radius:10px;padding:8px 14px;cursor:pointer;font-size:14px;color:#64748b;font-family:inherit;font-weight:500;transition:all .15s;}
    .ref-btn:hover{background:#f8fafc;color:#0f172a;}

    .tbl-card{background:#fff;border-radius:14px;border:1px solid #e2e8f0;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,.04);}
    .tbl{width:100%;border-collapse:collapse;}
    .tbl thead tr{background:#f8fafc;border-bottom:1px solid #e2e8f0;}
    .tbl th{padding:11px 16px;font-size:11px;font-weight:600;color:#94a3b8;letter-spacing:.8px;text-transform:uppercase;text-align:left;white-space:nowrap;}
    .tbl-row{border-bottom:1px solid #f1f5f9;animation:fadeUp .25s ease;}
    .tbl-row:last-child{border-bottom:none;}
    .tbl-row:hover{background:#fafbff;}
    .tbl-row td{padding:14px 16px;vertical-align:middle;}

    .thumb{width:52px;height:52px;border-radius:10px;object-fit:cover;border:1px solid #e2e8f0;display:block;}
    .no-img{width:52px;height:52px;border-radius:10px;background:#f1f5f9;border:1.5px dashed #cbd5e1;display:flex;align-items:center;justify-content:center;color:#cbd5e1;}
    .c-name{font-size:14px;font-weight:600;color:#0f172a;}
    .c-slug{font-size:11px;color:#94a3b8;font-family:'DM Mono',monospace;margin-top:2px;}
    .c-desc{font-size:13px;color:#64748b;max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
    .c-num{font-size:14px;font-weight:600;color:#0f172a;}
    .c-unit{font-size:11px;color:#94a3b8;margin-left:3px;}

    .badge{display:inline-flex;align-items:center;padding:3px 10px;border-radius:99px;font-size:11px;font-weight:600;}
    .b-on{background:#dcfce7;color:#16a34a;}
    .b-off{background:#f1f5f9;color:#94a3b8;}

    .up-btn{display:inline-flex;align-items:center;gap:6px;padding:7px 13px;border-radius:8px;font-size:13px;font-weight:500;cursor:pointer;border:1.5px solid #3b82f6;color:#3b82f6;background:#eff6ff;font-family:inherit;transition:all .15s;white-space:nowrap;}
    .up-btn:hover:not(:disabled){background:#3b82f6;color:#fff;}
    .up-btn:disabled{opacity:.55;cursor:not-allowed;}
    .up-btn.done{border-color:#10b981;color:#10b981;background:#ecfdf5;}

    .tog-btn{display:flex;align-items:center;gap:5px;padding:6px 11px;border-radius:8px;font-size:12px;font-weight:500;cursor:pointer;border:1px solid #e2e8f0;background:#fff;font-family:inherit;color:#64748b;transition:all .15s;white-space:nowrap;}
    .tog-btn:hover{border-color:#94a3b8;color:#0f172a;}

    .ed-row{display:flex;align-items:center;gap:6px;}
    .ed-inp{border:1.5px solid #3b82f6;border-radius:7px;padding:5px 9px;font-size:13px;font-family:inherit;color:#0f172a;outline:none;width:150px;}
    .sv-btn{background:#3b82f6;color:#fff;border:none;border-radius:7px;padding:5px 12px;font-size:12px;font-weight:600;cursor:pointer;font-family:inherit;}
    .cx-btn{background:#fff;color:#64748b;border:1px solid #e2e8f0;border-radius:7px;padding:5px 9px;font-size:12px;cursor:pointer;font-family:inherit;}
    .ed-ico{background:transparent;border:none;cursor:pointer;color:#cbd5e1;padding:3px;display:inline-flex;align-items:center;transition:color .15s;margin-left:4px;}
    .ed-ico:hover{color:#3b82f6;}

    .empty{text-align:center;padding:60px 20px;}
    .err-bar{background:#fef2f2;border:1px solid #fecaca;border-radius:12px;padding:16px 20px;color:#dc2626;display:flex;align-items:center;gap:10px;margin-bottom:24px;font-size:14px;}
    .err-btn{margin-left:auto;background:#dc2626;color:#fff;border:none;border-radius:8px;padding:6px 14px;cursor:pointer;font-size:13px;font-family:inherit;}
  `;

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', fontFamily:"'DM Sans',sans-serif", color:'#64748b', gap:10 }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}} .spin{animation:spin .8s linear infinite}`}</style>
      <Loader size={20} className="spin" /> Loading categories…
    </div>
  );

  return (
    <div className="pg">
      <style>{css}</style>

      {/* Page header */}
      <div className="pg-hd">
        <div>
          <div className="pg-title">
            <FolderOpen size={22} color="#3b82f6" />
            Categories
            <span className="pg-chip">{categories.length}</span>
          </div>
          <div className="pg-sub">Top-level active categories · Upload images &amp; manage visibility</div>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="ref-btn" onClick={handleAddCategory}><Plus size={14} /> Add Category</button>
          <button className="ref-btn" onClick={loadCategories}><RefreshCw size={14} /> Refresh</button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="err-bar">
          <AlertCircle size={18} /> {error}
          <button className="err-btn" onClick={loadCategories}>Retry</button>
        </div>
      )}

      {/* Table */}
      <div className="tbl-card">
        {categories.length === 0 && !error ? (
          <div className="empty">
            <div style={{ fontSize:48, marginBottom:12 }}>📂</div>
            <div style={{ fontWeight:600, color:'#475569', marginBottom:6 }}>No categories found</div>
            <div style={{ fontSize:14, color:'#94a3b8' }}>Active top-level categories will appear here</div>
          </div>
        ) : (
          <table className="tbl">
            <thead>
              <tr>
                <th>Image</th>
                <th>Name / Slug</th>
                <th>Description</th>
                <th>Sub-cats</th>
                <th>Listings</th>
                <th>Status</th>
                <th>Upload Image</th>
                <th>Visibility</th>
              </tr>
            </thead>
            <tbody>
              {categories.map(cat => (
                <tr key={cat.id} className="tbl-row">

                  {/* Thumbnail */}
                  <td>
                    {cat.image_url
                      ? <img src={cat.image_url} alt={cat.name} className="thumb" onError={e => { e.target.style.display='none'; }} />
                      : <div className="no-img"><ImageIcon size={20} /></div>
                    }
                  </td>

                  {/* Name + slug */}
                  <td>
                    {editingId === cat.id ? (
                      <div className="ed-row">
                        <input
                          className="ed-inp"
                          value={editName}
                          onChange={e => setEditName(e.target.value)}
                          onKeyDown={e => {
                            if (e.key === 'Enter') handleSaveName(cat);
                            if (e.key === 'Escape') setEditingId(null);
                          }}
                          autoFocus
                        />
                        <button className="sv-btn" onClick={() => handleSaveName(cat)}>Save</button>
                        <button className="cx-btn" onClick={() => setEditingId(null)}>✕</button>
                      </div>
                    ) : (
                      <div style={{ display:'flex', alignItems:'center' }}>
                        <div>
                          <div className="c-name">{cat.name}</div>
                          <div className="c-slug">{cat.slug}</div>
                        </div>
                        <button className="ed-ico" onClick={() => { setEditingId(cat.id); setEditName(cat.name); }} title="Edit name">
                          <Edit2 size={13} />
                        </button>
                      </div>
                    )}
                  </td>

                  {/* Description */}
                  <td><div className="c-desc">{cat.description || <span style={{ color:'#cbd5e1' }}>—</span>}</div></td>

                  {/* Sub-cat count */}
                  <td><span className="c-num">{cat.children_count ?? 0}</span><span className="c-unit">sub-cats</span></td>

                  {/* Listings count */}
                  <td><span className="c-num">{cat.product_count ?? 0}</span><span className="c-unit">listings</span></td>

                  {/* Status */}
                  <td><span className={`badge ${cat.is_active ? 'b-on' : 'b-off'}`}>{cat.is_active ? 'Active' : 'Inactive'}</span></td>

                  {/* Upload */}
                  <td>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      style={{ display:'none' }}
                      ref={el => fileInputRefs.current[cat.id] = el}
                      onChange={e => { if (e.target.files[0]) handleImageUpload(cat.id, e.target.files[0]); }}
                    />
                    <button
                      className={`up-btn ${successId === cat.id ? 'done' : ''}`}
                      disabled={uploadingId === cat.id}
                      onClick={() => fileInputRefs.current[cat.id]?.click()}
                    >
                      {uploadingId === cat.id
                        ? <><Loader size={13} className="spin" /> Uploading…</>
                        : successId === cat.id
                          ? <><CheckCircle size={13} /> Uploaded!</>
                          : <><Upload size={13} /> {cat.image_url ? 'Replace' : 'Upload'}</>
                      }
                    </button>
                  </td>

                  {/* Toggle */}
                  <td>
                    <button className="tog-btn" onClick={() => handleToggleActive(cat)}>
                      {cat.is_active ? <><EyeOff size={13} /> Hide</> : <><Eye size={13} /> Show</>}
                    </button>
                  </td>

                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}