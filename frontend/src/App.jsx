import { useContext } from "react";
import { createBrowserRouter, Navigate, RouterProvider } from "react-router-dom";

// 1. Layouts và các trang tính năng (main)
import MainLayout from "./layouts/MainLayout";
import AuthLayout from "./layouts/AuthLayout";
import AdminLayout from "./layouts/AdminLayout";

import HomePage from "./pages/Home/HomePage";
import BrowsePage from "./pages/Browse/BrowsePage";
import CartPage from "./pages/Cart/CartPage";
import NotFoundPage from "./pages/NotFound/NotFoundPage";
import BookDetailPage from "./pages/BookDetail/BookDetailPage";
import LibraryPage from "./pages/Library/LibraryPage";
import ReaderPage from "./pages/Reader/ReaderPage";
import WishlistPage from "./pages/WishlistPage";
import StaffBookManagement from "./pages/StaffBookManagement";
import StaffReviewManagement from "./pages/StaffReviewManagement";
import StaffBookUpload from "./pages/StaffBookUpload";
import StaffOrderManagement from "./pages/StaffOrderManagement";
import AdminUserManagement from "./pages/AdminUserManagement";
import DashboardPage from "./pages/DashboardPage";
import OrdersPage from "./pages/OrdersPage";
import SettingsPage from "./pages/SettingsPage";

// 🟢 THÊM MỚI: Import 2 trang vừa tạo
import CheckoutPage from "./pages/CheckoutPage";
import OrderSuccessPage from "./pages/OrderSuccessPage";

// 2. Các trang Logic & Bảo mật (HEAD)
import Login from "./pages/Login";
import Register from "./pages/Register";
import Account from "./pages/Account";
import { AuthContext } from "./context/AuthContext";
import ProtectedRoute from "./context/ProtectedRoute";

/** Component hiển thị tạm thời của hệ thống */
function ComingSoon({ page }) {
  return (
    <div
      style={{
        minHeight: "60vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "16px",
        padding: "40px 20px",
        textAlign: "center",
      }}
    >
      <div style={{ fontSize: "3rem" }}>🚧</div>
      <h2
        style={{
          fontFamily: "var(--font-heading)",
          fontSize: "1.75rem",
          fontWeight: 800,
          background: "var(--gradient-text)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
        }}
      >
        {page}
      </h2>
      <p
        style={{
          color: "var(--text-secondary)",
          maxWidth: "360px",
          lineHeight: 1.7,
        }}
      >
        Trang này đang được xây dựng. Quay lại sớm nhé!
      </p>
    </div>
  );
}

function GuestRoute({ children }) {
  const { isAuthenticated, isAuthReady } = useContext(AuthContext);

  if (!isAuthReady) {
    return <RouteLoading />;
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return children;
}

function RouteLoading() {
  return (
    <div
      style={{
        minHeight: "50vh",
        display: "grid",
        placeItems: "center",
        color: "var(--text-secondary)",
        fontWeight: 700,
      }}
    >
      Đang kiểm tra đăng nhập...
    </div>
  );
}

// 3. Hệ thống cấu hình Tuyến đường (Router) hợp nhất
const router = createBrowserRouter([
  {
    // ── Public routes (Mua sắm công khai - Sử dụng giao diện chung) ──
    element: <MainLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: "browse", element: <BrowsePage /> },
      { path: "pricing", element: <ComingSoon page="Premium" /> },
      { path: "search", element: <ComingSoon page="Tìm kiếm" /> },
      { path: "cart", element: <CartPage /> },
      { path: "book/:id", element: <BookDetailPage /> },

      // 🟢 THÊM MỚI: Khai báo route cho Checkout và Order Success
      { path: "checkout", element: <CheckoutPage /> },
      { path: "order-success", element: <OrderSuccessPage /> },
    ],
  },
  {
    // ── Auth routes (Giao diện Đăng nhập / Đăng ký) ──
    element: <AuthLayout />,
    children: [
      {
        path: "login",
        element: (
          <GuestRoute>
            <Login />
          </GuestRoute>
        ),
      },
      {
        path: "register",
        element: (
          <GuestRoute>
            <Register />
          </GuestRoute>
        ),
      },
    ],
  },
  {
    // ── Dashboard / Account routes (Giao diện Quản lý / Trang cá nhân) ──
    element: <AdminLayout pageTitle="Dashboard" />,
    children: [
      {
        path: "dashboard",
        element: (
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "library",
        element: (
          <ProtectedRoute>
            <LibraryPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "wishlist",
        element: (
          <ProtectedRoute>
            <WishlistPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "orders",
        element: (
          <ProtectedRoute>
            <OrdersPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "staff/orders",
        element: (
          <ProtectedRoute>
            <StaffOrderManagement />
          </ProtectedRoute>
        ),
      },
      {
        path: "staff/books",
        element: (
          <ProtectedRoute>
            <StaffBookManagement />
          </ProtectedRoute>
        ),
      },
      {
        path: "staff/books/upload",
        element: (
          <ProtectedRoute>
            <StaffBookUpload />
          </ProtectedRoute>
        ),
      },
      {
        path: "staff/reviews",
        element: (
          <ProtectedRoute>
            <StaffReviewManagement />
          </ProtectedRoute>
        ),
      },
      {
        path: "admin/users",
        element: (
          <ProtectedRoute>
            <AdminUserManagement />
          </ProtectedRoute>
        ),
      },
      {
        path: "profile",
        element: (
          <ProtectedRoute>
            <Account />
          </ProtectedRoute>
        ),
      },
      {
        path: "account",
        element: (
          <ProtectedRoute>
            <Account />
          </ProtectedRoute>
        ),
      },
      {
        path: "settings",
        element: (
          <ProtectedRoute>
            <SettingsPage />
          </ProtectedRoute>
        ),
      },
    ],
  },
  {
    // ── Standalone Immersive Reader Route ──
    path: "reader/:id",
    element: <ReaderPage />,
  },
  {
    // ── 404 Not Found ──
    path: "*",
    element: <NotFoundPage />,
  },
]);

function App() {
  return <RouterProvider router={router} />;
}

export default App;
