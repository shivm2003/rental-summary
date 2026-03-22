import React, { useState } from 'react';
import PropTypes from 'prop-types';

/**
 * ImageWithFallback Component
 * 
 * Handles image loading failures with automatic retry and fallback:
 * 1. Attempts to load primary image src
 * 2. On failure, retries once with cache-busting parameter
 * 3. Falls back to placeholder image if retry fails
 * 
 * Solves 503 errors from Unsplash's deprecated source API
 * 
 * @example
 * <ImageWithFallback
 *   src="https://source.unsplash.com/400x300/?product"
 *   fallback="https://via.placeholder.com/400x300?text=Product"
 *   alt="Product Name"
 *   className="w-full h-48 object-cover"
 * />
 */
const ImageWithFallback = ({ 
  src, 
  fallback = 'https://via.placeholder.com/400x300?text=No+Image',
  alt = '', 
  className = '',
  ...props 
}) => {
  const [imgSrc, setImgSrc] = useState(src);
  const [retryCount, setRetryCount] = useState(0);

  const handleError = () => {
    // Retry once with cache-buster if source exists
    if (retryCount === 0 && src) {
      setRetryCount(1);
      const separator = src.includes('?') ? '&' : '?';
      setImgSrc(`${src}${separator}t=${Date.now()}`);
    } else {
      // Use fallback image after retry fails
      setImgSrc(fallback);
    }
  };

  return (
    <img
      src={imgSrc || fallback}
      alt={alt}
      className={className}
      onError={handleError}
      loading="lazy"
      {...props}
    />
  );
};

ImageWithFallback.propTypes = {
  src: PropTypes.string,
  fallback: PropTypes.string,
  alt: PropTypes.string,
  className: PropTypes.string,
};

ImageWithFallback.defaultProps = {
  fallback: 'https://via.placeholder.com/400x300?text=No+Image',
  alt: '',
  className: '',
};

export default ImageWithFallback;