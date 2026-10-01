import React, { createContext, useState, useContext, useEffect } from 'react';
import { authService } from '../services';
import { disconnectSocket } from '../services/socket';
import { authStorage } from '../services/authStorage';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(authStorage.getToken());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = authStorage.getUser();
    if (storedUser) {
      setUser(storedUser);
    }
    // Always re-sync the profile from the server so fresh data (e.g. a newly
    // uploaded profile picture) shows up even when the saved user is stale.
    const token = authStorage.getToken();
    if (token) {
      authService.getMe()
        .then((res) => {
          const fresh = res.data.user;
          const merged = { ...(storedUser || {}), ...fresh };
          authStorage.setUser(merged);
          setUser(merged);
        })
        .catch(() => {
          // token may be expired — the stored user is still used
        });
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    const res = await authService.login({ email, password });
    const { token: newToken, user: newUser } = res.data;
    authStorage.setToken(newToken);
    authStorage.setUser(newUser);
    setToken(newToken);
    setUser(newUser);
    return newUser;
  };

  const loginQR = async (qrCode) => {
    const res = await authService.loginQR({ qr_code: qrCode });
    const { token: newToken, user: newUser } = res.data;
    authStorage.setToken(newToken);
    authStorage.setUser(newUser);
    setToken(newToken);
    setUser(newUser);
    return newUser;
  };

  const register = async (data) => {
    const res = await authService.register(data);
    return res.data;
  };

  const logout = () => {
    authStorage.removeToken();
    authStorage.removeUser();
    sessionStorage.removeItem('loginCredentials');
    setToken(null);
    setUser(null);
    disconnectSocket();
  };

  const refreshMe = async () => {
    if (!token) return;
    try {
      const res = await authService.getMe();
      const fresh = res.data.user;
      const merged = { ...user, ...fresh };
      authStorage.setUser(merged);
      setUser(merged);
      return merged;
    } catch (e) {
      // ignore - token may be expired
    }
  };

  const isLibrarian = user?.role === 'LIBRARIAN';
  const isStudent = user?.role === 'STUDENT';
  const isTeacher = user?.role === 'TEACHER';
  const isGuest = user?.role === 'GUEST';

  return (
    <AuthContext.Provider value={{
      user, token, loading, login, loginQR, register, logout, refreshMe, setUser,
      isLibrarian, isStudent, isTeacher, isGuest
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
