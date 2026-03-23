import React from 'react';
import { Link } from 'react-router-dom';
import { APP_NAME } from '../../utils/constants';
import {
  Phone,
  Mail,
  MapPin,
  Facebook,
  Twitter,
  Instagram,
  Youtube,
  Send
} from 'lucide-react';

import './Footer.css';

export default function Footer() {
  return (
    <footer className="premium-footer">
      <div className="footer-container">

        {/* Column 1: Brand Info */}
        <div className="footer-column">
          <h3 className="footer-brand">{APP_NAME}</h3>
          <p className="footer-desc">
            Your premium destination for renting everything you need. Experience quality, affordability, and seamless rentals globally.
          </p>
          <div className="contact-list" style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', marginTop: '0.5rem' }}>
            <div className="contact-item">
              <div className="contact-icon"><Phone size={14} /></div>
              <span>+91 9198496753</span>
            </div>
            <div className="contact-item">
              <div className="contact-icon"><Mail size={14} /></div>
              <a href="mailto:shivam@everythingrental.in" className="email-link">shivam@everythingrental.in</a>
            </div>
            <div className="contact-item">
              <div className="contact-icon"><MapPin size={14} /></div>
              <span>Gurgaon, India</span>
            </div>
          </div>
        </div>

        {/* Column 2: Quick Links */}
        <div className="footer-column">
          <h3 className="footer-heading">Quick Links</h3>
          <ul className="footer-links">
            <li><Link to="/">Home</Link></li>
            <li><Link to="/about">About Us</Link></li>
            <li><Link to="/products">All Products</Link></li>
            <li><Link to="/list-item">Become a Lender</Link></li>
            <li><Link to="/login">Login / Register</Link></li>
          </ul>
        </div>

        {/* Column 3: Help & Support */}
        <div className="footer-column">
          <h3 className="footer-heading">Help & Support</h3>
          <ul className="footer-links">
            <li><Link to="/cart">Shopping Cart</Link></li>
            <li><Link to="/faq">FAQ</Link></li>
            <li><Link to="/terms">Terms & Conditions</Link></li>
            <li><Link to="/contact">Contact Us</Link></li>
          </ul>
        </div>

        {/* Column 4: Newsletter */}
        <div className="footer-column">
          <h3 className="footer-heading">Newsletter</h3>
          <p className="footer-desc newsletter-text" style={{ color: 'black', fontWeight: '500' }}>
            1.Subscribe for new listings and special offers<br />
            2.Fill in either your Email OR Mobile Number to subscribe.
          </p>
          <div className="newsletter-form">
            <input type="email" placeholder="Enter your email" className="newsletter-input" />
            <button className="newsletter-btn"><Send size={16} /></button>
          </div>
          <div className="social-icons">
            {[Facebook, Twitter, Instagram, Youtube].map((Icon, i) => (
              <a key={i} href="#" className="social-icon"><Icon size={18} /></a>
            ))}
          </div>
        </div>

      </div>

    </footer>
  );
}