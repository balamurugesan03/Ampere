import axios from 'axios';
import { API_BASE_URL } from './config';

export const api = axios.create({ baseURL: `${API_BASE_URL}/api` });

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
