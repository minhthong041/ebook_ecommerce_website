import { createBrowserRouter, RouterProvider } from "react-router-dom";

// Layouts
import MainLayout from "./layouts/MainLayout";
import AuthLayout from "./layouts/AuthLayout";
import AdminLayout from "./layouts/AdminLayout";

// Pages
import HomePage from "./pages/Home/HomePage";
import BrowsePage from "./pages/Browse/BrowsePage";
import AuthorsPage from "./pages/Authors/AuthorsPage";
import CartPage from "./pages/Cart/CartPage";
import NotFoundPage from "./pages/NotFound/NotFoundPage";
import BookDetailPage from "./pages/BookDetail/BookDetailPage";

/** Temporary placeholder for pages not yet implemented */
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

const router = createBrowserRouter([
  {
    // ── Public routes (Header + Footer) ──
    element: <MainLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: "browse", element: <BrowsePage /> },
      { path: "authors", element: <AuthorsPage /> },
      { path: "pricing", element: <ComingSoon page="Premium" /> },
      { path: "search", element: <ComingSoon page="Tìm kiếm" /> },
      { path: "cart", element: <CartPage /> },
      { path: "book/:id", element: <BookDetailPage /> },
    ],
  },
  {
    // ── Auth routes (Brand panel + Form) ──
    element: <AuthLayout />,
    children: [
      { path: "login", element: <ComingSoon page="Đăng nhập" /> },
      { path: "register", element: <ComingSoon page="Đăng ký" /> },
    ],
  },
  {
    // ── Dashboard / Account routes (Sidebar layout) ──
    element: <AdminLayout pageTitle="Dashboard" />,
    children: [
      { path: "dashboard", element: <ComingSoon page="Dashboard" /> },
      { path: "library", element: <ComingSoon page="Thư viện của tôi" /> },
      { path: "orders", element: <ComingSoon page="Đơn hàng" /> },
      { path: "profile", element: <ComingSoon page="Hồ sơ cá nhân" /> },
      { path: "settings", element: <ComingSoon page="Cài đặt" /> },
    ],
  },
  {
    // ── 404 ──
    path: "*",
    element: <NotFoundPage />,
  },
]);

function App() {
  return <RouterProvider router={router} />;
}

export default App;
