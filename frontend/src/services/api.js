import axios from 'axios';
import { authStorage } from './authStorage';

// API base URL:
//  - override with VITE_API_URL env if set
//  - otherwise use the SAME host as the page you're viewing (so scanning from
//    a phone on the LAN reaches the backend at e.g. http://192.168.1.5:5000/api
//    instead of pointing at the phone's own localhost).
const API_URL =
  import.meta.env.VITE_API_URL ||
  (() => {
    const host = window.location.hostname || 'localhost';
    if (host === 'localhost' || host === '127.0.0.1') {
      return 'http://localhost:5000/api';
    }
    return `http://${host}:5000/api`;
  })();

const api = axios.create({
  baseURL: API_URL,
  timeout: 60000,
});

// Add token to requests
api.interceptors.request.use(
  (config) => {
    const token = authStorage.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle 401 responses
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      authStorage.removeToken();
      authStorage.removeUser();
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;

// Build an absolute URL for files served by the backend (e.g. /uploads/profiles/...)
export const publicUrl = (pathLike) => {
  if (!pathLike) return null;
  if (/^https?:\/\//.test(pathLike)) return pathLike;
  const origin = new URL(API_URL).origin;
  return `${origin}${pathLike.startsWith('/') ? '' : '/'}${pathLike}`;
};
