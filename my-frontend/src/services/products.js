// src/services/products.js

import api from './api';

const buildQuery = (params) =>
  new URLSearchParams(Object.entries(params).filter(([, v]) => v != null)).toString();

// ✅ ADD /api prefix
export const fetchProducts = (params = {}) =>
  api.get(`/api/products?${buildQuery(params)}`).then(res => res.data);

// ✅ ADD /api prefix  
export const fetchProduct = (id) =>
  api.get(`/api/products/${id}`).then(res => res.data);