import { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from './AuthContext';

const ROLE_ALIASES = {
  admin: 'admin',
  administrator: 'admin',
  employee: 'employee',
  staff: 'employee',
  customer: 'customer',
};

function normalizeRole(role) {
  const rawRole = typeof role === 'object' ? role?.name : role;
  const normalizedRole = String(rawRole || '').trim().toLowerCase();
  return ROLE_ALIASES[normalizedRole] || normalizedRole;
}

function getUserRoles(user) {
  const roles = new Set();
  const primaryRole = normalizeRole(user?.role);

  if (primaryRole) {
    roles.add(primaryRole);
  }
  if (user?.is_superuser) {
    roles.add('admin');
    roles.add('employee');
  }
  if (user?.is_staff) {
    roles.add('employee');
  }

  return roles;
}

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
  if (allowedRoles) {
    const userRoles = getUserRoles(user);
    const hasAllowedRole = allowedRoles
      .map(normalizeRole)
      .some((allowedRole) => userRoles.has(allowedRole));

    if (!hasAllowedRole) {
      return <Navigate to="/" replace />; // Đá về trang chủ nếu không có quyền
    }
  }

  // Nếu đã đăng nhập, cho phép đi tiếp vào trang con
  return children;
};

export default ProtectedRoute;
