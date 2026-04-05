import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { getPincode, submitLender, getLenderStatus } from '../../services/lender';
import { reverseGeocode, parseNominatimAddress } from '../../services/pincode';
import { Navigation } from 'lucide-react';
import { toast } from 'react-hot-toast';
import './index.css';

export default function Lender() {
  const { user, fetchMe } = useAuth();
  const navigate = useNavigate();

  /* ---------- type switch ---------- */
  const [type, setType] = useState('individual');

  /* ---------- form fields ---------- */
  const [fullAddress, setFullAddress] = useState('');
  const [pincode, setPincode] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [digipin, setDigipin] = useState('');
  
  /* individual refs */
  const [ref1Name, setRef1Name] = useState('');
  const [ref1Mobile, setRef1Mobile] = useState('');
  const [ref2Name, setRef2Name] = useState('');
  const [ref2Mobile, setRef2Mobile] = useState('');
  
  /* business refs */
  const [gstin, setGstin] = useState('');
  const [tradeName, setTradeName] = useState('');
  const [legalOwnerName, setLegalOwnerName] = useState('');
  const [businessAddress, setBusinessAddress] = useState('');
  const [refName, setRefName] = useState('');
  const [refMobile, setRefMobile] = useState('');

  /* ---------- files ---------- */
  const [firstIdProof, setFirstIdProof] = useState(null);
  const [secondIdProof, setSecondIdProof] = useState(null);
  const [shopPhoto, setShopPhoto] = useState(null);
  const [gstCertificate, setGstCertificate] = useState(null);

  const [loading, setLoading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [msg, setMsg] = useState({ text: '', type: '', show: false });

  /* ---------- fetch status ---------- */
  const [appStatus, setAppStatus] = useState(null);
  const [checkingStatus, setCheckingStatus] = useState(true);

  useEffect(() => {
    getLenderStatus()
      .then(status => {
        setAppStatus(status);
        setCheckingStatus(false);
      })
      .catch(() => setCheckingStatus(false));
  }, []);

  /* ---------- get current location ---------- */
  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser');
      return;
    }

    setLocationLoading(true);
    toast.loading('Fetching your location...', { id: 'location_toast' });

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const data = await reverseGeocode(latitude, longitude);

          if (data && data.address) {
            const parsed = parseNominatimAddress(data.address, data.display_name);
            
            if (parsed.pincode && /^\d{6}$/.test(parsed.pincode)) {
              setPincode(parsed.pincode);
            }
            
            // Auto-fill city/state even if pincode is missing or needs lookup
            if (parsed.city) setCity(parsed.city);
            if (parsed.state) setState(parsed.state);
            
            toast.success('Location detected successfully!', { id: 'location_toast' });
          }
        } catch (error) {
          console.error('Geocoding error:', error);
          toast.error('Failed to fetch address details', { id: 'location_toast' });
        } finally {
          setLocationLoading(false);
        }
      },
      (error) => {
        setLocationLoading(false);
        toast.error('Unable to get your location. Please enable location access.', { id: 'location_toast' });
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  /* ---------- auto-dismiss success message ---------- */
  useEffect(() => {
    if (msg.show && msg.type === 'success') {
      const timer = setTimeout(() => {
        setMsg({ text: '', type: '', show: false });
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [msg]);

  /* ---------- auto city/state ---------- */
  useEffect(() => {
    if (pincode.length === 6) {
      getPincode(pincode)
        .then((res) => {
          // Backend returns { success: true, pincode: { city, state ... } }
          const details = res.pincode || res; 
          setCity(details.city || '');
          setState(details.state || '');
          setMsg({ text: '', type: '', show: false });
        })
        .catch(() => {
          setCity('');
          setState('');
          setMsg({ text: '❌ Invalid pincode', type: 'error', show: true });
        });
    } else {
      setCity('');
      setState('');
    }
  }, [pincode]);

  /* ---------- submit handler ---------- */
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setMsg({ text: '', type: '', show: false });

    const form = new FormData();
    form.append('lenderType', type);
    form.append('fullAddress', fullAddress);
    form.append('pincode', pincode);
    form.append('city', city);
    form.append('state', state);
    form.append('digipin', digipin);

    if (type === 'individual') {
      form.append('ref1Name', ref1Name);
      form.append('ref1Mobile', ref1Mobile);
      form.append('ref2Name', ref2Name);
      form.append('ref2Mobile', ref2Mobile);
      if (firstIdProof) form.append('firstIdProof', firstIdProof);
      if (secondIdProof) form.append('secondIdProof', secondIdProof);
    } else {
      form.append('gstin', gstin);
      form.append('tradeName', tradeName);
      form.append('legalOwnerName', legalOwnerName);
      form.append('businessAddress', businessAddress);
      form.append('refName', refName);
      form.append('refMobile', refMobile);
      if (shopPhoto) form.append('shopPhoto', shopPhoto);
      if (gstCertificate) form.append('gstCertificate', gstCertificate);
      if (firstIdProof) form.append('firstIdProof', firstIdProof);
      if (secondIdProof) form.append('secondIdProof', secondIdProof);
    }

    try {
      await submitLender(form);
      setMsg({ 
        text: '✅ Product listed successfully! Redirecting...', 
        type: 'success', 
        show: true 
      });
      await fetchMe();
      setTimeout(() => navigate('/'), 2000);
    } catch (err) {
      setMsg({ 
        text: `❌ ${err.response?.data?.message || 'Submission failed'}`, 
        type: 'error', 
        show: true 
      });
    } finally {
      setLoading(false);
    }
  };

  if (checkingStatus) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>Checking status...</div>;
  }

  if (appStatus && appStatus.status === 'pending') {
    return (
      <div className="lender-page">
        <div className="lender-card" style={{ textAlign: 'center', padding: '60px 40px' }}>
          <h2>Application Under Review</h2>
          <p style={{ marginTop: '16px', color: '#64748b', fontSize: '1.1rem', lineHeight: '1.6' }}>
            Your application to become a lender is currently pending admin approval. 
            Once approved, you will be able to access the Lender Dashboard.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="lender-page">
      <div className="lender-card">
        <h1>Become a Lender</h1>

        {/* ---- type toggle ---- */}
        <div className="type-toggle">
          <button className={type === 'individual' ? 'active' : ''} onClick={() => setType('individual')}>Individual</button>
          <button className={type === 'business' ? 'active' : ''} onClick={() => setType('business')}>Business Owner</button>
        </div>

        {/* ---- message alert ---- */}
        {msg.show && (
          <div className={`alert ${msg.type}`}>
            <span className="alert-icon">{msg.type === 'success' ? '✓' : '!'}</span>
            <span className="alert-text">{msg.text}</span>
            <button 
              className="alert-close" 
              onClick={() => setMsg({ text: '', type: '', show: false })}
              aria-label="Close message"
            >
              ×
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* ---------- COMMON ---------- */}
          <label>
            Full Address <span>*</span>
            <textarea maxLength="250" required value={fullAddress} onChange={(e) => setFullAddress(e.target.value)} />
          </label>

          <label>
            Pincode <span>*</span>
            <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
              <input type="text" pattern="\d{6}" required value={pincode} onChange={(e) => setPincode(e.target.value)} style={{ flex: 1, marginTop: 0 }} />
              <button 
                type="button" 
                onClick={getCurrentLocation}
                disabled={locationLoading}
                style={{ 
                  display: 'flex', alignItems: 'center', gap: '6px', 
                  padding: '10px 16px', background: '#f8fafc', 
                  color: '#334155', border: '1px solid #cbd5e1', borderRadius: '8px',
                  cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem',
                  whiteSpace: 'nowrap'
                }}
              >
                <Navigation size={16} />
                {locationLoading ? 'Locating...' : 'Locate Me'}
              </button>
            </div>
          </label>

          <div className="row">
            <label>
              City <span>*</span>
              <input value={city} readOnly />
            </label>
            <label>
              State <span>*</span>
              <input value={state} readOnly />
            </label>
          </div>

          <label>
            DigiPin (optional)
            <input value={digipin} onChange={(e) => setDigipin(e.target.value)} />
          </label>

          {/* ---------- INDIVIDUAL ---------- */}
          {type === 'individual' && (
            <>
              <h3>Reference 1 <span>*</span></h3>
              <label>
                Name <span>*</span>
                <input required maxLength="100" value={ref1Name} onChange={(e) => setRef1Name(e.target.value)} />
              </label>
              <label>
                Mobile <span>*</span>
                <input type="tel" pattern="\d{10}" required value={ref1Mobile} onChange={(e) => setRef1Mobile(e.target.value)} />
              </label>

              <h3>Reference 2 <span>*</span></h3>
              <label>
                Name <span>*</span>
                <input required maxLength="100" value={ref2Name} onChange={(e) => setRef2Name(e.target.value)} />
              </label>
              <label>
                Mobile <span>*</span>
                <input type="tel" pattern="\d{10}" required value={ref2Mobile} onChange={(e) => setRef2Mobile(e.target.value)} />
              </label>

              <label>
                First ID Proof <span>*</span> (JPG/PNG/PDF ≤ 5MB)
                <input type="file" accept=".jpg,.jpeg,.png,.pdf" required onChange={(e) => setFirstIdProof(e.target.files[0])} />
              </label>

              <label>
                Second ID Proof <span>*</span> (JPG/PNG/PDF ≤ 5MB)
                <input type="file" accept=".jpg,.jpeg,.png,.pdf" required onChange={(e) => setSecondIdProof(e.target.files[0])} />
              </label>
            </>
          )}

          {/* ---------- BUSINESS ---------- */}
          {type === 'business' && (
            <>
              <label>
                GSTIN <span>*</span>
                <input maxLength="15" required value={gstin} onChange={(e) => setGstin(e.target.value.toUpperCase())} />
              </label>

              <label>
                Trade Name <span>*</span>
                <input maxLength="100" required value={tradeName} onChange={(e) => setTradeName(e.target.value)} />
              </label>

              <label>
                Legal Owner Name <span>*</span>
                <input maxLength="100" required value={legalOwnerName} onChange={(e) => setLegalOwnerName(e.target.value)} />
              </label>

              <label>
                Business Address <span>*</span>
                <textarea maxLength="250" required value={businessAddress} onChange={(e) => setBusinessAddress(e.target.value)} />
              </label>

              <label>
                Upload Shop Photo <span>*</span> (JPG/PNG ≤ 5MB)
                <input type="file" accept=".jpg,.jpeg,.png" required onChange={(e) => setShopPhoto(e.target.files[0])} />
              </label>

              <label>
                Upload GST Certificate <span>*</span> (PDF/JPG/PNG ≤ 5MB)
                <input type="file" accept=".pdf,.jpg,.jpeg,.png" required onChange={(e) => setGstCertificate(e.target.files[0])} />
              </label>

              <h3>Reference <span>*</span></h3>
              <label>
                Name <span>*</span>
                <input maxLength="100" required value={refName} onChange={(e) => setRefName(e.target.value)} />
              </label>
              <label>
                Mobile <span>*</span>
                <input type="tel" pattern="\d{10}" required value={refMobile} onChange={(e) => setRefMobile(e.target.value)} />
              </label>

              <label>
                First ID Proof <span>*</span> (JPG/PNG/PDF ≤ 5MB)
                <input type="file" accept=".jpg,.jpeg,.png,.pdf" required onChange={(e) => setFirstIdProof(e.target.files[0])} />
              </label>

              <label>
                Second ID Proof <span>*</span> (JPG/PNG/PDF ≤ 5MB)
                <input type="file" accept=".jpg,.jpeg,.png,.pdf" required onChange={(e) => setSecondIdProof(e.target.files[0])} />
              </label>
            </>
          )}

          <div className="form-actions">
            <button type="button" className="btn-cancel" onClick={() => navigate('/')}>Cancel</button>
            <button type="submit" disabled={loading}>
              {loading ? 'Submitting…' : 'Submit Application'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}