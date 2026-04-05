import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { register, googleLogin, verifyOtp } from '../../services/auth';
import { useAuth } from '../../contexts/AuthContext';
import { GoogleLogin } from '@react-oauth/google';
import './index.scss';

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    firstName: '',
    lastName : '',
    email   : '',
    phone   : '',
    password: '',
    confirm : '',
  });
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [otpStep, setOtpStep] = useState(false);
  const [otp, setOtp] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const { login } = useAuth();

  const handleChange = e =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');

    if (!form.email || !form.email.trim() || !form.email.includes('@')) {
      return setError('Email ID is strictly mandatory for registration.');
    }

    if (!termsAccepted) {
      return setError('You must accept the Terms and Conditions to register.');
    }
    if (form.password !== form.confirm) {
      return setError('Passwords do not match');
    }
    
    if (form.password.length < 8) {
      return setError('Password must be at least 8 characters long');
    }
    if (!/\d/.test(form.password)) {
      return setError('Password must contain at least one number');
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(form.password)) {
      return setError('Password must contain at least one special character');
    }

    setLoading(true);
    try {
      await register({
        firstName: form.firstName,
        lastName : form.lastName,
        email    : form.email,
        phone    : form.phone,
        password : form.password,
      });
      setOtpStep(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpSubmit = async e => {
    e.preventDefault();
    if (!otp) return setError('Please enter the OTP sent to your email.');

    setLoading(true);
    setError('');
    try {
      const res = await verifyOtp({ email: form.email, otp });
      const userData = res.user || res;
      login(userData, userData.token || res.token);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      setLoading(true);
      setError('');
      const res = await googleLogin({ token: credentialResponse.credential });
      const userData = res.user || res;
      login(userData, userData.token || res.token);
      navigate('/');
    } catch (err) {
      console.error('Google registration error:', err);
      setError(err.response?.data?.message || err.message || 'Google Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-page">
      <div className="card">
        <h1>Create your account</h1>
        <p>Join EveryThingRental and start earning by renting out your items</p>

        {!otpStep ? (
          <>
            <form onSubmit={handleSubmit}>
              <div className="grid md:grid-cols-2 gap-4">
                <input name="firstName" placeholder="First name" value={form.firstName} onChange={handleChange} required />
                <input name="lastName"  placeholder="Last name"  value={form.lastName}  onChange={handleChange} required />
              </div>
              <input name="email" type="email" placeholder="Email address" value={form.email} onChange={handleChange} required />
              <input name="phone" type="tel"  placeholder="Phone number"  value={form.phone} onChange={handleChange} required />
              <input name="password" type="password" placeholder="Password"      value={form.password} onChange={handleChange} required minLength={8} />
              <input name="confirm"  type="password" placeholder="Confirm password" value={form.confirm}  onChange={handleChange} required />

              <div style={{ margin: '1rem 0', display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                <input 
                  type="checkbox" 
                  id="terms" 
                  checked={termsAccepted} 
                  onChange={(e) => setTermsAccepted(e.target.checked)} 
                  style={{ marginTop: '0.25rem' }}
                />
                <label htmlFor="terms" style={{ fontSize: '0.9rem', color: '#475569' }}>
                  I agree to the <Link to="/terms">Terms and Conditions</Link> for using the EveryThingRental ecommerce platform.
                </label>
              </div>

              {error && <p className="error">{error}</p>}

              <button type="submit" disabled={loading}>
                {loading ? 'Creating account…' : 'Register'}
              </button>
            </form>

            <div className="divider" style={{ textAlign: 'center', margin: '1rem 0', color: '#888', textTransform: 'uppercase', fontSize: '0.8rem', fontWeight: 600 }}>Or</div>
            <div style={{ display: 'flex', justifyContent: 'center', margin: '1rem 0' }}>
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => setError('Google Registration Failed')}
                text="signup_with"
                useOneTap
              />
            </div>

            <p className="switch">
              Already have an account? <Link to="/login">Log in</Link>
            </p>
          </>
        ) : (
          <form onSubmit={handleOtpSubmit} style={{ textAlign: 'center' }}>
            <h2>Verify Your Email</h2>
            <p style={{ marginBottom: '1.5rem', color: '#666' }}>
              We sent a 6-digit OTP code to <strong>{form.email}</strong>.
            </p>
            
            <input 
              name="otp" 
              type="text" 
              placeholder="Enter 6-digit OTP" 
              value={otp} 
              onChange={(e) => setOtp(e.target.value)} 
              maxLength={6}
              style={{ textAlign: 'center', fontSize: '1.25rem', letterSpacing: '4px' }}
              required 
            />

            {error && <p className="error">{error}</p>}

            <button type="submit" disabled={loading} style={{ marginTop: '1rem' }}>
              {loading ? 'Verifying...' : 'Verify OTP'}
            </button>
            <button 
              type="button" 
              onClick={() => setOtpStep(false)} 
              style={{ background: 'transparent', color: '#2874f0', marginTop: '1rem' }}
              disabled={loading}
            >
              Back
            </button>
          </form>
        )}
      </div>
    </div>
  );
}