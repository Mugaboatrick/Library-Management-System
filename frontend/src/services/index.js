import api from './api';
export { publicUrl } from './api';

export const authService = {
  login: (data) => api.post('/auth/login', data),
  loginQR: (data) => api.post('/auth/login/qr', data),
  register: (data) => api.post('/auth/register', data),
  getMe: () => api.get('/auth/me'),
  changePassword: (data) => api.put('/auth/change-password', data),
  updateProfileImage: (file) => {
    const formData = new FormData();
    formData.append('image', file);
    return api.put('/auth/profile-image', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
  },
  removeProfileImage: () => api.delete('/auth/profile-image')
};

export const userService = {
  list: (params) => api.get('/users', { params }),
  get: (id) => api.get(`/users/${id}`),
  create: (data) => api.post('/users', data),
  update: (id, data) => api.put(`/users/${id}`, data),
  block: (id, data) => api.put(`/users/${id}/block`, data),
  resetPassword: (id, data) => api.put(`/users/${id}/reset-password`, data),
  remove: (id) => api.delete(`/users/${id}`),
  getQRCards: (id) => api.get(`/users/${id}/qrcards`),
  regenerateQR: (userId) => api.post(`/users/${userId}/qrcards/regenerate`),
  deleteQRCard: (userId, cardId) => api.delete(`/users/${userId}/qrcards/${cardId}`),
  updateQRCard: (userId, cardId, data) => api.put(`/users/${userId}/qrcards/${cardId}`, data)
};

export const bookService = {
  list: (params) => api.get('/books', { params }),
  get: (id) => api.get(`/books/${id}`),
  create: (data) => api.post('/books', data),
  update: (id, data) => api.put(`/books/${id}`, data),
  addCopies: (id, data) => api.post(`/books/${id}/copies`, data),
  retire: (id, data) => api.put(`/books/retire/${id}`, data),
  retired: () => api.get('/books/retired'),
  categories: () => api.get('/books/categories')
};

export const borrowService = {
  borrow: (data) => api.post('/borrowings/borrow', data),
  returnBook: (data) => api.post('/borrowings/return', data),
  returnMyBook: (data) => api.post('/borrowings/return-my', data),
  list: (params) => api.get('/borrowings', { params }),
  mine: () => api.get('/borrowings/mine')
};

export const fineService = {
  list: (params) => api.get('/fines', { params }),
  mine: () => api.get('/fines/mine'),
  pay: (fineId, data) => api.post(`/fines/${fineId}/pay`, data),
  payAll: (data) => api.post('/fines/mine/pay-all', data),
  waive: (fineId, data) => api.put(`/fines/${fineId}/waive`, data),
  payments: () => api.get('/fines/payments/all'),
  settings: () => api.get('/fines/settings')
};

export const ebookService = {
  list: (params) => api.get('/ebooks', { params }),
  read: (id) => `${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/ebooks/${id}/read`,
  download: (id) => `${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/ebooks/${id}/download`,
  upload: (formData) => api.post('/ebooks', formData),
  remove: (id) => api.delete(`/ebooks/${id}`),
  myBookmarks: () => api.get('/ebooks/bookmarks/mine'),
  addBookmark: (data) => api.post('/ebooks/bookmarks', data),
  deleteBookmark: (id) => api.delete(`/ebooks/bookmarks/${id}`)
};

export const reportService = {
  dashboard: () => api.get('/reports/dashboard'),
  publicSummary: () => api.get('/reports/public-summary'),
  mostBorrowed: (params) => api.get('/reports/most-borrowed', { params }),
  monthlyTrends: () => api.get('/reports/monthly-trends'),
  users: () => api.get('/reports/users'),
  fines: () => api.get('/reports/fines'),
  auditLogs: () => api.get('/reports/audit-logs'),
  runFineCron: () => api.post('/reports/run-fine-cron')
};

export const settingsService = {
  getEmailLogin: () => api.get('/settings/email-login'),
  setEmailLogin: (data) => api.put('/settings/email-login', data)
};

export const accountRequestService = {
  create: (data) => api.post('/account-requests', data),
  list: (params) => api.get('/account-requests', { params }),
  updateStatus: (id, data) => api.put(`/account-requests/${id}`, data),
  remove: (id) => api.delete(`/account-requests/${id}`)
};
