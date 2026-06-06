import { Outlet } from 'react-router-dom'
import { Link } from 'react-router-dom'
import './layouts.css'

/**
 * AuthLayout – layout cho trang Login / Register.
 * Cấu trúc: Brand panel (trái) + Form panel (phải)
 */
export default function AuthLayout() {
  return (
    <div className="auth-layout">
      {/* Brand / Illustration panel */}
      <div className="auth-layout__brand" aria-hidden="true">
        <Link to="/" className="auth-layout__brand-logo">
          <div className="auth-layout__brand-logo-icon">
            <img src="/logo.svg" alt="" className="auth-layout__brand-logo-img" />
          </div>
          <span className="auth-layout__brand-logo-text">Readify</span>
        </Link>

        <h1 className="auth-layout__brand-headline">
          Thư viện ebook của bạn trong một tài khoản
        </h1>

        <p className="auth-layout__brand-quote">
          Đăng nhập để mua sách, quản lý thư viện cá nhân, đọc online và tải
          các file ebook đã sở hữu.
        </p>

        <div className="auth-layout__brand-stats">
          <div className="auth-layout__brand-stat">
            <span className="auth-layout__brand-stat-value">PDF</span>
            <span className="auth-layout__brand-stat-label">Tải file</span>
          </div>
          <div className="auth-layout__brand-stat">
            <span className="auth-layout__brand-stat-value">EPUB</span>
            <span className="auth-layout__brand-stat-label">Đọc ebook</span>
          </div>
          <div className="auth-layout__brand-stat">
            <span className="auth-layout__brand-stat-value">MOBI</span>
            <span className="auth-layout__brand-stat-label">Lưu trữ</span>
          </div>
        </div>
      </div>

      {/* Form panel – Outlet renders Login or Register page */}
      <div className="auth-layout__form-panel">
        <div className="auth-layout__form-wrap">
          <Outlet />
        </div>
      </div>
    </div>
  )
}
