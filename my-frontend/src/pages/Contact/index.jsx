import React, { useState } from 'react';
export default function Contact() {
  const [msg, setMsg] = useState('');
  return (
    <div className="container" style={{ padding: '60px 20px', minHeight: '60vh', maxWidth: '600px', margin: '0 auto' }}>
      <h1>Contact Us</h1>
      <p>Have any questions? Send us a message.</p>
      <form onSubmit={(e) => { e.preventDefault(); setMsg('Message sent successfully!'); }} style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '20px' }}>
        <input type="text" placeholder="Your Name" required style={{ padding: '10px', border: '1px solid #ccc', borderRadius: '5px' }} />
        <input type="email" placeholder="Your Email" required style={{ padding: '10px', border: '1px solid #ccc', borderRadius: '5px' }} />
        <textarea rows="5" placeholder="Your Message" required style={{ padding: '10px', border: '1px solid #ccc', borderRadius: '5px' }}></textarea>
        <button type="submit" style={{ padding: '10px', background: '#1193d4', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>Send Message</button>
      </form>
      {msg && <p style={{ color: 'green', marginTop: '15px' }}>{msg}</p>}
    </div>
  );
}
