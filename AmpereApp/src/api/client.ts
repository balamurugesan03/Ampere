import axios from 'axios';
import { API_BASE_URL } from './config';

export const api = axios.create({ baseURL: `${API_BASE_URL}/api`, timeout: 20000 });

let authToken: string | null = null;

export function setAuthToken(token: string | null) {
  authToken = token;
}

api.interceptors.request.use((config) => {
  if (authToken) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${authToken}`;
  }
  return config;
});

export function resolveMediaUrl(path?: string) {
  if (!path) return undefined;
  if (path.startsWith('http')) return path;
  return `${API_BASE_URL}${path}`;
}

export function getErrorMessage(err: unknown, fallback = 'Something went wrong. Please try again.') {
  const e = err as { response?: { data?: { message?: string } }; message?: string };
  if (e?.response?.data?.message) return e.response.data.message;
  if (e?.message === 'Network Error' || (e?.message ?? '').includes('timeout')) {
    return 'Cannot reach the server. Check your internet connection.';
  }
  return fallback;
}
