/* src/components/ProductImage.jsx */

import React, { useState, useEffect } from 'react';

export default function ProductImage({ photo, alt = 'Product Image', className = '' }) {
  const [src, setSrc] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Priority: 1. Base64 preview (instant), 2. Full URL, 3. API endpoint
    if (photo?.base64Preview && photo.base64Preview.startsWith('data:image')) {
      setSrc(photo.base64Preview);
      setLoading(false);
    } else if (photo?.fullUrl) {
      // Check if it's local or S3
      if (photo.storageType === 's3') {
        setSrc(photo.fullUrl); // Direct S3 URL
        setLoading(false);
      } else {
        // For local files, still fetch via base64 endpoint first
        fetchBase64Preview();
      }
    } else if (photo?.id) {
      // Fetch base64 from API
      fetchBase64Preview();
    } else {
      setSrc('/placeholder-image.jpg');
      setLoading(false);
    }
  }, [photo]);

  const fetchBase64Preview = async () => {
    try {
      const res = await fetch(`/api/products/image/${photo.id}?format=base64`);
      const data = await res.json();
      if (data.base64) {
        setSrc(data.base64);
      } else {
        // Fallback to full image
        setSrc(photo.fullUrl || `/api/products/image/${photo.id}`);
      }
    } catch {
      setSrc(photo.fullUrl || '/placeholder-image.jpg');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={`image-loading ${className}`}>
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      onError={() => setSrc('/placeholder-image.jpg')}
    />
  );
}