// Per-tab auth storage: each browser tab keeps its own session, so a student
// can stay logged in one tab while a librarian logs in on another.
const storage = window.sessionStorage;

export const authStorage = {
  getToken: () => storage.getItem('token'),
  setToken: (token) => storage.setItem('token', token),
  removeToken: () => storage.removeItem('token'),
  getUser: () => {
    const raw = storage.getItem('user');
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch (e) {
      return null;
    }
  },
  setUser: (user) => storage.setItem('user', JSON.stringify(user)),
  removeUser: () => storage.removeItem('user'),
};