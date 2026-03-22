import React, { useEffect } from 'react';
import { Target, Users, Shield, Globe } from 'lucide-react';
import { APP_NAME } from '../../utils/constants';

import Footer from '../Home/Footer';

export default function About() {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  return (
    <div style={{ backgroundColor: '#fafafa', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      
      {/* Hero Section */}
      <div style={{ backgroundColor: '#0B1521', color: 'white', padding: '100px 20px', textAlign: 'center' }}>
        <h1 style={{ fontSize: '3rem', fontWeight: '800', marginBottom: '20px', background: 'linear-gradient(90deg, #38bdf8, #818cf8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          About {APP_NAME}
        </h1>
        <p style={{ maxWidth: '700px', margin: '0 auto', fontSize: '1.2rem', color: '#c9d1d9', lineHeight: '1.6' }}>
          We are revolutionizing the way the world accesses everyday items. Renting isn't just a cost-effective alternative—it's the sustainable future of commerce.
        </p>
      </div>

      {/* Core Values Section */}
      <div style={{ maxWidth: '1200px', margin: '80px auto', padding: '0 20px', flex: 1 }}>
        <h2 style={{ fontSize: '2rem', fontWeight: '700', color: '#1a1a1a', textAlign: 'center', marginBottom: '60px' }}>Our Core Pillars</h2>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '40px' }}>
          
          <div style={{ padding: '40px', backgroundColor: 'white', borderRadius: '16px', boxShadow: '0 10px 30px rgba(0,0,0,0.05)', textAlign: 'center', transition: 'transform 0.3s' }} onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-5px)'} onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
            <div style={{ width: '64px', height: '64px', backgroundColor: '#eff6ff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
              <Globe color="#3b82f6" size={32} />
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '16px', color: '#212121' }}>Universal Access</h3>
            <p style={{ color: '#666', lineHeight: '1.6' }}>We believe everyone should have access to premium equipment, tools, and experiences without the burden of permanent ownership.</p>
          </div>

          <div style={{ padding: '40px', backgroundColor: 'white', borderRadius: '16px', boxShadow: '0 10px 30px rgba(0,0,0,0.05)', textAlign: 'center', transition: 'transform 0.3s' }} onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-5px)'} onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
            <div style={{ width: '64px', height: '64px', backgroundColor: '#ecfdf5', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
              <Shield color="#10b981" size={32} />
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '16px', color: '#212121' }}>Absolute Trust</h3>
            <p style={{ color: '#666', lineHeight: '1.6' }}>Every user, lender, and transaction is protected by our industry-leading verification and security matrices.</p>
          </div>

          <div style={{ padding: '40px', backgroundColor: 'white', borderRadius: '16px', boxShadow: '0 10px 30px rgba(0,0,0,0.05)', textAlign: 'center', transition: 'transform 0.3s' }} onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-5px)'} onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
            <div style={{ width: '64px', height: '64px', backgroundColor: '#fef3c7', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
              <Target color="#f59e0b" size={32} />
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '16px', color: '#212121' }}>Sustainability</h3>
            <p style={{ color: '#666', lineHeight: '1.6' }}>By sharing resources, we significantly reduce manufacturing waste, shipping emissions, and global environmental impact.</p>
          </div>

        </div>
      </div>

      <Footer />
    </div>
  );
}
