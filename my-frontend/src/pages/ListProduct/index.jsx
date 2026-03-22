/* src/pages/ListProduct/index.jsx */

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { createListing } from '../../services/listings';
import { fetchHomepageCategories } from '../../services/categories';
import IframeWelcome from '../../components/IframeWelcome/IframeWelcome';
import './index.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

const MONTH_NAMES = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December'
];

// ── Utility: compute human-readable item age ─────────────────────────────────
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

export default function ListProduct() {
  const { user }     = useAuth();
  const navigate     = useNavigate();
  const fileInputRef = useRef();

  const [categories,        setCategories]        = useState([]);
  const [subcategories,     setSubcategories]     = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [pincodeLoading,    setPincodeLoading]    = useState(false);
  const [showSuccess,       setShowSuccess]       = useState(false);

  const [form, setForm] = useState({
    // ── Item Details ───────────────────────────────
    itemName:    '',
    category:    '',
    subcategory: '',
    description: '',
    location:    '',

    // ── Condition & History ────────────────────────
    condition:             '',
    purchaseMonth:         '',
    purchaseYear:          '',
    originalPurchasePrice: '',

    // ── Rental Rules ───────────────────────────────
    minRentalDays:      '1',
    maxRentalDays:      '',
    advanceBookingDays: '1',

    // ── Delivery & Handover ────────────────────────
    deliveryHandlerType: 'you',    // 'you' | 'company'
    deliveryOption:      'pickup', // 'pickup' | 'delivery' | 'both'  — shown when 'you'
    deliveryRadius:      '',       // km — shown when delivery involved

    // ── Rental Coverage ────────────────────────────
    pincode: '',
    city:    '',
    state:   '',
    country: 'India',

    // ── Safety ────────────────────────────────────
    idVerificationRequired: false,
    insuranceAvailable:     false,

    // ── Pricing ───────────────────────────────────
    securityDeposit:   '',
    rentalPricePerDay: '',

    // ── Terms & Promo ─────────────────────────────
    termsAndConditions: '',
    promoCode:          '',
    displayTagline:     '',
  });

  const [photos,      setPhotos]      = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);
  const [loading,     setLoading]     = useState(false);
  const [errors,      setErrors]      = useState({});
  const [dragOver,    setDragOver]    = useState(false);

  const itemAge     = useMemo(() => computeItemAge(form.purchaseMonth, form.purchaseYear), [form.purchaseMonth, form.purchaseYear]);
  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 31 }, (_, i) => currentYear - i);

  // ── Load parent categories ───────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const data = await fetchHomepageCategories();
        setCategories(data.categories || []);
      } catch (err) {
        console.error('Failed to load categories:', err);
        setErrors(prev => ({ ...prev, categories: 'Failed to load categories' }));
      } finally {
        setLoadingCategories(false);
      }
    })();
  }, []);

  // ── Load subcategories when category changes ─────────────────────────────
  useEffect(() => {
    if (!form.category) {
      setSubcategories([]);
      setForm(prev => ({ ...prev, subcategory: '' }));
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

  // ── Auto-lookup city/state from pincode_master ───────────────────────────
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
          setErrors(prev => ({ ...prev, pincode: '' }));
        }
      } catch {
        // silent — user can still fill manually
      } finally {
        setPincodeLoading(false);
      }
    };
    lookup();
  }, [form.pincode]);

  if (!user?.lender) { navigate('/list-item'); return null; }

  // ── Generic input handler ────────────────────────────────────────────────
  const handleInput = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
      ...(name === 'category' ? { subcategory: '' } : {}),
      // Reset delivery option to 'pickup' when switching to company
      ...(name === 'deliveryHandlerType' && value === 'company'
        ? { deliveryOption: 'pickup', deliveryRadius: '' }
        : {}),
    }));
    setErrors(prev => ({ ...prev, [name]: '' }));
  };

  // ── Photo handlers ───────────────────────────────────────────────────────
  const handlePhotoSelect = (files) => {
    const validFiles = Array.from(files).filter(file => {
      if (!['image/jpeg','image/jpg','image/png'].includes(file.type)) {
        setErrors(prev => ({ ...prev, photos: 'Only JPG, JPEG, PNG files allowed' })); return false;
      }
      if (file.size > 10 * 1024 * 1024) {
        setErrors(prev => ({ ...prev, photos: 'File must be under 10MB' })); return false;
      }
      return true;
    });
    if (photos.length + validFiles.length > 5) {
      setErrors(prev => ({ ...prev, photos: 'Maximum 5 photos allowed' })); return;
    }
    setPhotos(prev => [...prev, ...validFiles]);
    setPreviewUrls(prev => [...prev, ...validFiles.map(f => URL.createObjectURL(f))]);
    setErrors(prev => ({ ...prev, photos: '' }));
  };

  const handleFileChange = (e) => { handlePhotoSelect(e.target.files); e.target.value = null; };
  const handleDrop = (e) => {
    e.preventDefault(); e.stopPropagation();
    setDragOver(false); handlePhotoSelect(e.dataTransfer.files);
  };
  const removePhoto = (index) => {
    URL.revokeObjectURL(previewUrls[index]);
    setPhotos(prev => prev.filter((_, i) => i !== index));
    setPreviewUrls(prev => prev.filter((_, i) => i !== index));
  };

  // ── Validation ───────────────────────────────────────────────────────────
  const validate = () => {
    const e = {};
    if (!form.itemName.trim())  e.itemName  = 'Item name is required';
    if (!form.category)         e.category  = 'Please select a category';
    if (subcategories.length > 0 && !form.subcategory) e.subcategory = 'Please select a subcategory';
    if (!form.location.trim())  e.location  = 'Location is required';
    if (!form.condition)        e.condition = 'Please select item condition';
    if (!form.rentalPricePerDay || Number(form.rentalPricePerDay) <= 0)
                                e.rentalPricePerDay = 'Valid price is required';
    if (photos.length === 0)    e.photos    = 'At least one photo is required';

    // Delivery radius only required when lender handles delivery
    if (form.deliveryHandlerType === 'you' && showDeliveryRadius && !form.deliveryRadius)
                                e.deliveryRadius = 'Please enter delivery radius';

    // Duration cross-check
    if (form.maxRentalDays && parseInt(form.maxRentalDays) < parseInt(form.minRentalDays))
                                e.maxRentalDays = 'Max must be ≥ min duration';

    // Purchase date cross-check
    if (form.purchaseYear && !form.purchaseMonth) e.purchaseMonth = 'Please select purchase month';
    if (form.purchaseMonth && !form.purchaseYear) e.purchaseYear  = 'Please select purchase year';

    // Rental coverage
    if (!form.pincode.trim())   e.pincode = 'Pincode is required';
    else if (!/^\d{6}$/.test(form.pincode)) e.pincode = 'Enter a valid 6-digit pincode';
    if (!form.city.trim())      e.city    = 'City is required';
    if (!form.state.trim())     e.state   = 'State is required';
    if (!form.country.trim())   e.country = 'Country is required';

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // ── Handle success iframe close ──────────────────────────────────────────
  const handleSuccessClose = () => {
    setShowSuccess(false);
    navigate('/');
  };

  // ── Submit ───────────────────────────────────────────────────────────────
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
    try {
      await createListing(formData);
      setShowSuccess(true); // Show success iframe instead of immediate redirect
    } catch (err) {
      setErrors(prev => ({ ...prev, submit: err.response?.data?.message || 'Failed to list item' }));
    } finally {
      setLoading(false);
    }
  };

  // ── Derived values ───────────────────────────────────────────────────────
  const selectedCategory    = categories.find(c => c.id === parseInt(form.category));
  const selectedSubcategory = subcategories.find(s => s.id === parseInt(form.subcategory));
  const subcategoryPlaceholder = !form.category ? 'Select category first'
    : subcategories.length === 0 ? 'No subcategories available'
    : 'Select a subcategory';

  const isYouHandling      = form.deliveryHandlerType === 'you';
  const showDeliveryRadius = isYouHandling &&
    (form.deliveryOption === 'delivery' || form.deliveryOption === 'both');

  const conditionStyle = {
    'Excellent':          { bg: '#dcfce7', color: '#15803d', border: '#86efac' },
    'Good':               { bg: '#dbeafe', color: '#1d4ed8', border: '#93c5fd' },
    'Fair':               { bg: '#fef9c3', color: '#92400e', border: '#fcd34d' },
    'Needs Minor Repair': { bg: '#fee2e2', color: '#b91c1c', border: '#fca5a5' },
  }[form.condition] || null;

  // ────────────────────────────────────────────────────────────────────────
  return (
    <div className="list-product-page">
      <div className="container">
        <h1>List Your Item for Rent</h1>

        <form onSubmit={handleSubmit}>

          {/* ═══════════════════════════════════════════════════════════
              1. ITEM DETAILS
          ══════════════════════════════════════════════════════════ */}
          <section className="form-section">
            <h2>Item Details</h2>

            <label>
              Item Name *
              <input name="itemName" value={form.itemName} onChange={handleInput}
                placeholder="e.g. Mountain Bike" className={errors.itemName ? 'error' : ''} />
              {errors.itemName && <span className="error-msg">{errors.itemName}</span>}
            </label>

            <label>
              Category *
              <select name="category" value={form.category} onChange={handleInput}
                className={errors.category ? 'error' : ''} disabled={loadingCategories}>
                <option value="">{loadingCategories ? 'Loading categories…' : 'Select a category'}</option>
                {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
              </select>
              {errors.category && <span className="error-msg">{errors.category}</span>}
            </label>

            <label>
              Subcategory {subcategories.length > 0 && '*'}
              <select name="subcategory" value={form.subcategory} onChange={handleInput}
                className={errors.subcategory ? 'error' : ''}
                disabled={!form.category || subcategories.length === 0}>
                <option value="">{subcategoryPlaceholder}</option>
                {subcategories.map(sub => <option key={sub.id} value={sub.id}>{sub.name}</option>)}
              </select>
              {errors.subcategory && <span className="error-msg">{errors.subcategory}</span>}
            </label>

            {(selectedCategory || selectedSubcategory) && (
              <div className="category-path">
                <strong>Selected:</strong>
                <span>{selectedCategory?.name}{selectedSubcategory && ` → ${selectedSubcategory.name}`}</span>
              </div>
            )}

            <label>
              Description
              <textarea name="description" value={form.description} onChange={handleInput}
                placeholder="Describe your item — features, accessories included, usage tips…" />
            </label>

            <label>
              Location *
              <input name="location" value={form.location} onChange={handleInput}
                placeholder="Pickup or delivery location" className={errors.location ? 'error' : ''} />
              {errors.location && <span className="error-msg">{errors.location}</span>}
            </label>
          </section>

          {/* ═══════════════════════════════════════════════════════════
              2. ITEM CONDITION & HISTORY
          ══════════════════════════════════════════════════════════ */}
          <section className="form-section">
            <h2>Item Condition &amp; History</h2>

            <label>
              Condition *
              <select name="condition" value={form.condition} onChange={handleInput}
                className={errors.condition ? 'error' : ''}>
                <option value="">Select condition</option>
                <option value="Excellent">Excellent — Like new, minimal use</option>
                <option value="Good">Good — Normal wear, works perfectly</option>
                <option value="Fair">Fair — Visible wear, fully functional</option>
                <option value="Needs Minor Repair">Needs Minor Repair — Small fix needed</option>
              </select>
              {errors.condition && <span className="error-msg">{errors.condition}</span>}
            </label>

            {conditionStyle && (
              <div className="condition-badge" style={{
                background: conditionStyle.bg,
                color: conditionStyle.color,
                border: `1px solid ${conditionStyle.border}`,
              }}>
                <span className="condition-badge-dot" style={{ background: conditionStyle.color }} />
                {form.condition}
              </div>
            )}

            <div className="field-group-label">
              Purchase Date <span className="optional-tag">(Optional)</span>
            </div>
            <div className="purchase-date-row">
              <div className="purchase-date-field">
                <label>
                  Month
                  <select name="purchaseMonth" value={form.purchaseMonth} onChange={handleInput}
                    className={errors.purchaseMonth ? 'error' : ''}>
                    <option value="">Month</option>
                    {MONTH_NAMES.map((name, i) => <option key={i + 1} value={i + 1}>{name}</option>)}
                  </select>
                  {errors.purchaseMonth && <span className="error-msg">{errors.purchaseMonth}</span>}
                </label>
              </div>
              <div className="purchase-date-field">
                <label>
                  Year
                  <select name="purchaseYear" value={form.purchaseYear} onChange={handleInput}
                    className={errors.purchaseYear ? 'error' : ''}>
                    <option value="">Year</option>
                    {yearOptions.map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                  {errors.purchaseYear && <span className="error-msg">{errors.purchaseYear}</span>}
                </label>
              </div>
            </div>

            {itemAge && (
              <div className="item-age-display">
                <span className="age-icon">🕐</span>
                <div className="age-text">
                  <span className="age-label">Calculated Item Age</span>
                  <span className="age-value">{itemAge}</span>
                </div>
              </div>
            )}

            <label>
              Original Purchase Price <span className="optional-tag">(Optional)</span>
              <div className="currency-input">
                <span className="currency-symbol">₹</span>
                <input type="number" name="originalPurchasePrice" value={form.originalPurchasePrice}
                  onChange={handleInput} min="0" step="1" placeholder="What you paid for it" />
              </div>
              <small className="help-text">Helps renters understand the item's value and justify the security deposit.</small>
            </label>
          </section>

          {/* ═══════════════════════════════════════════════════════════
              3. PHOTOS
          ══════════════════════════════════════════════════════════ */}
          <section className="form-section">
            <h2>Add Photos *</h2>
            <div className={`photo-upload-zone ${dragOver ? 'drag-over' : ''}`}
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}>
              <span className="material-symbols-outlined">cloud_upload</span>
              <p className="main-text">Drag and drop photos here</p>
              <p className="sub-text">or</p>
              <button type="button" className="browse-btn">Browse to upload</button>
              <input ref={fileInputRef} type="file" multiple accept=".jpg,.jpeg,.png"
                onChange={handleFileChange} hidden />
            </div>
            {errors.photos && <span className="error-msg">{errors.photos}</span>}
            <div className="photo-previews">
              {previewUrls.map((url, i) => (
                <div key={i} className="preview-card">
                  <img src={url} alt={`Preview ${i + 1}`} />
                  <button type="button" className="remove-btn" onClick={() => removePhoto(i)}>×</button>
                </div>
              ))}
            </div>
          </section>

          {/* ═══════════════════════════════════════════════════════════
              4. PRICING
          ══════════════════════════════════════════════════════════ */}
          <section className="form-section">
            <h2>Pricing</h2>

            <label>
              Rental Price per Day *
              <div className="currency-input">
                <span className="currency-symbol">₹</span>
                <input type="number" name="rentalPricePerDay" value={form.rentalPricePerDay}
                  onChange={handleInput} min="1" step="0.01" placeholder="0.00"
                  className={errors.rentalPricePerDay ? 'error' : ''} />
              </div>
              {errors.rentalPricePerDay && <span className="error-msg">{errors.rentalPricePerDay}</span>}
            </label>

            <label>
              Security Deposit <span className="optional-tag">(Optional)</span>
              <div className="currency-input">
                <span className="currency-symbol">₹</span>
                <input type="number" name="securityDeposit" value={form.securityDeposit}
                  onChange={handleInput} min="0" step="0.01" placeholder="Refundable deposit amount" />
              </div>
            </label>

            <div className="field-group-label">Rental Duration Rules</div>
            <div className="duration-row">
              <div className="duration-field">
                <label>
                  Minimum Duration *
                  <select name="minRentalDays" value={form.minRentalDays} onChange={handleInput}>
                    <option value="1">1 day</option>
                    <option value="2">2 days</option>
                    <option value="3">3 days</option>
                    <option value="7">1 week</option>
                    <option value="14">2 weeks</option>
                    <option value="30">1 month</option>
                  </select>
                </label>
              </div>
              <div className="duration-field">
                <label>
                  Maximum Duration
                  <select name="maxRentalDays" value={form.maxRentalDays} onChange={handleInput}
                    className={errors.maxRentalDays ? 'error' : ''}>
                    <option value="">No limit</option>
                    <option value="1">1 day</option>
                    <option value="2">2 days</option>
                    <option value="3">3 days</option>
                    <option value="7">1 week</option>
                    <option value="14">2 weeks</option>
                    <option value="30">1 month</option>
                    <option value="90">3 months</option>
                  </select>
                  {errors.maxRentalDays && <span className="error-msg">{errors.maxRentalDays}</span>}
                </label>
              </div>
            </div>

            <label>
              Advance Booking Notice *
              <select name="advanceBookingDays" value={form.advanceBookingDays} onChange={handleInput}>
                <option value="0">Same day booking allowed</option>
                <option value="1">1 day notice</option>
                <option value="2">2 days notice</option>
                <option value="3">3 days notice</option>
                <option value="7">1 week notice</option>
              </select>
              <small className="help-text">Minimum notice required before the rental start date.</small>
            </label>
          </section>

          {/* ═══════════════════════════════════════════════════════════
              5. DELIVERY & HANDOVER
          ══════════════════════════════════════════════════════════ */}
          <section className="form-section">
            <h2>Delivery &amp; Handover</h2>

            {/* ── Step 1: Who handles delivery? ── */}
            <div className="field-group-label">Who handles delivery? *</div>
            <div className="handler-cards">

              <label className={`handler-card ${form.deliveryHandlerType === 'you' ? 'selected' : ''}`}>
                <input type="radio" name="deliveryHandlerType" value="you"
                  checked={form.deliveryHandlerType === 'you'} onChange={handleInput} />
                <div className="handler-card-icon">🙋</div>
                <div className="handler-card-body">
                  <span className="handler-card-title">You</span>
                  <span className="handler-card-desc">You personally manage pickup &amp; delivery</span>
                </div>
                {form.deliveryHandlerType === 'you' && (
                  <span className="handler-check">✓</span>
                )}
              </label>

              <label className={`handler-card ${form.deliveryHandlerType === 'company' ? 'selected' : ''}`}>
                <input type="radio" name="deliveryHandlerType" value="company"
                  checked={form.deliveryHandlerType === 'company'} onChange={handleInput} />
                <div className="handler-card-icon">🏢</div>
                <div className="handler-card-body">
                  <span className="handler-card-title">Company</span>
                  <span className="handler-card-desc">Platform's logistics partner handles delivery</span>
                </div>
                {form.deliveryHandlerType === 'company' && (
                  <span className="handler-check">✓</span>
                )}
              </label>

            </div>

            {/* ── Step 2a: You selected → show delivery options ── */}
            {isYouHandling && (
              <div className="fade-in">
                <div className="field-group-label" style={{ marginTop: '1.25rem' }}>
                  Pickup / Delivery Type *
                </div>
                <div className="delivery-options">
                  {[
                    { value: 'pickup',   icon: '🏠', label: 'Pickup Only',        desc: 'Renter collects from you' },
                    { value: 'delivery', icon: '🚚', label: 'Delivery Available', desc: 'You deliver to renter'    },
                    { value: 'both',     icon: '🔄', label: 'Both',               desc: 'Pickup or delivery'       },
                  ].map(opt => (
                    <label key={opt.value}
                      className={`delivery-option-card ${form.deliveryOption === opt.value ? 'selected' : ''}`}>
                      <input type="radio" name="deliveryOption" value={opt.value}
                        checked={form.deliveryOption === opt.value} onChange={handleInput} />
                      <span className="delivery-icon">{opt.icon}</span>
                      <span className="delivery-label">{opt.label}</span>
                      <span className="delivery-desc">{opt.desc}</span>
                    </label>
                  ))}
                </div>

                {showDeliveryRadius && (
                  <label className="fade-in" style={{ marginTop: '1rem' }}>
                    Delivery Radius *
                    <div className="suffix-input">
                      <input type="number" name="deliveryRadius" value={form.deliveryRadius}
                        onChange={handleInput} min="1" max="200" placeholder="e.g. 10"
                        className={errors.deliveryRadius ? 'error' : ''} />
                      <span className="suffix-label">km</span>
                    </div>
                    {errors.deliveryRadius && <span className="error-msg">{errors.deliveryRadius}</span>}
                    <small className="help-text">Maximum distance you're willing to deliver.</small>
                  </label>
                )}
              </div>
            )}

            {/* ── Step 2b: Company selected → info banner ── */}
            {!isYouHandling && (
              <div className="company-delivery-info fade-in">
                <div className="company-delivery-icon">🏢</div>
                <div className="company-delivery-body">
                  <strong>Company handles all logistics</strong>
                  <p>
                    Our logistics partner will be fully responsible for pickup, delivery,
                    and safe return of your item. You just need to have it ready at the
                    listed location on the booking date.
                  </p>
                  <ul className="company-delivery-points">
                    <li>✅ Tracked end-to-end delivery</li>
                    <li>✅ Insured during transit</li>
                    <li>✅ Renter notified of all updates</li>
                  </ul>
                </div>
              </div>
            )}
          </section>

          {/* ═══════════════════════════════════════════════════════════
              6. RENTAL COVERAGE
          ══════════════════════════════════════════════════════════ */}
          <section className="form-section">
            <h2>Rental Coverage</h2>
            <small className="help-text" style={{ display: 'block', marginBottom: '1.25rem' }}>
              Define the geographic area where this item is available for rent.
            </small>

            {/* Pincode — with auto-lookup */}
            <label>
              Pincode *
              <div className="pincode-input-wrapper">
                <input
                  name="pincode"
                  value={form.pincode}
                  onChange={handleInput}
                  placeholder="e.g. 110001"
                  maxLength={6}
                  className={errors.pincode ? 'error' : ''}
                />
                {pincodeLoading && <span className="pincode-spinner">⟳</span>}
                {!pincodeLoading && form.city && form.pincode.length === 6 && (
                  <span className="pincode-resolved">✓ Resolved</span>
                )}
              </div>
              {errors.pincode && <span className="error-msg">{errors.pincode}</span>}
              <small className="help-text">City &amp; State will auto-fill from pincode.</small>
            </label>

            {/* City + State side by side */}
            <div className="coverage-row">
              <div className="coverage-field">
                <label>
                  City *
                  <input name="city" value={form.city} onChange={handleInput}
                    placeholder="e.g. New Delhi" className={errors.city ? 'error' : ''} />
                  {errors.city && <span className="error-msg">{errors.city}</span>}
                </label>
              </div>
              <div className="coverage-field">
                <label>
                  State *
                  <input name="state" value={form.state} onChange={handleInput}
                    placeholder="e.g. Delhi" className={errors.state ? 'error' : ''} />
                  {errors.state && <span className="error-msg">{errors.state}</span>}
                </label>
              </div>
            </div>

            {/* Country */}
            <label>
              Country *
              <select name="country" value={form.country} onChange={handleInput}
                className={errors.country ? 'error' : ''}>
                <option value="India">India</option>
                <option value="United States">United States</option>
                <option value="United Kingdom">United Kingdom</option>
                <option value="Canada">Canada</option>
                <option value="Australia">Australia</option>
                <option value="UAE">UAE</option>
                <option value="Singapore">Singapore</option>
                <option value="Other">Other</option>
              </select>
              {errors.country && <span className="error-msg">{errors.country}</span>}
            </label>
          </section>

          {/* ═══════════════════════════════════════════════════════════
              7. SAFETY & VERIFICATION
          ══════════════════════════════════════════════════════════ */}
          <section className="form-section">
            <h2>Safety &amp; Verification</h2>
            <div className="toggle-row">
              <div className="toggle-card">
                <div className="toggle-info">
                  <span className="toggle-icon">🪪</span>
                  <div>
                    <span className="toggle-title">ID Verification Required</span>
                    <span className="toggle-desc">Renter must verify identity before booking</span>
                  </div>
                </div>
                <label className="toggle-switch">
                  <input type="checkbox" name="idVerificationRequired"
                    checked={form.idVerificationRequired} onChange={handleInput} />
                  <span className="toggle-slider" />
                </label>
              </div>

              <div className="toggle-card">
                <div className="toggle-info">
                  <span className="toggle-icon">🛡️</span>
                  <div>
                    <span className="toggle-title">Insurance Available</span>
                    <span className="toggle-desc">Item is covered by rental insurance</span>
                  </div>
                </div>
                <label className="toggle-switch">
                  <input type="checkbox" name="insuranceAvailable"
                    checked={form.insuranceAvailable} onChange={handleInput} />
                  <span className="toggle-slider" />
                </label>
              </div>
            </div>
          </section>

          {/* ═══════════════════════════════════════════════════════════
              8. TERMS & CONDITIONS
          ══════════════════════════════════════════════════════════ */}
          <section className="form-section">
            <h2>Terms &amp; Conditions</h2>
            <label>
              <textarea name="termsAndConditions" value={form.termsAndConditions}
                onChange={handleInput}
                placeholder="Specify any terms or conditions for renting your item…" />
            </label>
          </section>

          {/* ═══════════════════════════════════════════════════════════
              9. PROMOTIONS
          ══════════════════════════════════════════════════════════ */}
          <section className="form-section">
            <h2>Promotional Settings <span className="optional-tag">(Optional)</span></h2>
            <label>
              Display Tagline
              <input name="displayTagline" value={form.displayTagline} onChange={handleInput}
                placeholder="e.g., Perfect for weekend trips!" />
            </label>
            <label>
              Promo Code
              <input name="promoCode" value={form.promoCode} onChange={handleInput}
                placeholder="Special offer code" />
            </label>
          </section>

          {errors.submit && <div className="alert error">{errors.submit}</div>}

          <div className="form-actions">
            <button type="button" className="btn-cancel" onClick={() => navigate('/')}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Listing Item…' : 'List Item'}
            </button>
          </div>

        </form>
      </div>

      {/* ═══════════════════════════════════════════════════════════
          SUCCESS IFRAME MODAL
      ══════════════════════════════════════════════════════════ */}
      {showSuccess && (
        <IframeWelcome
          user={{ first_name: 'Success!' }}
          onClose={handleSuccessClose}
        />
      )}
    </div>
  );
}