/* my-frontend/src/services/admin.js */
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

export const sendGlobalPush = async (payload) => {
  const token = localStorage.getItem('token');
  const response = await axios.post(`${API_URL}/api/admin/push-notification`, payload, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};