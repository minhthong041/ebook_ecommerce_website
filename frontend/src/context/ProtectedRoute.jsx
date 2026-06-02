    import { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from './AuthContext';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useContext(AuthContext);

  // Nếu chưa đăng nhập, tự động đá người dùng về trang /login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Nếu đã đăng nhập, cho phép đi tiếp vào trang con
  return children;
};

export default ProtectedRoute;