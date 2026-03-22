import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

const api = axios.create({
  baseURL: API_URL
});

// Add auth interceptor
api.interceptors.request.use(cfg => {
  const t = localStorage.getItem('token');
  if (t) cfg.headers.Authorization = `Bearer ${t}`;
  return cfg;
});

export const fetchActiveBanners = () => api.get('/api/hero/active');
export const fetchAllBanners = () => api.get('/api/hero');
export const createBanner = (data) => api.post('/api/hero', data);
export const updateBanner = (id, data) => api.put(`/api/hero/${id}`, data);
export const deleteBanner = (id) => api.delete(`/api/hero/${id}`);