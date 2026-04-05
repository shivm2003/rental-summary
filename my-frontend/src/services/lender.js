import api from './api';

export const getPincode = (pincode) =>
  api.get(`/api/pincode/${pincode}`).then((r) => r.data);

export const submitLender = (formData) =>
  api.post('/api/lender/register', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });

export const getLenderStatus = () =>
  api.get('/api/lender/status').then((r) => r.data);