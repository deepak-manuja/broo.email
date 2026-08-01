import { useState, useEffect, useCallback } from 'react';
import { authAPI, userAPI } from '../lib/api';
import { connectSocket, disconnectSocket } from '../lib/socket';
import { AuthContext } from './authContextDef';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('broo_user');
    try {
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState(() => localStorage.getItem('broo_token'));
  const [loading, setLoading] = useState(true);

  // Fetch user profile if token exists
  useEffect(() => {
    if (token) {
      userAPI.getProfile()
        .then((res) => {
          setUser(res.data);
          localStorage.setItem('broo_user', JSON.stringify(res.data));
          connectSocket(token);
        })
        .catch(() => {
          localStorage.removeItem('broo_token');
          localStorage.removeItem('broo_user');
          setToken(null);
          setUser(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [token]);

  const login = useCallback(async (email, password) => {
    const res = await authAPI.login({ email, password });
    const { token: jwt, user: userData } = res.data;
    localStorage.setItem('broo_token', jwt);
    localStorage.setItem('broo_user', JSON.stringify(userData));
    setToken(jwt);
    setUser(userData);
    connectSocket(jwt);
    return userData;
  }, []);

  const register = useCallback(async (email, password) => {
    const res = await authAPI.register({ email, password });
    const { token: jwt, user: userData } = res.data;
    localStorage.setItem('broo_token', jwt);
    localStorage.setItem('broo_user', JSON.stringify(userData));
    setToken(jwt);
    setUser(userData);
    connectSocket(jwt);
    return userData;
  }, []);

  const handleOAuthToken = useCallback(async (jwt) => {
    localStorage.setItem('broo_token', jwt);
    setToken(jwt);
    try {
      const res = await userAPI.getProfile();
      setUser(res.data);
      localStorage.setItem('broo_user', JSON.stringify(res.data));
      connectSocket(jwt);
    } catch {
      localStorage.removeItem('broo_token');
      localStorage.removeItem('broo_user');
      setToken(null);
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('broo_token');
    localStorage.removeItem('broo_user');
    setToken(null);
    setUser(null);
    disconnectSocket();
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, handleOAuthToken, isAuthenticated: !!token && !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

