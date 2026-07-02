import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import * as authApi from '../api/auth';
import * as liveEventsApi from '../api/liveEvents';
import { canWriteRole, can as checkPermission } from '../utils/permissions';

const AuthContext = createContext(null);

function loadStoredUser() {
  try {
    const raw = localStorage.getItem('user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(loadStoredUser);
  const [loading, setLoading] = useState(!!localStorage.getItem('token'));
  const [liveMonitoring, setLiveMonitoring] = useState(false);

  const persistSession = useCallback((token, nextUser) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(nextUser));
    setUser(nextUser);
  }, []);

  const clearSession = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setLiveMonitoring(false);
  }, []);

  const activateLiveMonitoring = useCallback(async () => {
    try {
      const status = await liveEventsApi.startLiveEvents();
      const active = status.active === true;
      setLiveMonitoring(active);
      if (active) {
        toast.success('Live monitoring started', { duration: 2500 });
      }
    } catch {
      setLiveMonitoring(false);
    }
  }, []);

  const deactivateLiveMonitoring = useCallback(async () => {
    try {
      await liveEventsApi.stopLiveEvents();
    } catch {
      // ignore — session may already be cleared
    }
    setLiveMonitoring(false);
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setLoading(false);
      return;
    }

    authApi
      .getMe()
      .then(async (profile) => {
        setUser(profile);
        localStorage.setItem('user', JSON.stringify(profile));
        await activateLiveMonitoring();
      })
      .catch(() => clearSession())
      .finally(() => setLoading(false));
  }, [clearSession, activateLiveMonitoring]);

  const login = useCallback(
    async (email, password) => {
      const data = await authApi.login(email, password);
      persistSession(data.token, data.user);
      try {
        await activateLiveMonitoring();
      } catch {
        // Live events optional — login must not fail if generator route is unavailable
      }
      return data.user;
    },
    [persistSession, activateLiveMonitoring]
  );

  const register = useCallback(
    async (payload) => {
      const data = await authApi.register(payload);
      persistSession(data.token, data.user);
      try {
        await activateLiveMonitoring();
      } catch {
        // Live events optional until backend is redeployed
      }
      return data.user;
    },
    [persistSession, activateLiveMonitoring]
  );

  const logout = useCallback(async () => {
    await deactivateLiveMonitoring();
    clearSession();
    toast.success('Signed out successfully');
  }, [clearSession, deactivateLiveMonitoring]);

  const value = useMemo(
    () => ({
      user,
      loading,
      isAuthenticated: !!user,
      liveMonitoring,
      login,
      register,
      logout,
      canWrite: canWriteRole(user?.role),
      can: (permission) => checkPermission(user?.role, permission),
      hasRole: (...roles) => roles.includes(user?.role),
    }),
    [user, loading, liveMonitoring, login, register, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
