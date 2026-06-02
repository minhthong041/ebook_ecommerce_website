import { createContext, useState, useEffect } from 'react';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Kiểm tra token khi load lại trang
  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token) {
      // Có thể gọi API lấy thông tin user từ token ở đây
      setIsAuthenticated(true);
    }
  }, []);

  const login = (token, userData) => {
    localStorage.setItem('access_token', token); // Lưu token
    setUser(userData);
    setIsAuthenticated(true);
  };

  const logout = () => {
    localStorage.removeItem('access_token'); // Xóa token
    setUser(null);
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};