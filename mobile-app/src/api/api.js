import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://rental-summary.onrender.com/api';


const api = axios.create({
  baseURL: API_URL,
  timeout: 60000, // 60 seconds timeout
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercept requests to inject the JWT token
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (e) {
      console.error('Error getting token from AsyncStorage', e);
    }
    return config;
  },
  (error) => Promise.reject(error)
);
// Handle 401 Unauthorized responses globally
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response && error.response.status === 401) {
      try {
        await AsyncStorage.removeItem('token');
        await AsyncStorage.removeItem('user');
        // A full state reset is handled by AuthContext if we could inject it, 
        // but clearing AsyncStorage guarantees the next app load is unauthenticated.
      } catch (e) {
        console.error('Failed to clear storage on 401', e);
      }
    }
    return Promise.reject(error);
  }
);

export default api;
