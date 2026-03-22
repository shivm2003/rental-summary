import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './index.css';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);
    
    try {
      // NOTE: Placeholder for future backend API integration.
      // E.g., await axios.post('/api/auth/forgot-password', { email });
      
      // Simulating API delay
      await new Promise(resolve => setTimeout(resolve, 800));
      
      setMessage('If an account exists for that email, we have sent password reset instructions.');
    } catch (err) {
      console.error('❌ Forgot password error:', err);
      setError(err.response?.data?.message || err.message || 'Failed to send reset email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="card">
        <h1>EveryThingRental</h1>
        <h2>Forgot Password</h2>

        <form onSubmit={handleSubmit}>
          <p style={{ marginBottom: '1rem', fontSize: '0.9rem', color: '#666', lineHeight: '1.4' }}>
            Enter your email address and we'll send you a link to reset your password.
          </p>
          
          <input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={loading}
          />
          
          {error && <p className="error" style={{ color: 'red', fontSize: '0.85rem', margin: 0 }}>{error}</p>}
          {message && <p className="success" style={{ color: 'green', fontSize: '0.85rem', margin: 0 }}>{message}</p>}
          
          <button type="submit" disabled={loading}>
            {loading ? 'Sending...' : 'Send Reset Link'}
          </button>
        </form>

        <Link to="/login" className="back-link">Return to Login</Link>
      </div>
    </div>
  );
}
