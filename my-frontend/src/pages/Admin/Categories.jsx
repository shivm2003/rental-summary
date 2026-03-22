import axios from 'axios';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

// Auth header helper
const authHeader = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// ── Public ──────────────────────────────────────────────

/** All active categories (public, includes subcategories) */
export const fetchCategories = async () => {
  const res = await axios.get(`${API}/categories`);
  return res.data; // { categories: [...] }
};

/** Homepage top-level categories */
export const fetchHomepageCategories = async () => {
  const res = await axios.get(`${API}/categories/homepage`);
  return res.data; // { success, categories: [...] }
};

/** Category tree */
export const fetchCategoryTree = async () => {
  const res = await axios.get(`${API}/categories/tree`);
  return res.data;
};

/** Single category by ID */
export const fetchCategory = async (id) => {
  const res = await axios.get(`${API}/categories/${id}`);
  return res.data;
};

// ── Admin ────────────────────────────────────────────────

/**
 * Admin: top-level active categories with listing counts
 * GET /api/categories/admin
 */
export const fetchAdminCategories = async () => {
  const res = await axios.get(`${API}/categories/admin`, {
    headers: authHeader()
  });
  return res.data; // { success, count, categories: [...] }
};

/**
 * Upload image for a category using pre-signed S3 URL
 * @param {number} categoryId
 * @param {File} file
 */
export const uploadCategoryImage = async (categoryId, file) => {
  // Step 1: Get pre-signed upload URL from backend
  const { data } = await axios.post(
    `${API}/categories/${categoryId}/upload-url`,
    { filename: file.name, contentType: file.type },
    { headers: authHeader() }
  );

  // Step 2: Upload directly to S3
  await axios.put(data.uploadUrl, file, {
    headers: { 'Content-Type': file.type }
  });

  return data.publicUrl;
};

/**
 * Update a category (name, description, display_order, is_active)
 * @param {number} id
 * @param {object} updates
 */
export const updateCategory = async (id, updates) => {
  const res = await axios.patch(`${API}/categories/${id}`, updates, {
    headers: authHeader()
  });
  return res.data;
};

/**
 * Create a new category
 */
export const createCategory = async (data) => {
  const res = await axios.post(`${API}/categories`, data, {
    headers: authHeader()
  });
  return res.data;
};

/**
 * Delete a category (and its children)
 */
export const deleteCategory = async (id) => {
  const res = await axios.delete(`${API}/categories/${id}`, {
    headers: authHeader()
  });
  return res.data;
};

/**
 * Bulk update display order
 * @param {Array<{id, display_order}>} orders
 */
export const bulkUpdateCategoryOrder = async (orders) => {
  const res = await axios.post(`${API}/categories/bulk-order`, { orders }, {
    headers: authHeader()
  });
  return res.data;
};