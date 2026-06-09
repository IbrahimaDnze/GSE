import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import api from '../api/axios';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const normalizeUser = (u) => ({
    ...u,
    id: u._id || u.id,
    name: u.nom || u.name,
    phone: u.telephone || u.phone,
  });

  useEffect(() => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (token) {
      api.get('/auth/me')
        .then(res => setUser(normalizeUser(res.data)))
        .catch(() => { localStorage.removeItem('token'); sessionStorage.removeItem('token'); })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = useCallback(async (email, motDePasse, rememberMe = false) => {
    const res = await api.post('/auth/login', { email, motDePasse });
    if (rememberMe) localStorage.setItem('token', res.data.token);
    else sessionStorage.setItem('token', res.data.token);
    setUser(normalizeUser(res.data.user));
    return res.data;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    sessionStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const res = await api.get('/auth/me');
      setUser(normalizeUser(res.data));
    } catch {
      logout();
    }
  }, [logout]);

  return (
    <AuthContext.Provider value={{ user, login, logout, refreshUser, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
