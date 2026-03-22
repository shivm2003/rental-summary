import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { getPincode, submitLender } from '../../services/lender';
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
  const [msg, setMsg] = useState({ text: '', type: '', show: false });

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
          setCity(res.city);
          setState(res.state);
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

  return (
    <div className="lender-page">
      <div className="card">
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
            <input type="text" pattern="\d{6}" required value={pincode} onChange={(e) => setPincode(e.target.value)} />
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