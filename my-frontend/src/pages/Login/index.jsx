import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { login as loginService, googleLogin, verifyOtp } from '../../services/auth';
import { GoogleLogin } from '@react-oauth/google';
import './index.css';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  
  const [id, setId] = useState('');
  const [pw, setPw] = useState('');
  const [otpStep, setOtpStep] = useState(false);
  const [otp, setOtp] = useState('');
  const [verifiedEmail, setVerifiedEmail] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      // Call API
      const res = await loginService({ identifier: id, password: pw });
      
      console.log('🔍 Raw API Response:', res);
      
      if (res.requireOtp) {
        setVerifiedEmail(res.email || id);
        setOtpStep(true);
        return;
      }
      
      // Fallback for immediate token returns
      const userData = res.user || res; 
      const token = userData.token || res.token;
      login(userData, token);
      
    } catch (err) {
      console.error('❌ Login error:', err);
      setError(err.response?.data?.message || err.message || 'Login failed');
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
      const res = await verifyOtp({ email: verifiedEmail, otp });
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
      console.error('Google login error:', err);
      setError(err.response?.data?.message || err.message || 'Google Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="card">
        <h1>EveryThingRental</h1>
        <h2>Welcome back</h2>

        {!otpStep ? (
          <>
            <form onSubmit={handleSubmit}>
              <input
                placeholder="Email or phone number"
                value={id}
                onChange={(e) => setId(e.target.value)}
                required
                disabled={loading}
              />
              <input
                type="password"
                placeholder="Password"
                value={pw}
                onChange={(e) => setPw(e.target.value)}
                required
                disabled={loading}
              />
              {error && <p className="error">{error}</p>}
              <Link to="/forgot-password" className="link">Forgot password?</Link>
              <button type="submit" disabled={loading}>
                {loading ? 'Verifying credentials…' : 'Login'}
              </button>
            </form>

            <div className="divider">Or</div>
            <div style={{ display: 'flex', justifyContent: 'center', margin: '1rem 0' }}>
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => setError('Google Login Failed')}
                useOneTap
              />
            </div>
            <button className="social" disabled={loading}>Continue with Apple</button>

            <p className="signup">
              New to EveryThingRental? <Link to="/register">Sign Up</Link>
            </p>
          </>
        ) : (
          <form onSubmit={handleOtpSubmit} style={{ textAlign: 'center' }}>
            <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>Verify Your Login</h2>
            <p style={{ marginBottom: '1.5rem', color: '#666' }}>
              We sent a 6-digit verification code to <strong>{verifiedEmail}</strong>.
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
              {loading ? 'Verifying...' : 'Verify & Login'}
            </button>
            <button 
              type="button" 
              onClick={() => setOtpStep(false)} 
              style={{ background: 'transparent', color: '#2874f0', marginTop: '1rem' }}
              disabled={loading}
            >
              Cancel Login
            </button>
          </form>
        )}
      </div>
    </div>
  );
}