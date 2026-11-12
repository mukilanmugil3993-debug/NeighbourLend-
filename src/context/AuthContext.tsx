import React, { createContext, useContext, useState, useEffect } from 'react';
import { Member } from '../types/index.ts';
import { api, setStoredToken, clearStoredToken } from '../services/api.ts';

interface AuthContextType {
  user: Member | null;
  loading: boolean;
  unreadNotifications: number;
  login: (email: string, password?: string) => Promise<void>;
  register: (data: { fullName: string; email: string; password: string; phone?: string; location?: string }) => Promise<void>;
  logout: () => Promise<void>;
  switchUser: (email: string) => Promise<void>;
  refreshUser: () => Promise<void>;
  setUnreadNotifications: React.Dispatch<React.SetStateAction<number>>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<Member | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [unreadNotifications, setUnreadNotifications] = useState<number>(0);

  const refreshUser = async () => {
    try {
      const res = await api.getCurrentUser();
      setUser(res.member);
      setUnreadNotifications(res.unreadNotifications || 0);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const login = async (email: string, password = 'password123') => {
    setLoading(true);
    try {
      const res = await api.login({ email, password });
      setStoredToken(res.token);
      setUser(res.member);
      await refreshUser();
    } finally {
      setLoading(false);
    }
  };

  const register = async (data: { fullName: string; email: string; password: string; phone?: string; location?: string }) => {
    setLoading(true);
    try {
      const res = await api.register(data);
      setStoredToken(res.token);
      setUser(res.member);
      await refreshUser();
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await api.logout();
    } catch {
      // ignore
    } finally {
      clearStoredToken();
      setUser(null);
      setUnreadNotifications(0);
      setLoading(false);
    }
  };

  const switchUser = async (email: string) => {
    await login(email, 'password123');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        unreadNotifications,
        login,
        register,
        logout,
        switchUser,
        refreshUser,
        setUnreadNotifications
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
