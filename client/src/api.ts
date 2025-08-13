import axios from 'axios';
import { API_BASE } from './config';

export const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' }
});

export async function generateOtp(payload: any) {
  const { data } = await api.post('/api/otp/generate', payload);
  return data;
}

export async function verifyOtp(payload: any) {
  const { data } = await api.post('/api/otp/verify', payload);
  return data;
}

export async function validatePan(payload: any) {
  const { data } = await api.post('/api/validate/pan', payload);
  return data;
}

export async function submitAll(payload: any) {
  const { data } = await api.post('/api/submit', payload);
  return data;
}

export async function fetchSchema() {
  try {
    const { data } = await api.get('/api/schema');
    return data;
  } catch {
    const local = await import('./schema.json');
    return local.default;
  }
}
