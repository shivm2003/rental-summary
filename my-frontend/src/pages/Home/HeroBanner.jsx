import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5001';

export default function HeroBanner() {
  const [banners, setBanners] = useState([]);
  const [idx, setIdx] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(`${API}/api/hero/active`)
      .then(res => setBanners(res.data?.banners ?? []))
      .catch(err => console.error('Failed to load banners:', err))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (banners.length <= 1) return;
    const t = setInterval(() => setIdx(i => (i + 1) % banners.length), 5000);
    return () => clearInterval(t);
  }, [banners]);

  if (loading) return (
    <div style={{
      width: '100%', height: '320px', borderRadius: '12px',
      background: 'linear-gradient(90deg,#f0f0f0 25%,#e0e0e0 50%,#f0f0f0 75%)',
      backgroundSize: '200% 100%',
      animation: 'shimmer 1.5s infinite',
      marginBottom: '16px'
    }}>
      <style>{`@keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}`}</style>
    </div>
  );

  if (banners.length === 0) return null;

  const current = banners[idx];

  return (
    <div style={{ position: 'relative', width: '100%', marginBottom: '16px' }}>
      <style>{`
        .hero-wrap {
          width: 100%;
          height: 320px;
          border-radius: 12px;
          overflow: hidden;
          position: relative;
          background: #1e293b;
        }
        @media (min-width: 640px)  { .hero-wrap { height: 360px; } }
        @media (min-width: 1024px) { .hero-wrap { height: 420px; } }

        .hero-img {
          width: 100%;
          height: 100%;
          object-fit: cover;         /* ← always fills, never distorts */
          object-position: center;
          display: block;
        }
        .hero-overlay {
          position: absolute; inset: 0;
          background: linear-gradient(to top, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.1) 60%, transparent 100%);
        }
        .hero-text {
          position: absolute;
          bottom: 20px; left: 20px; right: 20px;
        }
        @media (min-width: 640px) { .hero-text { bottom: 32px; left: 40px; } }
        .hero-title {
          color: #fff;
          font-size: clamp(1.1rem, 3vw, 1.8rem);
          font-weight: 800;
          margin: 0 0 4px;
          text-shadow: 0 1px 4px rgba(0,0,0,0.4);
          line-height: 1.3;
        }
        .hero-sub {
          color: rgba(255,255,255,0.85);
          font-size: clamp(0.8rem, 1.8vw, 1rem);
          margin: 0 0 12px;
        }
        .hero-btn {
          display: inline-block;
          background: #1193d4;
          color: #fff;
          padding: 7px 18px;
          border-radius: 6px;
          font-weight: 600;
          font-size: 0.875rem;
          text-decoration: none;
          transition: background 0.2s;
        }
        .hero-btn:hover { background: #0d6fa8; }
        .hero-dots {
          position: absolute;
          bottom: 12px; right: 16px;
          display: flex; gap: 6px; align-items: center;
        }
        .hero-dot {
          height: 6px; border-radius: 99px;
          border: none; cursor: pointer; padding: 0;
          transition: all 0.3s;
        }
      `}</style>

      <div className="hero-wrap">
        <img
          key={current.id}
          src={current.image_url}
          alt={current.title}
          className="hero-img"
        />
        <div className="hero-overlay" />
        <div className="hero-text">
          <h2 className="hero-title">{current.title}</h2>
          {current.subtitle && <p className="hero-sub">{current.subtitle}</p>}
          {current.button_text && current.button_link && (
            <a href={current.button_link} className="hero-btn">{current.button_text}</a>
          )}
        </div>

        {banners.length > 1 && (
          <div className="hero-dots">
            {banners.map((_, i) => (
              <button
                key={i}
                className="hero-dot"
                onClick={() => setIdx(i)}
                style={{
                  width: i === idx ? '20px' : '6px',
                  background: i === idx ? '#fff' : 'rgba(255,255,255,0.5)'
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}