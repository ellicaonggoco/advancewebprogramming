import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('attendance_token') || null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('attendance_token');
      const storedUser = localStorage.getItem('attendance_user');

      if (storedToken && storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          const cachedAvatar = localStorage.getItem(`attendance_avatar_${parsedUser?.username}`);
          if (!parsedUser.avatar && cachedAvatar) {
            parsedUser.avatar = cachedAvatar;
            if (parsedUser.employee) parsedUser.employee.avatar = cachedAvatar;
          }
          setUser(parsedUser);
          // Verify with backend
          const res = await api.getMe();
          if (res.success && res.user) {
            let activeUser = res.user;
            if (!activeUser.avatar && cachedAvatar) {
              activeUser.avatar = cachedAvatar;
              if (activeUser.employee) activeUser.employee.avatar = cachedAvatar;
            } else if (activeUser.avatar && activeUser.username) {
              localStorage.setItem(`attendance_avatar_${activeUser.username}`, activeUser.avatar);
            }
            setUser(activeUser);
            localStorage.setItem('attendance_user', JSON.stringify(activeUser));
          }
        } catch (err) {
          console.warn('Session expired or invalid token:', err.message);
          logout();
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (credentials) => {
    const res = await api.login(credentials);
    if (res.success) {
      let finalUser = res.user;
      const cachedAvatar = localStorage.getItem(`attendance_avatar_${finalUser?.username}`);
      if (!finalUser.avatar && cachedAvatar) {
        finalUser.avatar = cachedAvatar;
        if (finalUser.employee) finalUser.employee.avatar = cachedAvatar;
      } else if (finalUser.avatar && finalUser.username) {
        localStorage.setItem(`attendance_avatar_${finalUser.username}`, finalUser.avatar);
      }

      setToken(res.token);
      setUser(finalUser);
      localStorage.setItem('attendance_token', res.token);
      localStorage.setItem('attendance_user', JSON.stringify(finalUser));
      return finalUser;
    }
    throw new Error(res.message || 'Login failed');
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('attendance_token');
    localStorage.removeItem('attendance_user');
  };

  const updateUser = (updatedUser) => {
    if (updatedUser?.username && updatedUser?.avatar) {
      localStorage.setItem(`attendance_avatar_${updatedUser.username}`, updatedUser.avatar);
    }
    setUser(updatedUser);
    localStorage.setItem('attendance_user', JSON.stringify(updatedUser));
  };

  const isAdmin = user?.role === 'admin' || user?.role === 'manager';

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, updateUser, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
