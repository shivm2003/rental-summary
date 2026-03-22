import api from './api';

export const fetchDashboardStats = () => api.get('/admin/dashboard-stats');
export const fetchAllUsers = (params) => api.get('/admin/users', { params });