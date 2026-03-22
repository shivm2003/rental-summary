// src/services/categories.js
import api from './api';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

// ============================================
// PUBLIC API CALLS
// ============================================

export const fetchHomepageCategories = () => 
  api.get(`${API_URL}/api/categories/homepage`).then(res => res.data);

export const fetchCategories = () => 
  api.get(`${API_URL}/api/categories`).then(res => res.data);

export const fetchCategoryTree = () => 
  api.get(`${API_URL}/api/categories/tree`).then(res => res.data);

// ============================================
// ADMIN API CALLS
// ============================================

export const fetchAdminCategories = () => 
  api.get(`${API_URL}/api/categories/admin/all`).then(res => res.data);

export const updateCategoryHomepage = (id, data) => 
  api.patch(`${API_URL}/api/categories/${id}/homepage`, data).then(res => res.data);

export const getIconUploadUrl = (id, filename, contentType) => 
  api.post(`${API_URL}/api/categories/${id}/icon-upload-url`, { filename, contentType })
    .then(res => res.data);

export const bulkUpdateCategoryOrder = (orders) => 
  api.put(`${API_URL}/api/categories/bulk-order`, { orders }).then(res => res.data);

// ============================================
// CRUD OPERATIONS
// ============================================

export const createCategory = (formData) => 
  api.post(`${API_URL}/api/categories`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }).then(res => res.data);

export const updateCategory = (id, formData) => 
  api.put(`${API_URL}/api/categories/${id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }).then(res => res.data);

export const deleteCategory = (id) => 
  api.delete(`${API_URL}/api/categories/${id}`).then(res => res.data);