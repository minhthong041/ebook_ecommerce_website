import { Outlet, ScrollRestoration } from "react-router-dom";
import Header from "../components/Header/Header";
import Footer from "../components/Footer/Footer";
import "./layouts.css";

/**
 * MainLayout – layout chính cho các trang công khai.
 * Cấu trúc: Header (fixed) + main content + Footer
 */
export default function MainLayout() {
  return (
    <div className="main-layout">
      <Header />
      <main className="main-layout__content" id="main-content">
        <div className="main-layout__body">
          <div className="main-layout__page">
            <Outlet />
          </div>
        </div>
      </main>
      <Footer />
      <ScrollRestoration />
    </div>
  );
}
