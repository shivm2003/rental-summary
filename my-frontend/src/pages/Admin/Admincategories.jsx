import React, { useState, useEffect, useRef } from 'react';
import {
  Upload, Image as ImageIcon, Loader, CheckCircle,
  AlertCircle, RefreshCw, Edit2, Eye, EyeOff, FolderOpen, Plus, ChevronDown, ChevronRight, CornerDownRight, X
} from 'lucide-react';
import axios from 'axios';

const API = import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : 'http://localhost:5001/api';

const authHeader = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export default function AdminCategories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // States for uploading and editing
  const [uploadingId, setUploadingId] = useState(null);
  const [successId, setSuccessId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const fileInputRefs = useRef({});

  // States for Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState('main'); // 'main' or 'sub'
  const [modalName, setModalName] = useState('');
  const [modalParentId, setModalParentId] = useState('');

  // States for Subcategories
  const [expandedCats, setExpandedCats] = useState({});
  const [subcats, setSubcats] = useState({});
  const [loadingSubcats, setLoadingSubcats] = useState({});

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

  const toggleExpand = async (catId) => {
    if (expandedCats[catId]) {
      setExpandedCats(prev => ({...prev, [catId]: false}));
      return;
    }
    
    setExpandedCats(prev => ({...prev, [catId]: true}));
    
    // Load subcategories if not loaded
    if (!subcats[catId]) {
      setLoadingSubcats(prev => ({...prev, [catId]: true}));
      try {
        const res = await axios.get(`${API}/categories/${catId}/subcategories`);
        setSubcats(prev => ({...prev, [catId]: res.data.subcategories || []}));
      } catch (err) {
        console.error('Failed to load subcategories:', err);
      } finally {
        setLoadingSubcats(prev => ({...prev, [catId]: false}));
      }
    }
  };

  const handleImageUpload = async (categoryId, file) => {
    if (!file) return;
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
      const { data } = await axios.post(
        `${API}/categories/${categoryId}/upload-url`,
        { filename: file.name, contentType: file.type },
        { headers: authHeader() }
      );

      if (!data.uploadUrl) throw new Error('No upload URL received from server');

      const uploadRes = await fetch(data.uploadUrl, {
        method: 'PUT',
        body: file,
        headers: { 'Content-Type': file.type }
      });

      if (!uploadRes.ok) throw new Error(`Upload failed: ${uploadRes.status}`);

      setSuccessId(categoryId);
      setTimeout(() => setSuccessId(null), 3000);
      
      // Reload both to catch if this was a subcategory or main category
      loadCategories();
      // If expanding a row, we might need to reload its subcategories, but for now we just clear the subcats cache to force a reload on expand
      setSubcats({});
    } catch (err) {
      console.error('Upload error:', err);
      alert('Upload failed: ' + (err.message || 'Unknown error'));
    } finally {
      setUploadingId(null);
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
      setSubcats({}); // force reload of subcats if any
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
      setSubcats({});
    } catch (err) {
      alert('Update failed: ' + (err?.response?.data?.message || err.message));
    }
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!modalName.trim()) return;
    
    try {
      await axios.post(
        `${API}/categories`, 
        { 
          name: modalName.trim(), 
          description: '',
          parent_id: modalType === 'sub' ? modalParentId : null
        }, 
        { headers: authHeader() }
      );
      setIsModalOpen(false);
      setModalName('');
      loadCategories(); // reload main categories
      
      if (modalType === 'sub' && modalParentId) {
        // reload subcats if that parent is expanded
        if (expandedCats[modalParentId]) {
          const res = await axios.get(`${API}/categories/${modalParentId}/subcategories`);
          setSubcats(prev => ({...prev, [modalParentId]: res.data.subcategories || []}));
        }
      }
    } catch (err) {
      alert('Add failed: ' + (err?.response?.data?.message || err.message));
    }
  };

  const openModalForNewSubcat = (parentId) => {
    setModalType('sub');
    setModalParentId(parentId);
    setModalName('');
    setIsModalOpen(true);
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
    .btn-primary{background:#3b82f6;color:#fff;border:none;}
    .btn-primary:hover{background:#2563eb;color:#fff;}

    .tbl-card{background:#fff;border-radius:14px;border:1px solid #e2e8f0;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,.04);}
    .tbl{width:100%;border-collapse:collapse;}
    .tbl thead tr{background:#f8fafc;border-bottom:1px solid #e2e8f0;}
    .tbl th{padding:11px 16px;font-size:11px;font-weight:600;color:#94a3b8;letter-spacing:.8px;text-transform:uppercase;text-align:left;white-space:nowrap;}
    .tbl-row{border-bottom:1px solid #f1f5f9;animation:fadeUp .25s ease;}
    .tbl-row:hover{background:#fafbff;}
    .tbl-row td{padding:14px 16px;vertical-align:middle;}
    
    /* Subcategory row styling */
    .sub-row{background:#f8fafc;border-bottom:1px solid #e2e8f0;}
    .sub-row td{padding:10px 16px;font-size:13px;}
    .sub-row:hover{background:#f1f5f9;}
    .tree-icon{color:#94a3b8;margin-right:8px;vertical-align:middle;}

    .thumb{width:52px;height:52px;border-radius:10px;object-fit:cover;border:1px solid #e2e8f0;display:block;}
    .thumb-sm{width:40px;height:40px;}
    .no-img{width:52px;height:52px;border-radius:10px;background:#f1f5f9;border:1.5px dashed #cbd5e1;display:flex;align-items:center;justify-content:center;color:#cbd5e1;}
    .no-img-sm{width:40px;height:40px;}
    
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
    .up-btn-sm{padding:5px 10px;font-size:11px;}

    .tog-btn{display:flex;align-items:center;gap:5px;padding:6px 11px;border-radius:8px;font-size:12px;font-weight:500;cursor:pointer;border:1px solid #e2e8f0;background:#fff;font-family:inherit;color:#64748b;transition:all .15s;white-space:nowrap;}
    .tog-btn:hover{border-color:#94a3b8;color:#0f172a;}

    .exp-btn{background:transparent;border:none;cursor:pointer;color:#64748b;padding:4px;display:flex;align-items:center;border-radius:4px;}
    .exp-btn:hover{background:#e2e8f0;}

    .ed-row{display:flex;align-items:center;gap:6px;}
    .ed-inp{border:1.5px solid #3b82f6;border-radius:7px;padding:5px 9px;font-size:13px;font-family:inherit;color:#0f172a;outline:none;width:150px;}
    .sv-btn{background:#3b82f6;color:#fff;border:none;border-radius:7px;padding:5px 12px;font-size:12px;font-weight:600;cursor:pointer;font-family:inherit;}
    .cx-btn{background:#fff;color:#64748b;border:1px solid #e2e8f0;border-radius:7px;padding:5px 9px;font-size:12px;cursor:pointer;font-family:inherit;}
    .ed-ico{background:transparent;border:none;cursor:pointer;color:#cbd5e1;padding:3px;display:inline-flex;align-items:center;transition:color .15s;margin-left:4px;}
    .ed-ico:hover{color:#3b82f6;}

    .empty{text-align:center;padding:60px 20px;}
    .err-bar{background:#fef2f2;border:1px solid #fecaca;border-radius:12px;padding:16px 20px;color:#dc2626;display:flex;align-items:center;gap:10px;margin-bottom:24px;font-size:14px;}
    
    /* Modal Styles */
    .modal-overlay{position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(15,23,42,0.6);backdrop-filter:blur(4px);display:flex;align-items:center;justify-content:center;z-index:999;}
    .modal-box{background:#fff;border-radius:16px;width:100%;max-width:400px;padding:24px;box-shadow:0 20px 25px -5px rgba(0,0,0,0.1),0 8px 10px -6px rgba(0,0,0,0.1);animation:fadeUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);}
    .modal-hd{display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;}
    .modal-hd h3{margin:0;font-size:18px;font-weight:700;color:#0f172a;}
    .modal-close{background:none;border:none;color:#94a3b8;cursor:pointer;padding:4px;display:flex;align-items:center;border-radius:50%;}
    .modal-close:hover{background:#f1f5f9;color:#0f172a;}
    .form-group{margin-bottom:16px;}
    .form-group label{display:block;font-size:13px;font-weight:600;color:#475569;margin-bottom:6px;}
    .form-control{width:100%;border:1px solid #cbd5e1;border-radius:8px;padding:10px 14px;font-size:14px;font-family:inherit;color:#0f172a;outline:none;transition:border-color 0.2s;}
    .form-control:focus{border-color:#3b82f6;box-shadow:0 0 0 3px rgba(59,130,246,0.1);}
    .modal-actions{display:flex;justify-content:flex-end;gap:10px;margin-top:24px;}
    .btn-md-cancel{padding:10px 16px;border-radius:8px;font-size:14px;font-weight:600;cursor:pointer;border:1px solid #cbd5e1;background:#fff;color:#475569;}
    .btn-md-cancel:hover{background:#f8fafc;}
    .btn-md-save{padding:10px 16px;border-radius:8px;font-size:14px;font-weight:600;cursor:pointer;border:none;background:#3b82f6;color:#fff;}
    .btn-md-save:hover{background:#2563eb;}
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
          <div className="pg-sub">Manage parent categories and their subcategories</div>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="ref-btn" onClick={loadCategories}><RefreshCw size={14} /> Refresh</button>
          <button className="ref-btn btn-primary" onClick={() => { setModalType('main'); setModalParentId(''); setModalName(''); setIsModalOpen(true); }}>
            <Plus size={14} /> Add Category
          </button>
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
            <div style={{ fontSize:14, color:'#94a3b8' }}>Create your first category to get started</div>
          </div>
        ) : (
          <table className="tbl">
            <thead>
              <tr>
                <th style={{ width: '40px' }}></th>
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
                <React.Fragment key={cat.id}>
                  {/* Main Category Row */}
                  <tr className="tbl-row">
                    <td>
                      {(cat.children_count > 0 || true) && (
                        <button className="exp-btn" onClick={() => toggleExpand(cat.id)}>
                          {expandedCats[cat.id] ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                        </button>
                      )}
                    </td>
                    <td>
                      {cat.image_url
                        ? <img src={cat.image_url} alt={cat.name} className="thumb" onError={e => { e.target.style.display='none'; }} />
                        : <div className="no-img"><ImageIcon size={20} /></div>
                      }
                    </td>
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
                    <td><div className="c-desc">{cat.description || <span style={{ color:'#cbd5e1' }}>—</span>}</div></td>
                    <td><span className="c-num">{cat.children_count ?? 0}</span><span className="c-unit">sub-cats</span></td>
                    <td><span className="c-num">{cat.product_count ?? 0}</span><span className="c-unit">listings</span></td>
                    <td><span className={`badge ${cat.is_active ? 'b-on' : 'b-off'}`}>{cat.is_active ? 'Active' : 'Inactive'}</span></td>
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
                    <td>
                      <button className="tog-btn" onClick={() => handleToggleActive(cat)}>
                        {cat.is_active ? <><EyeOff size={13} /> Hide</> : <><Eye size={13} /> Show</>}
                      </button>
                    </td>
                  </tr>
                  
                  {/* Expanded Subcategories Rows */}
                  {expandedCats[cat.id] && (
                    <>
                      {loadingSubcats[cat.id] ? (
                        <tr className="sub-row"><td colSpan={9} style={{textAlign:'center', padding:'20px', color:'#94a3b8'}}><Loader size={16} className="spin" style={{verticalAlign:'middle', marginRight:8}}/> Loading subcategories...</td></tr>
                      ) : subcats[cat.id]?.length === 0 ? (
                        <tr className="sub-row"><td colSpan={9} style={{color:'#94a3b8', paddingLeft:'40px'}}><CornerDownRight size={16} className="tree-icon"/> No subcategories found. <span style={{cursor:'pointer', color:'#3b82f6', textDecoration:'underline'}} onClick={() => openModalForNewSubcat(cat.id)}>Add subcategory</span></td></tr>
                      ) : (
                        subcats[cat.id]?.map(sub => (
                          <tr key={sub.id} className="sub-row">
                            <td></td>
                            <td style={{paddingLeft:'20px'}}>
                              <div style={{display:'flex', alignItems:'center'}}>
                                <CornerDownRight size={16} className="tree-icon"/>
                                {sub.image_url
                                  ? <img src={sub.image_url} alt={sub.name} className="thumb thumb-sm" onError={e => { e.target.style.display='none'; }} />
                                  : <div className="no-img no-img-sm"><ImageIcon size={16} /></div>
                                }
                              </div>
                            </td>
                            <td>
                              {editingId === sub.id ? (
                                <div className="ed-row">
                                  <input
                                    className="ed-inp"
                                    value={editName}
                                    onChange={e => setEditName(e.target.value)}
                                    onKeyDown={e => {
                                      if (e.key === 'Enter') handleSaveName(sub);
                                      if (e.key === 'Escape') setEditingId(null);
                                    }}
                                    autoFocus
                                  />
                                  <button className="sv-btn" onClick={() => handleSaveName(sub)}>Save</button>
                                  <button className="cx-btn" onClick={() => setEditingId(null)}>✕</button>
                                </div>
                              ) : (
                                <div style={{ display:'flex', alignItems:'center' }}>
                                  <div>
                                    <div className="c-name">{sub.name}</div>
                                    <div className="c-slug">{sub.slug}</div>
                                  </div>
                                  <button className="ed-ico" onClick={() => { setEditingId(sub.id); setEditName(sub.name); }} title="Edit name">
                                    <Edit2 size={13} />
                                  </button>
                                </div>
                              )}
                            </td>
                            <td><div className="c-desc">—</div></td>
                            <td>—</td>
                            <td>—</td>
                            <td><span className={`badge ${sub.is_active ? 'b-on' : 'b-off'}`}>{sub.is_active ? 'Active' : 'Inactive'}</span></td>
                            <td>
                              <input
                                type="file"
                                accept="image/jpeg,image/png,image/webp"
                                style={{ display:'none' }}
                                ref={el => fileInputRefs.current[sub.id] = el}
                                onChange={e => { if (e.target.files[0]) handleImageUpload(sub.id, e.target.files[0]); }}
                              />
                              <button
                                className={`up-btn up-btn-sm ${successId === sub.id ? 'done' : ''}`}
                                disabled={uploadingId === sub.id}
                                onClick={() => fileInputRefs.current[sub.id]?.click()}
                              >
                                {uploadingId === sub.id
                                  ? <><Loader size={13} className="spin" /> Up…</>
                                  : successId === sub.id
                                    ? <><CheckCircle size={13} /> Done</>
                                    : <><Upload size={13} /> Upload</>
                                }
                              </button>
                            </td>
                            <td>
                              <button className="tog-btn" onClick={() => handleToggleActive(sub)}>
                                {sub.is_active ? <><EyeOff size={13} /> Hide</> : <><Eye size={13} /> Show</>}
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                      {/* Add subcat row button inline */}
                      {subcats[cat.id]?.length > 0 && (
                        <tr className="sub-row">
                          <td colSpan={9} style={{paddingLeft:'58px'}}>
                            <button className="ref-btn" style={{padding:'4px 10px', fontSize:'12px', display:'inline-flex'}} onClick={() => openModalForNewSubcat(cat.id)}>
                              <Plus size={12}/> Add Subcategory to {cat.name}
                            </button>
                          </td>
                        </tr>
                      )}
                    </>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Category Add Modal */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={(e) => { if (e.target.className === 'modal-overlay') setIsModalOpen(false); }}>
          <div className="modal-box">
            <div className="modal-hd">
              <h3>Create New Category</h3>
              <button className="modal-close" onClick={() => setIsModalOpen(false)}><X size={20}/></button>
            </div>
            
            <form onSubmit={handleAddSubmit}>
              <div className="form-group">
                <label>Category Type</label>
                <select className="form-control" value={modalType} onChange={(e) => setModalType(e.target.value)}>
                  <option value="main">Main Category</option>
                  <option value="sub">Subcategory</option>
                </select>
              </div>

              {modalType === 'sub' && (
                <div className="form-group">
                  <label>Select Parent Category</label>
                  <select 
                    className="form-control" 
                    value={modalParentId} 
                    onChange={(e) => setModalParentId(e.target.value)}
                    required
                  >
                    <option value="" disabled>-- Select a Main Category --</option>
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="form-group">
                <label>Category Name</label>
                <input 
                  type="text" 
                  className="form-control" 
                  autoFocus 
                  required 
                  placeholder="e.g. Laptops, Camping Gear"
                  value={modalName} 
                  onChange={(e) => setModalName(e.target.value)} 
                />
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-md-cancel" onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn-md-save">Create Category</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}