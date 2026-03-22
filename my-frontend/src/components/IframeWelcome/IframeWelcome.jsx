import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import './iframe-welcome.css';

export default function IframeWelcome({ user, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 5000);
    return () => clearTimeout(t);
  }, [onClose]);

  const html = `
    <!doctype html>
    <html>
      <head><style>
        body{margin:0;font-family:system-ui;background:#f5f5f5;display:flex;align-items:center;justify-content:center;height:100vh}
        h2{color:#1976d2}
      </style></head>
      <body><h2>Welcome ${user.first_name}!</h2></body>
    </html>
  `;

  return createPortal(
    <div className="iframe-backdrop">
      <div className="iframe-box">
        <iframe title="welcome" srcDoc={html} width="400" height="200" frameBorder="0" />
        <button className="iframe-close" onClick={onClose}>×</button>
      </div>
    </div>,
    document.body
  );
}