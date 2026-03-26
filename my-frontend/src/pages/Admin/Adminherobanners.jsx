import React, { useState, useEffect, useRef } from 'react';
import {
  Image as ImageIcon, Plus, Loader, CheckCircle, AlertCircle,
  RefreshCw, Upload, Trash2, Eye, EyeOff, Edit2, X
} from 'lucide-react';
import axios from 'axios';

const API = import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : 'http://localhost:5001/api';
const authHeader = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const EMPTY_FORM = {
  title: '', subtitle: '', description: '',
  button_text: 'Shop Now', button_link: '/products',
  display_order: 1, is_active: true
};

export default function AdminHeroBanners() {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [showForm, setShowForm] = useState(false);
  const [editingBanner, setEditingBanner] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState(null);

  // Image: store the File object locally, show preview via URL.createObjectURL
  const [selectedFile, setSelectedFile] = useState(null);       // File object
  const [previewUrl, setPreviewUrl] = useState(null);           // local blob URL or existing S3 URL
  const [showImageField, setShowImageField] = useState(false);  // toggle file picker area
  const fileRef = useRef();

  useEffect(() => { loadBanners(); }, []);

  const loadBanners = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get(`${API}/hero`, { headers: authHeader() });
      setBanners(res.data?.banners ?? []);
    } catch (err) {
      setError(err?.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setEditingBanner(null);
    setForm({ ...EMPTY_FORM, display_order: banners.length + 1 });
    setSelectedFile(null);
    setPreviewUrl(null);
    setShowImageField(false);
    setFormError(null);
    setShowForm(true);
  };

  const openEdit = (banner) => {
    setEditingBanner(banner);
    setForm({
      title: banner.title || '',
      subtitle: banner.subtitle || '',
      description: banner.description || '',
      button_text: banner.button_text || 'Shop Now',
      button_link: banner.button_link || '/products',
      display_order: banner.display_order || 1,
      is_active: banner.is_active ?? true,
    });
    setSelectedFile(null);
    setPreviewUrl(banner.image_url || null); // show existing image
    setShowImageField(false);
    setFormError(null);
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingBanner(null);
    setSelectedFile(null);
    setPreviewUrl(null);
    setShowImageField(false);
  };

  // Just store file locally — no upload yet
  const handleFileSelect = (file) => {
    if (!file) return;
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file)); // instant local preview
    setShowImageField(false);
  };

  // Send everything as multipart/form-data on Save
  const handleSave = async () => {
    if (!form.title.trim()) { setFormError('Title is required'); return; }
    if (!editingBanner && !selectedFile) { setFormError('Please select a banner image'); return; }

    setSaving(true);
    setFormError(null);

    try {
      const fd = new FormData();
      fd.append('title', form.title);
      fd.append('subtitle', form.subtitle || '');
      fd.append('description', form.description || '');
      fd.append('button_text', form.button_text || 'Shop Now');
      fd.append('button_link', form.button_link || '/products');
      fd.append('display_order', form.display_order);
      fd.append('is_active', form.is_active);
      if (selectedFile) fd.append('image', selectedFile); // backend uses upload.single('image')

      const headers = {
        ...authHeader(),
        'Content-Type': 'multipart/form-data'
      };

      if (editingBanner) {
        await axios.put(`${API}/hero/${editingBanner.id}`, fd, { headers });
      } else {
        await axios.post(`${API}/hero`, fd, { headers });
      }

      closeForm();
      loadBanners();
    } catch (err) {
      setFormError(err?.response?.data?.message || err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this banner?')) return;
    try {
      await axios.delete(`${API}/hero/${id}`, { headers: authHeader() });
      loadBanners();
    } catch (err) {
      alert('Delete failed: ' + (err?.response?.data?.message || err.message));
    }
  };

  const handleToggle = async (banner) => {
    try {
      const fd = new FormData();
      fd.append('title', banner.title);
      fd.append('is_active', !banner.is_active);
      await axios.put(`${API}/hero/${banner.id}`, fd, {
        headers: { ...authHeader(), 'Content-Type': 'multipart/form-data' }
      });
      loadBanners();
    } catch (err) {
      alert('Update failed: ' + (err?.response?.data?.message || err.message));
    }
  };

  const css = `
    @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');
    *{box-sizing:border-box;}
    @keyframes spin{to{transform:rotate(360deg);}}
    @keyframes fadeUp{from{opacity:0;transform:translateY(8px);}to{opacity:1;transform:none;}}
    @keyframes slideDown{from{opacity:0;transform:translateY(-10px);}to{opacity:1;transform:none;}}
    .spin{animation:spin .8s linear infinite;}

    .hp{padding:32px;font-family:'DM Sans',sans-serif;min-height:100vh;background:#f0f2f5;}
    .hp-hd{display:flex;align-items:center;justify-content:space-between;margin-bottom:28px;}
    .hp-title{font-size:22px;font-weight:700;color:#0f172a;letter-spacing:-.4px;display:flex;align-items:center;gap:10px;}
    .hp-chip{background:#ede9fe;color:#7c3aed;font-size:12px;font-weight:600;padding:2px 10px;border-radius:99px;}
    .hp-sub{font-size:13px;color:#64748b;margin-top:4px;}
    .hp-actions{display:flex;gap:10px;}

    .btn-primary{display:flex;align-items:center;gap:7px;background:#3b82f6;color:#fff;border:none;border-radius:10px;padding:9px 18px;font-size:14px;font-weight:600;cursor:pointer;font-family:inherit;transition:background .15s;}
    .btn-primary:hover{background:#2563eb;}
    .btn-ghost{display:flex;align-items:center;gap:6px;background:#fff;border:1px solid #e2e8f0;border-radius:10px;padding:8px 14px;cursor:pointer;font-size:14px;color:#64748b;font-family:inherit;font-weight:500;transition:all .15s;}
    .btn-ghost:hover{background:#f8fafc;color:#0f172a;}

    .banners-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(340px,1fr));gap:20px;}
    .bn-card{background:#fff;border-radius:14px;border:1px solid #e2e8f0;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,.04);animation:fadeUp .3s ease;transition:box-shadow .2s;}
    .bn-card:hover{box-shadow:0 4px 16px rgba(0,0,0,.08);}
    .bn-img{width:100%;height:180px;object-fit:cover;background:#f1f5f9;display:block;}
    .bn-no-img{height:180px;background:#f8fafc;border-bottom:1px solid #e2e8f0;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:8px;color:#cbd5e1;}
    .bn-body{padding:16px;}
    .bn-order{font-size:11px;font-weight:600;color:#94a3b8;letter-spacing:.5px;text-transform:uppercase;margin-bottom:4px;}
    .bn-title{font-size:16px;font-weight:700;color:#0f172a;margin-bottom:4px;}
    .bn-sub{font-size:13px;color:#64748b;margin-bottom:12px;}
    .bn-footer{display:flex;align-items:center;gap:8px;flex-wrap:wrap;}
    .badge{display:inline-flex;align-items:center;padding:3px 10px;border-radius:99px;font-size:11px;font-weight:600;}
    .b-on{background:#dcfce7;color:#16a34a;}
    .b-off{background:#f1f5f9;color:#94a3b8;}
    .icon-btn{display:flex;align-items:center;gap:4px;padding:5px 10px;border-radius:7px;border:1px solid #e2e8f0;background:#fff;font-size:12px;font-weight:500;cursor:pointer;font-family:inherit;color:#64748b;transition:all .15s;}
    .icon-btn:hover{border-color:#94a3b8;color:#0f172a;}
    .icon-btn.del:hover{border-color:#fca5a5;color:#ef4444;background:#fef2f2;}
    .icon-btn.edit-btn{border-color:#bfdbfe;color:#3b82f6;background:#eff6ff;}
    .icon-btn.edit-btn:hover{background:#3b82f6;color:#fff;border-color:#3b82f6;}

    .form-overlay{position:fixed;inset:0;background:rgba(15,23,42,.5);z-index:50;display:flex;align-items:center;justify-content:center;padding:20px;}
    .form-box{background:#fff;border-radius:16px;width:100%;max-width:560px;max-height:90vh;overflow-y:auto;animation:slideDown .25s ease;}
    .form-hd{display:flex;align-items:center;justify-content:space-between;padding:20px 24px;border-bottom:1px solid #e2e8f0;position:sticky;top:0;background:#fff;z-index:1;}
    .form-title{font-size:17px;font-weight:700;color:#0f172a;}
    .close-btn{background:transparent;border:none;cursor:pointer;color:#94a3b8;padding:4px;display:flex;align-items:center;}
    .close-btn:hover{color:#0f172a;}
    .form-body{padding:24px;}
    .form-group{margin-bottom:18px;}
    .form-label{display:block;font-size:13px;font-weight:600;color:#374151;margin-bottom:6px;}
    .form-input{width:100%;border:1.5px solid #e2e8f0;border-radius:9px;padding:9px 12px;font-size:14px;font-family:inherit;color:#0f172a;outline:none;transition:border-color .15s;}
    .form-input:focus{border-color:#3b82f6;}
    .form-textarea{width:100%;border:1.5px solid #e2e8f0;border-radius:9px;padding:9px 12px;font-size:14px;font-family:inherit;color:#0f172a;outline:none;resize:vertical;min-height:72px;transition:border-color .15s;}
    .form-textarea:focus{border-color:#3b82f6;}
    .form-row{display:grid;grid-template-columns:1fr 1fr;gap:14px;}
    .toggle-track{width:40px;height:22px;border-radius:99px;background:#e2e8f0;position:relative;transition:background .2s;cursor:pointer;}
    .toggle-track.on{background:#3b82f6;}
    .toggle-thumb{position:absolute;top:3px;left:3px;width:16px;height:16px;border-radius:50%;background:#fff;transition:left .2s;}
    .toggle-track.on .toggle-thumb{left:21px;}

    .img-trigger{display:flex;align-items:center;gap:8px;padding:10px 14px;border-radius:10px;border:1.5px dashed #cbd5e1;background:#f8fafc;cursor:pointer;font-size:14px;font-weight:500;color:#64748b;font-family:inherit;width:100%;text-align:left;transition:all .15s;}
    .img-trigger:hover{border-color:#3b82f6;color:#3b82f6;background:#eff6ff;}
    .img-trigger.has-img{border-color:#10b981;color:#10b981;background:#ecfdf5;border-style:solid;}
    .img-drop{border:1.5px dashed #3b82f6;border-radius:10px;background:#eff6ff;padding:24px;text-align:center;margin-top:10px;animation:slideDown .2s ease;}
    .img-drop p{font-size:13px;color:#3b82f6;font-weight:500;margin:0 0 12px;}
    .choose-btn{display:inline-flex;align-items:center;gap:6px;background:#3b82f6;color:#fff;border:none;border-radius:8px;padding:8px 16px;font-size:13px;font-weight:600;cursor:pointer;font-family:inherit;}
    .img-preview{width:100%;height:150px;object-fit:cover;border-radius:10px;border:1px solid #e2e8f0;display:block;margin-top:12px;}

    .form-err{background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:10px 14px;color:#dc2626;font-size:13px;margin-bottom:16px;display:flex;align-items:center;gap:8px;}
    .form-footer{display:flex;gap:10px;justify-content:flex-end;padding:16px 24px;border-top:1px solid #f1f5f9;position:sticky;bottom:0;background:#fff;}
    .btn-save{background:#3b82f6;color:#fff;border:none;border-radius:10px;padding:10px 22px;font-size:14px;font-weight:600;cursor:pointer;font-family:inherit;display:flex;align-items:center;gap:7px;}
    .btn-save:disabled{opacity:.6;cursor:not-allowed;}
    .btn-cancel{background:#fff;color:#64748b;border:1px solid #e2e8f0;border-radius:10px;padding:10px 18px;font-size:14px;font-weight:500;cursor:pointer;font-family:inherit;}

    .empty{text-align:center;padding:60px 20px;background:#fff;border-radius:14px;border:1px solid #e2e8f0;}
    .err-bar{background:#fef2f2;border:1px solid #fecaca;border-radius:12px;padding:16px 20px;color:#dc2626;display:flex;align-items:center;gap:10px;margin-bottom:24px;font-size:14px;}
    .err-btn{margin-left:auto;background:#dc2626;color:#fff;border:none;border-radius:8px;padding:6px 14px;cursor:pointer;font-size:13px;font-family:inherit;}
  `;

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', fontFamily:"'DM Sans',sans-serif", color:'#64748b', gap:10 }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}} .spin{animation:spin .8s linear infinite}`}</style>
      <Loader size={20} className="spin" /> Loading banners…
    </div>
  );

  return (
    <div className="hp">
      <style>{css}</style>

      {/* Header */}
      <div className="hp-hd">
        <div>
          <div className="hp-title">
            <ImageIcon size={22} color="#7c3aed" />
            Hero Banners
            <span className="hp-chip">{banners.length}</span>
          </div>
          <div className="hp-sub">Manage homepage carousel · Changes reflect immediately on the site</div>
        </div>
        <div className="hp-actions">
          <button className="btn-ghost" onClick={loadBanners}><RefreshCw size={14} /> Refresh</button>
          <button className="btn-primary" onClick={openCreate}><Plus size={16} /> Add Banner</button>
        </div>
      </div>

      {error && (
        <div className="err-bar">
          <AlertCircle size={18} /> {error}
          <button className="err-btn" onClick={loadBanners}>Retry</button>
        </div>
      )}

      {banners.length === 0 && !error ? (
        <div className="empty">
          <div style={{ fontSize:48, marginBottom:12 }}>🖼️</div>
          <div style={{ fontWeight:600, color:'#475569', marginBottom:6 }}>No banners yet</div>
          <div style={{ fontSize:14, color:'#94a3b8', marginBottom:20 }}>Add your first hero banner to display on the homepage</div>
          <button className="btn-primary" onClick={openCreate} style={{ margin:'0 auto' }}><Plus size={16} /> Add Banner</button>
        </div>
      ) : (
        <div className="banners-grid">
          {banners.map(banner => (
            <div key={banner.id} className="bn-card">
              {banner.image_url
                ? <img src={banner.image_url} alt={banner.title} className="bn-img" />
                : <div className="bn-no-img"><ImageIcon size={32} /><span style={{ fontSize:13 }}>No image</span></div>
              }
              <div className="bn-body">
                <div className="bn-order">Slide #{banner.display_order}</div>
                <div className="bn-title">{banner.title}</div>
                <div className="bn-sub">{banner.subtitle}</div>
                <div className="bn-footer">
                  <span className={`badge ${banner.is_active ? 'b-on' : 'b-off'}`}>
                    {banner.is_active ? 'Active' : 'Inactive'}
                  </span>
                  <button className="icon-btn edit-btn" onClick={() => openEdit(banner)}><Edit2 size={12} /> Edit</button>
                  <button className="icon-btn" onClick={() => handleToggle(banner)}>
                    {banner.is_active ? <><EyeOff size={12} /> Hide</> : <><Eye size={12} /> Show</>}
                  </button>
                  <button className="icon-btn del" onClick={() => handleDelete(banner.id)}><Trash2 size={12} /> Delete</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Form Modal ── */}
      {showForm && (
        <div className="form-overlay" onClick={e => { if (e.target === e.currentTarget) closeForm(); }}>
          <div className="form-box">
            <div className="form-hd">
              <div className="form-title">{editingBanner ? 'Edit Banner' : 'Add New Banner'}</div>
              <button className="close-btn" onClick={closeForm}><X size={20} /></button>
            </div>

            <div className="form-body">
              {formError && <div className="form-err"><AlertCircle size={15} /> {formError}</div>}

              {/* ── Image Section ── */}
              <div className="form-group">
                <label className="form-label">Banner Image {!editingBanner && <span style={{ color:'#ef4444' }}>*</span>}</label>

                {/* Toggle trigger */}
                <button
                  type="button"
                  className={`img-trigger ${previewUrl ? 'has-img' : ''}`}
                  onClick={() => setShowImageField(v => !v)}
                >
                  {previewUrl
                    ? <><CheckCircle size={16} /> {selectedFile ? selectedFile.name : 'Current image'} · Click to change</>
                    : <><Upload size={16} /> Click to select banner image</>
                  }
                </button>

                {/* File picker — revealed on click */}
                {showImageField && (
                  <div className="img-drop">
                    <p>JPG, PNG or WebP · Max 10MB</p>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      style={{ display:'none' }}
                      ref={fileRef}
                      onChange={e => { if (e.target.files[0]) handleFileSelect(e.target.files[0]); e.target.value = ''; }}
                    />
                    <button type="button" className="choose-btn" onClick={() => fileRef.current?.click()}>
                      <Upload size={14} /> Choose File
                    </button>
                  </div>
                )}

                {/* Preview */}
                {previewUrl && <img src={previewUrl} alt="Preview" className="img-preview" />}
              </div>

              {/* Title */}
              <div className="form-group">
                <label className="form-label">Title <span style={{ color:'#ef4444' }}>*</span></label>
                <input className="form-input" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="e.g. Summer Rentals" />
              </div>

              {/* Subtitle */}
              <div className="form-group">
                <label className="form-label">Subtitle</label>
                <input className="form-input" value={form.subtitle} onChange={e => setForm(p => ({ ...p, subtitle: e.target.value }))} placeholder="Short tagline" />
              </div>

              {/* Description */}
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea className="form-textarea" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Optional longer text" />
              </div>

              {/* Button text + link */}
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Button Text</label>
                  <input className="form-input" value={form.button_text} onChange={e => setForm(p => ({ ...p, button_text: e.target.value }))} placeholder="Shop Now" />
                </div>
                <div className="form-group">
                  <label className="form-label">Button Link</label>
                  <input className="form-input" value={form.button_link} onChange={e => setForm(p => ({ ...p, button_link: e.target.value }))} placeholder="/products" />
                </div>
              </div>

              {/* Order + Active toggle */}
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Display Order</label>
                  <input className="form-input" type="number" min="1" value={form.display_order} onChange={e => setForm(p => ({ ...p, display_order: parseInt(e.target.value) || 1 }))} />
                </div>
                <div className="form-group" style={{ display:'flex', flexDirection:'column', justifyContent:'flex-end' }}>
                  <label className="form-label">Visible on Homepage</label>
                  <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                    <div
                      className={`toggle-track ${form.is_active ? 'on' : ''}`}
                      onClick={() => setForm(p => ({ ...p, is_active: !p.is_active }))}
                    >
                      <div className="toggle-thumb" />
                    </div>
                    <span style={{ fontSize:13, color:'#64748b' }}>{form.is_active ? 'Yes' : 'No'}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="form-footer">
              <button className="btn-cancel" onClick={closeForm}>Cancel</button>
              <button className="btn-save" onClick={handleSave} disabled={saving}>
                {saving
                  ? <><Loader size={14} className="spin" /> Saving…</>
                  : <><CheckCircle size={14} /> {editingBanner ? 'Save Changes' : 'Create Banner'}</>
                }
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}