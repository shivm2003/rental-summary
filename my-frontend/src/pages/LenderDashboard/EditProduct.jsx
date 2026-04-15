/* src/pages/LenderDashboard/EditProduct.jsx */

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { fetchHomepageCategories } from '../../services/categories';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import './EditProduct.scss'; // I'll create this or reuse styles

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

const MONTH_NAMES = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December'
];

function computeItemAge(purchaseMonth, purchaseYear) {
  if (!purchaseMonth || !purchaseYear) return null;
  const now      = new Date();
  const purchase = new Date(parseInt(purchaseYear), parseInt(purchaseMonth) - 1, 1);
  if (purchase > now) return null;
  let years  = now.getFullYear() - purchase.getFullYear();
  let months = now.getMonth()    - purchase.getMonth();
  if (months < 0) { years--; months += 12; }
  if (years === 0 && months === 0) return 'Less than a month old';
  if (years === 0) return `${months} month${months !== 1 ? 's' : ''} old`;
  if (months === 0) return `${years} year${years !== 1 ? 's' : ''} old`;
  return `${years} year${years !== 1 ? 's' : ''} ${months} month${months !== 1 ? 's' : ''} old`;
}

export default function EditProduct() {
  const { user }     = useAuth();
  const navigate     = useNavigate();
  const { id }       = useParams();
  const fileInputRef = useRef();
  const token        = localStorage.getItem('token');

  const [categories,        setCategories]        = useState([]);
  const [subcategories,     setSubcategories]     = useState([]);
  const [loadingProduct,    setLoadingProduct]    = useState(true);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [pincodeLoading,    setPincodeLoading]    = useState(false);

  const [form, setForm] = useState({
    itemName:    '',
    category:    '',
    subcategory: '',
    description: '',
    location:    '',
    condition:             '',
    purchaseMonth:         '',
    purchaseYear:          '',
    originalPurchasePrice: '',
    minRentalDays:      '1',
    maxRentalDays:      '',
    advanceBookingDays: '1',
    deliveryHandlerType: 'you',
    deliveryOption:      'pickup',
    deliveryRadius:      '',
    pincode: '',
    city:    '',
    state:   '',
    country: 'India',
    idVerificationRequired: false,
    insuranceAvailable:     false,
    securityDeposit:   '',
    rentalPricePerDay: '',
    priceUnit:         'day',
    termsAndConditions: '',
    promoCode:          '',
    displayTagline:     '',
  });

  const [photos,      setPhotos]      = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);
  const [existingPhotos, setExistingPhotos] = useState([]);
  const [deleteImages, setDeleteImages] = useState([]);
  const [loading,     setLoading]     = useState(false);
  const [errors,      setErrors]      = useState({});
  const [dragOver,    setDragOver]    = useState(false);

  const itemAge     = useMemo(() => computeItemAge(form.purchaseMonth, form.purchaseYear), [form.purchaseMonth, form.purchaseYear]);
  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 31 }, (_, i) => currentYear - i);

  // 1. Load Categories
  useEffect(() => {
    (async () => {
      try {
        const data = await fetchHomepageCategories();
        setCategories(data.categories || []);
      } catch (err) {
        console.error('Failed to load categories:', err);
      } finally {
        setLoadingCategories(false);
      }
    })();
  }, []);

  // 2. Load Product Data
  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const res = await axios.get(`${API_URL}/api/products/${id}`);
        const p = res.data;
        
        setForm({
          itemName:    p.item_name || '',
          category:    p.category_id || '',
          subcategory: p.subcategory_id || '',
          description: p.description || '',
          location:    p.location || '',
          condition:   p.condition || '',
          purchaseMonth: p.purchase_month || '',
          purchaseYear:  p.purchase_year || '',
          originalPurchasePrice: p.original_purchase_price || '',
          minRentalDays:      String(p.min_rental_days || '1'),
          maxRentalDays:      String(p.max_rental_days || ''),
          advanceBookingDays: String(p.advance_booking_days || '1'),
          deliveryHandlerType: p.delivery_handler_type || 'you',
          deliveryOption:      p.delivery_option || 'pickup',
          deliveryRadius:      p.delivery_radius_km || '',
          pincode: p.pincode || '',
          city:    p.city || '',
          state:   p.state || '',
          country: p.country || 'India',
          idVerificationRequired: !!p.id_verification_required,
          insuranceAvailable:     !!p.insurance_available,
          securityDeposit:   String(p.security_deposit || ''),
          rentalPricePerDay: String(p.rental_price_per_day || ''),
          priceUnit:         p.price_unit || 'day',
          termsAndConditions: p.terms_and_conditions || '',
          promoCode:          p.promo_code || '',
          displayTagline:     p.display_tagline || '',
        });
        
        setExistingPhotos(p.photos || []);
      } catch (err) {
        console.error('Failed to load product:', err);
        toast.error('Failed to load product details');
      } finally {
        setLoadingProduct(false);
      }
    })();
  }, [id]);

  // 3. Load subcategories when category changes
  useEffect(() => {
    if (!form.category) {
      setSubcategories([]);
      return;
    }
    (async () => {
      try {
        const res  = await fetch(`${API_URL}/api/categories/${form.category}/subcategories`);
        const data = await res.json();
        setSubcategories(data.success ? (data.subcategories || []) : []);
      } catch { setSubcategories([]); }
    })();
  }, [form.category]);

  // 4. Pincode lookup
  useEffect(() => {
    if (form.pincode.length !== 6 || !/^\d{6}$/.test(form.pincode)) return;
    const lookup = async () => {
      setPincodeLoading(true);
      try {
        const res  = await fetch(`${API_URL}/api/pincode/${form.pincode}`);
        const data = await res.json();
        if (data.success && data.pincode) {
          setForm(prev => ({
            ...prev,
            city:  data.pincode.city  || prev.city,
            state: data.pincode.state || prev.state,
          }));
        }
      } catch {} finally { setPincodeLoading(false); }
    };
    lookup();
  }, [form.pincode]);

  const handleInput = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handlePhotoSelect = (files) => {
    const validFiles = Array.from(files).filter(file => {
      if (!['image/jpeg','image/jpg','image/png'].includes(file.type)) {
        toast.error('Only JPG, JPEG, PNG files allowed'); return false;
      }
      if (file.size > 10 * 1024 * 1024) {
        toast.error('File must be under 10MB'); return false;
      }
      return true;
    });
    setPhotos(prev => [...prev, ...validFiles]);
    setPreviewUrls(prev => [...prev, ...validFiles.map(f => URL.createObjectURL(f))]);
  };

  const removePhoto = (index) => {
    URL.revokeObjectURL(previewUrls[index]);
    setPhotos(prev => prev.filter((_, i) => i !== index));
    setPreviewUrls(prev => prev.filter((_, i) => i !== index));
  };

  const removeExistingPhoto = (photoId) => {
    setDeleteImages(prev => [...prev, photoId]);
    setExistingPhotos(prev => prev.filter(p => p.id !== photoId));
  };

  const validate = () => {
    const e = {};
    if (!form.itemName.trim())  e.itemName  = 'Item name is required';
    if (!form.category)         e.category  = 'Please select a category';
    if (!form.location.trim())  e.location  = 'Location is required';
    if (!form.condition)        e.condition = 'Please select item condition';
    if (!form.rentalPricePerDay || Number(form.rentalPricePerDay) <= 0)
                                e.rentalPricePerDay = 'Valid price is required';
    if (existingPhotos.length + photos.length === 0)
                                e.photos    = 'At least one photo is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    const formData = new FormData();
    Object.entries(form).forEach(([key, value]) => {
      if (value !== '' && value !== null && value !== undefined) {
        formData.append(key, value);
      }
    });
    if (itemAge) formData.set('itemAge', itemAge);
    photos.forEach(photo => formData.append('photos', photo));
    formData.append('deleteImages', JSON.stringify(deleteImages));

    try {
      await axios.put(`${API_URL}/api/products/${id}`, formData, {
        headers: { 
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`
        }
      });
      toast.success('Listing updated successfully');
      navigate('/lender/products');
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to update item');
    } finally {
      setLoading(false);
    }
  };

  if (loadingProduct) return <div className="loading">Loading product...</div>;

  return (
    <div className="edit-product-page">
      <div className="container">
        <h1>Edit Your Item</h1>
        <form onSubmit={handleSubmit}>
          <section className="form-section">
            <h2>Item Details</h2>
            <label>Item Name *
              <input name="itemName" value={form.itemName} onChange={handleInput} className={errors.itemName ? 'error' : ''} />
              {errors.itemName && <span className="error-msg">{errors.itemName}</span>}
            </label>
            <label>Category *
              <select name="category" value={form.category} onChange={handleInput} disabled={loadingCategories}>
                <option value="">{loadingCategories ? 'Loading...' : 'Select a category'}</option>
                {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
              </select>
            </label>
            <label>Subcategory
              <select name="subcategory" value={form.subcategory} onChange={handleInput}>
                <option value="">Select subcategory</option>
                {subcategories.map(sub => <option key={sub.id} value={sub.id}>{sub.name}</option>)}
              </select>
            </label>
            <label>Description
              <textarea name="description" value={form.description} onChange={handleInput} />
            </label>
            <label>Product Available City *
              <input name="location" value={form.location} onChange={handleInput} />
            </label>
          </section>

          <section className="form-section">
            <h2>Photos</h2>
            <div className="photo-previews">
              {existingPhotos.map(photo => (
                <div key={photo.id} className="preview-card existing">
                  <img src={photo.fullUrl} alt="Existing" />
                  <button type="button" className="remove-btn" onClick={() => removeExistingPhoto(photo.id)}>×</button>
                </div>
              ))}
              {previewUrls.map((url, i) => (
                <div key={i} className="preview-card new">
                  <img src={url} alt="New" />
                  <button type="button" className="remove-btn" onClick={() => removePhoto(i)}>×</button>
                </div>
              ))}
            </div>
            <div className={`photo-upload-zone ${dragOver ? 'drag-over' : ''}`}
              onClick={() => fileInputRef.current?.click()}
              onDragOver={e => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={e => { e.preventDefault(); setDragOver(false); handlePhotoSelect(e.dataTransfer.files); }}>
              <p>Click or drag photos to add more</p>
              <input ref={fileInputRef} type="file" multiple accept=".jpg,.jpeg,.png" onChange={e => { handlePhotoSelect(e.target.files); e.target.value = null; }} hidden />
            </div>
          </section>

          <section className="form-section">
            <h2>Pricing & Rules</h2>
            <div className="price-input-row">
              <label>Rental Price *
                <input type="number" name="rentalPricePerDay" value={form.rentalPricePerDay} onChange={handleInput} />
              </label>
              <label>Unit
                <select name="priceUnit" value={form.priceUnit} onChange={handleInput}>
                  <option value="day">per day</option>
                  <option value="month">per month</option>
                </select>
              </label>
            </div>
            <label>Security Deposit
              <input type="number" name="securityDeposit" value={form.securityDeposit} onChange={handleInput} />
            </label>
          </section>

          <div className="form-actions">
            <button type="button" className="btn-cancel" onClick={() => navigate('/lender/products')}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={loading}>{loading ? 'Updating...' : 'Save Changes'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
