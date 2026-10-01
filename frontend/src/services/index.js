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
  librarian: () => api.get('/users/librarian'),
  librarians: () => api.get('/users/librarians'),
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
  resolveScan: (code) => api.get('/books/resolve-scan', { params: { code } }),
  create: (data) => api.post('/books', data),
  update: (id, data) => api.put(`/books/${id}`, data),
  addCopies: (id, data) => api.post(`/books/${id}/copies`, data),
  setCopyCode: (copyId, copyCode) => api.put(`/books/copies/${copyId}/code`, { copy_code: copyCode }),
  remove: (id) => api.delete(`/books/${id}`),
  retire: (id, data) => api.put(`/books/retire/${id}`, data),
  retireAll: (id, data) => api.put(`/books/retire-all/${id}`, data),
  retired: () => api.get('/books/retired'),
  categories: () => api.get('/books/categories'),
  sections: () => api.get('/books/sections')
};

export const categoryService = {
  list: () => api.get('/categories'),
  categories: () => api.get('/categories/list'),
  create: (data) => api.post('/categories', data),
  update: (id, data) => api.put(`/categories/${id}`, data),
  remove: (id) => api.delete(`/categories/${id}`),
  subjects: (categoryId) => api.get(`/categories/${categoryId}/subjects`),
  addSubject: (categoryId, data) => api.post(`/categories/${categoryId}/subjects`, data),
  updateSubject: (categoryId, subjectId, data) => api.put(`/categories/${categoryId}/subjects/${subjectId}`, data),
  removeSubject: (categoryId, subjectId) => api.delete(`/categories/${categoryId}/subjects/${subjectId}`)
};

export const borrowService = {
  borrow: (data) => api.post('/borrowings/borrow', data),
  returnBook: (data) => api.post('/borrowings/return', data),
  returnMyBook: (data) => api.post('/borrowings/return-my', data),
  list: (params) => api.get('/borrowings', { params }),
  mine: () => api.get('/borrowings/mine'),
  approve: (id) => api.post(`/borrowings/${id}/approve`),
  reject: (id) => api.post(`/borrowings/${id}/reject`)
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
  read: (id) => `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/ebooks/${id}/read`,
  download: (id) => `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/ebooks/${id}/download`,
  upload: (formData) => api.post('/ebooks', formData),
  update: (id, data) => api.put(`/ebooks/${id}`, data),
  setAccessMode: (id, data) => api.put(`/ebooks/${id}/access-mode`, data),
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

export const notificationService = {
  mine: (params) => api.get('/notifications', { params }),
  markRead: (id) => api.post(`/notifications/${id}/read`),
  markAllRead: () => api.post('/notifications/read-all')
};

export const messageService = {
  inbox: () => api.get('/messages/inbox'),
  sent: () => api.get('/messages/sent'),
  send: (data) => api.post('/messages', data),
  markRead: (id) => api.post(`/messages/${id}/read`),
  markAllRead: () => api.post('/messages/read-all'),
  remove: (id) => api.delete(`/messages/${id}`)
};
