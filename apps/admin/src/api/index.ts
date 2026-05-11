import axios from 'axios';

const api = axios.create({ baseURL: '/api' });

// Attach JWT token from localStorage on every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('od_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle global API errors (401 Unauthorized, etc.)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle 401 - redirect to login
    if (error.response?.status === 401) {
      localStorage.removeItem('od_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
