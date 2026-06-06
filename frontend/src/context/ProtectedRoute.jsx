import { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from './AuthContext';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isAuthReady } = useContext(AuthContext);

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

  // Nếu đã đăng nhập, cho phép đi tiếp vào trang con
  return children;
};

export default ProtectedRoute;
