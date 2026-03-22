import React, { useEffect } from 'react';
import { Briefcase, Send } from 'lucide-react';
import { APP_NAME } from '../../utils/constants';

import Footer from '../Home/Footer';

export default function Careers() {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  return (
    <div style={{ backgroundColor: '#fafafa', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      
      {/* Hero Section */}
      <div style={{ backgroundColor: '#0B1521', color: 'white', padding: '100px 20px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '-100px', left: '50%', transform: 'translateX(-50%)', width: '80%', height: '300px', background: 'radial-gradient(ellipse, rgba(56, 189, 248, 0.15), transparent 70%)', pointerEvents: 'none' }}></div>
        <h1 style={{ fontSize: '3rem', fontWeight: '800', marginBottom: '20px', color: '#ffffff', position: 'relative', zIndex: '10' }}>
          Careers at {APP_NAME}
        </h1>
        <p style={{ maxWidth: '600px', margin: '0 auto', fontSize: '1.2rem', color: '#c9d1d9', lineHeight: '1.6', position: 'relative', zIndex: '10' }}>
          Join the fastest growing peer-to-peer rental marketplace in India. We're always looking for brilliant minds to help fundamentally shift global commerce.
        </p>
      </div>

      {/* Main Content */}
      <div style={{ maxWidth: '800px', margin: '80px auto', padding: '0 20px', flex: 1, width: '100%' }}>
        <div style={{ backgroundColor: 'white', padding: '60px 40px', borderRadius: '24px', boxShadow: '0 20px 40px rgba(0,0,0,0.06)', textAlign: 'center' }}>
          
          <div style={{ width: '80px', height: '80px', backgroundColor: '#eff6ff', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 32px', transform: 'rotate(-5deg)' }}>
            <Briefcase color="#3b82f6" size={40} />
          </div>
          
          <h2 style={{ fontSize: '2rem', fontWeight: '700', color: '#1a1a1a', marginBottom: '16px' }}>
            We're Hiring Passionate Builders
          </h2>
          
          <p style={{ fontSize: '1.1rem', color: '#666', lineHeight: '1.7', marginBottom: '40px', maxWidth: '600px', margin: '0 auto 40px' }}>
            We are actively scouting for engineers, designers, and growth marketers who want to make a tangible difference. If you are deeply obsessed with user experience and complex problem solving, we want to hear from you.
          </p>

          <div style={{ padding: '30px', backgroundColor: '#f8fafc', borderRadius: '16px', border: '1px dashed #cbd5e1' }}>
            <p style={{ fontSize: '1rem', color: '#475569', marginBottom: '16px', fontWeight: '500' }}>
              Drop us your resume and portfolio directly at:
            </p>
            <a 
              href="mailto:shivam@everythingrental.in"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '12px',
                padding: '16px 32px',
                backgroundColor: '#2563eb',
                color: 'white',
                textDecoration: 'none',
                borderRadius: '12px',
                fontWeight: '600',
                fontSize: '1.1rem',
                transition: 'all 0.2s',
                boxShadow: '0 8px 20px rgba(37, 99, 235, 0.25)'
              }}
              onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
            >
              <Send size={20} />
              shivam@everythingrental.in
            </a>
          </div>

        </div>
      </div>

      <Footer />
    </div>
  );
}
