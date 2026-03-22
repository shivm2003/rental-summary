import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import './iframe-success.css';

export default function IframeSuccess({ message, subMessage, onClose, duration = 5000 }) {
  useEffect(() => {
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [onClose, duration]);

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: 'Segoe UI', system-ui, sans-serif;
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
            display: flex;
            align-items: center;
            justify-content: center;
            height: 100vh;
            overflow: hidden;
          }
          .success-container {
            text-align: center;
            padding: 40px;
            color: white;
            animation: slideUp 0.5s ease;
          }
          .checkmark {
            width: 80px;
            height: 80px;
            border-radius: 50%;
            background: white;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 24px;
            animation: scaleIn 0.5s ease 0.2s both;
            box-shadow: 0 10px 40px rgba(0,0,0,0.2);
          }
          .checkmark::after {
            content: '✓';
            color: #10b981;
            font-size: 40px;
            font-weight: bold;
          }
          h2 {
            font-size: 28px;
            font-weight: 700;
            margin-bottom: 12px;
            text-shadow: 0 2px 4px rgba(0,0,0,0.1);
          }
          p {
            font-size: 16px;
            opacity: 0.95;
            line-height: 1.5;
          }
          .timer-bar {
            position: absolute;
            bottom: 0;
            left: 0;
            height: 4px;
            background: rgba(255,255,255,0.5);
            animation: countdown 5s linear forwards;
          }
          @keyframes slideUp {
            from { opacity: 0; transform: translateY(30px); }
            to { opacity: 1; transform: translateY(0); }
          }
          @keyframes scaleIn {
            from { transform: scale(0); }
            to { transform: scale(1); }
          }
          @keyframes countdown {
            from { width: 100%; }
            to { width: 0%; }
          }
        </style>
      </head>
      <body>
        <div class="success-container">
          <div class="checkmark"></div>
          <h2>${message}</h2>
          <p>${subMessage}</p>
        </div>
        <div class="timer-bar"></div>
      </body>
    </html>
  `;

  return createPortal(
    <div className="iframe-success-backdrop">
      <div className="iframe-success-box">
        <iframe 
          title="success" 
          srcDoc={html} 
          width="500" 
          height="300" 
          frameBorder="0"
          scrolling="no"
        />
        <button className="iframe-success-close" onClick={onClose}>×</button>
      </div>
    </div>,
    document.body
  );
}