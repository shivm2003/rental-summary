/* src/services/listings.js */

import api from './api';

export const createListing = (formData) =>
  api.post('/api/listings/list', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }).then(res => res.data);

export const getMyListings = () =>
  api.get('/api/listings/my/listings').then(res => res.data);

export const fetchListings = (params = {}) => {
  const query = new URLSearchParams(params).toString();
  return api.get(`/api/listings?${query}`).then(res => res.data);
};

export const fetchListing = (id) =>
  api.get(`/api/listings/${id}`).then(res => res.data);

// Get base64 preview of an image
export const fetchImageBase64 = (imageId) =>
  api.get(`/api/products/image/${imageId}?format=base64`).then(res => res.data);

// Get image by ID (handles local/S3 automatically)
export const getImageUrl = (photo) => {
  if (photo.base64Preview) return photo.base64Preview;
  if (photo.storageType === 's3') return photo.fullUrl;
  return `/api/products/image/${photo.id}`;
};