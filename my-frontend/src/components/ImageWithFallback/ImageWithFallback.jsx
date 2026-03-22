// components/common/ImageWithFallback/ImageWithFallback.jsx
import React, { useState } from 'react';

const ImageWithFallback = ({ 
  src, 
  fallback = '/assets/images/placeholder.jpg', 
  alt, 
  className 
}) => {
  const [error, setError] = useState(false);
  
  // Handle both string URLs and photo objects
  const imageSrc = typeof src === 'string' ? src : fallback;

  return (
    <img
      src={error ? fallback : imageSrc}
      alt={alt}
      className={className}
      loading="lazy"
      onError={() => setError(true)}
    />
  );
};

export default ImageWithFallback;