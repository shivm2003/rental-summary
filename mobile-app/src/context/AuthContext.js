import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../api/api';

import * as Google from "expo-auth-session/providers/google";
import * as WebBrowser from "expo-web-browser";
import { GOOGLE_CONFIG } from '../config/googleConfig';

WebBrowser.maybeCompleteAuthSession();

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(null);

  const [request, response, promptAsync] = Google.useAuthRequest({
    webClientId: GOOGLE_CONFIG.webClientId,
    iosClientId: GOOGLE_CONFIG.iosClientId,
    androidClientId: GOOGLE_CONFIG.androidClientId,
  });

  useEffect(() => {
    if (request) {
      console.log('Google Auth Request URL:', request.url);
    }
  }, [request]);

  useEffect(() => {
    if (response) {
      console.log('Google Auth Response:', response);
    }
    if (response?.type === "success") {
      const token = response.params?.id_token || response.authentication?.idToken;
      if (token) {
        handleGoogleBackendAuth(token);
      } else {
        console.error('Google Auth Success but no ID Token found in response', response);
      }
    }
  }, [response]);

  const handleGoogleBackendAuth = async (googleToken) => {
    try {
      const resp = await api.post('/auth/google', { token: googleToken });
      const resData = resp.data;
      
      // Backend returns { user: { token, id, ... } }
      const authData = resData.user || resData;
      const authToken = authData.token || resData.token;

      if (authToken) {
        await AsyncStorage.setItem('token', authToken);
        setToken(authToken);
        
        const normalized = {
          id: authData.id || authData.user_id,
          email: authData.email,
          first_name: authData.first_name || authData.firstName,
          role: authData.role || 'user',
          lender: authData.lender || false
        };
        setUser(normalized);
        await AsyncStorage.setItem('user', JSON.stringify(normalized));
      }
    } catch (e) {
      console.error('Backend Google Auth Error:', e.message);
    }
  };

  useEffect(() => {
    checkToken();
  }, []);

  const checkToken = async () => {
    try {
      const storedToken = await AsyncStorage.getItem('token');
      const storedUser = await AsyncStorage.getItem('user');
      
      if (storedToken) {
        setToken(storedToken);
        if (storedUser) {
          setUser(JSON.parse(storedUser));
        }
        
        try {
          const response = await api.get('/auth/me'); 
          if (response.data && response.data.success) {
             const freshUser = response.data.user;
             const normalizedUser = {
               id: freshUser.id || freshUser.user_id,
               email: freshUser.email,
               first_name: freshUser.first_name || freshUser.firstName,
               role: freshUser.role || 'user',
               lender: freshUser.lender || false
             };
             setUser(normalizedUser);
             await AsyncStorage.setItem('user', JSON.stringify(normalizedUser));
          }
        } catch (apiErr) {
          // If it's a 401/403, we must logout. Otherwise, keep current session (network error)
          if (apiErr.response && (apiErr.response.status === 401 || apiErr.response.status === 403)) {
            await logout();
          }
        }
      }
    } catch (e) {
      console.error('Error during checkToken:', e.message);
    } finally {
      setLoading(false);
    }
  };

  const registerUser = async (formData) => {
    try {
      const response = await api.post('/auth/register', formData);
      const resData = response.data;
      
      if (resData && resData.token) {
        await AsyncStorage.setItem('token', resData.token);
        setToken(resData.token);
        
        const userData = resData.user || {};
        const normalizedUser = {
          id: userData.id || userData.user_id,
          email: userData.email,
          first_name: userData.first_name || userData.firstName,
          role: userData.role || 'user',
          lender: userData.lender || false
        };
        setUser(normalizedUser);
        await AsyncStorage.setItem('user', JSON.stringify(normalizedUser));
        
        return { success: true };
      }
      return { success: false, message: resData.message || 'Registration failed' };
    } catch (e) {
      console.error('Registration error:', e.message);
      return { success: false, message: e.response?.data?.message || 'Network error' };
    }
  };

  const googleLogin = async () => {
    try {
      const result = await promptAsync();
      if (result.type === 'success') {
         return { success: true };
      }
      return { success: false, message: 'Google Auth flow interrupted' };
    } catch (error) {
      console.error('Google Auth error:', error);
      return { success: false, message: error.message || 'Google Auth Error' };
    }
  };

  const login = async (email, password) => {
    try {

      const response = await api.post('/auth/login', { identifier: email, password });
      
      const resData = response.data;
      if (resData && resData.token) {
        await AsyncStorage.setItem('token', resData.token);
        setToken(resData.token);
        
        // Normalize user object like the website does
        const userData = resData.user || {};
        const normalizedUser = {
          id: userData.id || userData.user_id,
          email: userData.email,
          first_name: userData.first_name || userData.firstName,
          role: userData.role || 'user',
          lender: userData.lender || false
        };
        setUser(normalizedUser);
        await AsyncStorage.setItem('user', JSON.stringify(normalizedUser));
        
        return { success: true };
      }
      return { success: false, message: resData.message || 'Login failed' };
    } catch (e) {
      console.error('Login error:', e.message);
      const errMsg = e.response?.data?.message || 'Network error or backend unreachable. Ensure your IP matches mobile-app/.env!';
      return { success: false, message: errMsg };
    }
  };

  const logout = async () => {
    await AsyncStorage.removeItem('token');
    await AsyncStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, token, login, logout, register: registerUser, googleLogin }}>
      {children}
    </AuthContext.Provider>
  );
};
