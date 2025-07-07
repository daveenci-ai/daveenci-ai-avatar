import axios from 'axios';

const BASE_URL = process.env.REACT_APP_API_URL || '/api';

// Create axios instance
export const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Set auth token
export const setAuthToken = (token) => {
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common['Authorization'];
  }
};

// Request interceptor to add token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token expiration
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      setAuthToken(null);
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Avatar API
export const avatarAPI = {
  getAll: () => api.get('/avatars'),
  getById: (id) => api.get(`/avatars/${id}`),
  create: (data) => api.post('/avatars', data),
  update: (id, data) => api.put(`/avatars/${id}`, data),
  delete: (id) => api.delete(`/avatars/${id}`)
};

// Image API
export const imageAPI = {
  generate: (data) => api.post('/images/generate', data),
  getHistory: (page = 1, limit = 20) => 
    api.get(`/images/history?page=${page}&limit=${limit}`),
  getById: (id) => api.get(`/images/${id}`),
  delete: (id) => api.delete(`/images/${id}`)
};

// User API
export const userAPI = {
  getStats: () => api.get('/users/stats')
};

export default api; 