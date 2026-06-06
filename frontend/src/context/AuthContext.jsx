/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import axiosClient from '../api/axiosClient';

export const AuthContext = createContext(null);

function getSavedUser() {
  const savedUser = localStorage.getItem('user_info');
  if (!savedUser) {
    return null;
  }

  try {
    return JSON.parse(savedUser);
  } catch {
    localStorage.removeItem('user_info');
    return null;
  }
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(getSavedUser);
  const [isAuthenticated, setIsAuthenticated] = useState(() =>
    Boolean(localStorage.getItem('user_info')),
  );
  const [isAuthReady, setIsAuthReady] = useState(() =>
    !localStorage.getItem('user_info'),
  );

  const updateUser = useCallback((userData) => {
    localStorage.setItem('user_info', JSON.stringify(userData));
    setUser(userData);
    setIsAuthenticated(true);
  }, []);

  const login = useCallback((userData) => {
    updateUser(userData);
  }, [updateUser]);

  const clearAuthState = useCallback(() => {
    localStorage.removeItem('user_info');
    setIsAuthenticated(false);
    setUser(null);
  }, []);

  const logout = useCallback(async () => {
    try {
      await axiosClient.post('/auth/logout/', {}, { timeout: 3000 });
    } catch {
      // Logic gỡ local chạy trên mọi tình huống
    } finally {
      clearAuthState();
      window.location.href = "/";
    }
  }, [clearAuthState]);

  useEffect(() => {
    let isMounted = true;

    async function validateSavedSession() {
      // Dù F5 chưa kịp load storage, cứ âm thầm gọi me xem Cookie có sống ko
      try {
        const freshUser = await axiosClient.get('/auth/me/');
        if (isMounted) {
          updateUser(freshUser);
        }
      } catch {
        if (isMounted) {
          clearAuthState();
        }
      } finally {
        if (isMounted) {
          setIsAuthReady(true);
        }
      }
    }

    validateSavedSession();

    return () => {
      isMounted = false;
    };
  }, [clearAuthState, updateUser]);

  const contextValue = useMemo(
    () => ({
      isAuthenticated,
      isAuthReady,
      user,
      login,
      updateUser,
      logout,
      clearAuthState,
    }),
    [clearAuthState, isAuthenticated, isAuthReady, login, logout, updateUser, user],
  );

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};
