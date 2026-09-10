import axios from 'axios';
import { API_BASE_URL } from './config';

export const api = axios.create({ baseURL: `${API_BASE_URL}/api` });

const TOKEN_KEY = 'ampere_admin_token';

export function getStoredToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setAuthToken(token: string | null) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

api.interceptors.request.use((config) => {
  const token = getStoredToken();
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export function resolveMediaUrl(path?: string) {
  if (!path) return undefined;
  if (path.startsWith('http')) return path;
  return `${API_BASE_URL}${path}`;
}
