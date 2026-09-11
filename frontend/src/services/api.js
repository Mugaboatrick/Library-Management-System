import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
});

// Add token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
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
      localStorage.removeItem('token');
      localStorage.removeItem('user');
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
