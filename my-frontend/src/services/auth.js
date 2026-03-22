import api from './api';

export const login = payload =>
  api.post('/api/auth/login', payload).then(res => res.data);

export const loginWithSocial = provider =>
  api.get(`/api/auth/${provider}`).then(res => res.data);

export const register = payload =>
  api.post('/api/auth/register', payload).then(res => res.data);

export const googleLogin = payload =>
  api.post('/api/auth/google', payload).then(res => res.data);

export const verifyOtp = payload =>
  api.post('/api/auth/verify-otp', payload).then(res => res.data);