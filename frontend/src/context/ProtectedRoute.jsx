import { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from './AuthContext';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { isAuthenticated, isAuthReady, user } = useContext(AuthContext);

  if (!isAuthReady) {
    return (
      <div
        style={{
          minHeight: '50vh',
          display: 'grid',
          placeItems: 'center',
          color: 'var(--text-secondary)',
          fontWeight: 700,
        }}
      >
        Đang kiểm tra đăng nhập...
      </div>
    );
  }

  // Nếu chưa đăng nhập, tự động đá người dùng về trang /login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Kiểm tra phân quyền dựa vào mảng nhận vào (Role-based Access Control)
  if (allowedRoles && user && user.role) {
     const userRole = user.role.name || user.role;
     if (!allowedRoles.includes(userRole)) {
         return <Navigate to="/" replace />; // Đá về trang chủ nếu không có quyền
     }
  }

  // Nếu đã đăng nhập, cho phép đi tiếp vào trang con
  return children;
};

export default ProtectedRoute;
