import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://api.broo.email:3000';

const api = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT to every outgoing request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('broo_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 globally — redirect to login
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('broo_token');
      if (window.location.pathname !== '/login' && window.location.pathname !== '/') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Auth
export const authAPI = {
  register: (data) => api.post('/api/auth/register', data),
  login: (data) => api.post('/api/auth/login', data),
  googleAuthUrl: () => `${API_URL}/api/auth/google`,
};

// Emails
export const emailAPI = {
  list: (params) => api.get('/api/emails', { params }),
  getById: (id) => api.get(`/api/emails/${id}`),
  toggleStar: (id) => api.patch(`/api/emails/${id}/star`),
  moveToFolder: (id, folder) => api.patch(`/api/emails/${id}/folder`, { folder }),
  deleteEmail: (id, permanent = false) => api.delete(`/api/emails/${id}`, { params: { permanent } }),
  send: (formData, onUploadProgress) =>
    api.post('/api/emails/send', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress,
    }),
  search: (query) => api.get('/api/emails', { params: { search: query } }),
};

// User
export const userAPI = {
  getProfile: () => api.get('/api/user/profile'),
  getStorage: () => api.get('/api/user/storage'),
  updateProfile: (data) => api.put('/api/user/profile', data),
};

export default api;
