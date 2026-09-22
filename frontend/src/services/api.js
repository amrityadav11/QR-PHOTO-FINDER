import axios from 'axios';
import toast from 'react-hot-toast';

let rawApiUrl = process.env.REACT_APP_API_URL || '/api';
if (rawApiUrl.startsWith('http') && !rawApiUrl.endsWith('/api')) {
  rawApiUrl = rawApiUrl.replace(/\/+$/, '') + '/api';
}
const BASE_URL = rawApiUrl;

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 60000,
  headers: { 'Content-Type': 'application/json' },
});

// ─── Request interceptor — attach JWT ─────────────────────────────────────────
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

// ─── Response interceptor — handle auth expiry ────────────────────────────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const message = error.response?.data?.message;

    if (status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // Only redirect if not already on auth pages
      if (!window.location.pathname.startsWith('/login') &&
          !window.location.pathname.startsWith('/register') &&
          !window.location.pathname.startsWith('/e/')) {
        toast.error(message || 'Your session has expired. Please log in again.');
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

// ─── Auth API ─────────────────────────────────────────────────────────────────
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  getMe: () => api.get('/auth/me'),
  updateMe: (formData) =>
    api.put('/auth/me', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  changePassword: (data) => api.put('/auth/change-password', data),
};

// ─── Events API ───────────────────────────────────────────────────────────────
export const eventsAPI = {
  create: (formData) =>
    api.post('/events', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  getAll: (params) => api.get('/events', { params }),
  getById: (id) => api.get(`/events/${id}`),
  update: (id, formData) =>
    api.put(`/events/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  delete: (id) => api.delete(`/events/${id}`),
  getQR: (id) => api.get(`/events/${id}/qr`),
  regenerateQR: (id) => api.post(`/events/${id}/regenerate-qr`),
  getStats: (id) => api.get(`/events/${id}/stats`),
};

// ─── Photos API ───────────────────────────────────────────────────────────────
export const photosAPI = {
  upload: (eventId, formData, onProgress) =>
    api.post(`/events/${eventId}/photos`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const pct = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(pct);
        }
      },
      timeout: 300000, // 5 min for large uploads
    }),
  getAll: (eventId, params) => api.get(`/events/${eventId}/photos`, { params }),
  delete: (eventId, photoId) => api.delete(`/events/${eventId}/photos/${photoId}`),
  getProcessingStatus: (eventId) =>
    api.get(`/events/${eventId}/photos/processing-status`),
};

// ─── Analytics API ────────────────────────────────────────────────────────────
export const analyticsAPI = {
  getDashboard: () => api.get('/analytics/dashboard'),
  getEventAnalytics: (eventId) => api.get(`/analytics/events/${eventId}`),
};

// ─── Public API (guest-facing — no auth required) ────────────────────────────
export const publicAPI = {
  getEvent: (slug) => api.get(`/public/events/${slug}`),
  searchPhotos: (slug, formData, onProgress) =>
    api.post(`/public/events/${slug}/search`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 120000, // 2 min for face matching
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const pct = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(pct);
        }
      },
    }),
  getResults: (slug, searchId) =>
    api.get(`/public/events/${slug}/results/${searchId}`),
  getDownloadUrl: (slug, photoId) =>
    api.get(`/public/events/${slug}/photos/${photoId}/download`),
};

// ─── Admin API ────────────────────────────────────────────────────────────────
export const adminAPI = {
  getStats: () => api.get('/admin/stats'),
  getUsers: (params) => api.get('/admin/users', { params }),
  toggleUserActive: (userId) => api.patch(`/admin/users/${userId}/toggle-active`),
  getEvents: (params) => api.get('/admin/events', { params }),
  deleteEvent: (eventId) => api.delete(`/admin/events/${eventId}`),
};

export default api;
