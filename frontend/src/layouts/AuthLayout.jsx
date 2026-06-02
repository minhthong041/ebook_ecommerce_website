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
          <div className="auth-layout__brand-logo-icon">📖</div>
          <span className="auth-layout__brand-logo-text">BookVerse</span>
        </Link>

        <h1 className="auth-layout__brand-headline">
          Kho ebook khổng lồ trong lòng bàn tay bạn
        </h1>

        <p className="auth-layout__brand-quote">
          Tham gia cùng hàng triệu độc giả. Đọc không giới hạn, tải về đọc offline,
          và khám phá thế giới tri thức chỉ với một tài khoản duy nhất.
        </p>

        <div className="auth-layout__brand-stats">
          <div className="auth-layout__brand-stat">
            <span className="auth-layout__brand-stat-value">50K+</span>
            <span className="auth-layout__brand-stat-label">Đầu sách</span>
          </div>
          <div className="auth-layout__brand-stat">
            <span className="auth-layout__brand-stat-value">2M+</span>
            <span className="auth-layout__brand-stat-label">Độc giả</span>
          </div>
          <div className="auth-layout__brand-stat">
            <span className="auth-layout__brand-stat-value">200+</span>
            <span className="auth-layout__brand-stat-label">Thể loại</span>
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
