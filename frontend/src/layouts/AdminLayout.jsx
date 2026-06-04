import { Outlet, NavLink, Link } from 'react-router-dom'
import './layouts.css'

const SIDEBAR_SECTIONS = [
  {
    title: 'Tổng quan',
    links: [
      { to: '/dashboard',          icon: '📊', label: 'Dashboard' },
      { to: '/library',            icon: '📚', label: 'Thư viện' },
      { to: '/orders',             icon: '📦', label: 'Đơn hàng' },
    ],
  },
  {
    title: 'Tài khoản',
    links: [
      { to: '/profile',            icon: '👤', label: 'Hồ sơ' },
      { to: '/settings',           icon: '⚙️', label: 'Cài đặt' },
      { to: '/pricing',            icon: '💎', label: 'Nâng cấp Premium' },
    ],
  },
]

/**
 * AdminLayout – layout sidebar cho dashboard / trang tài khoản.
 * Cấu trúc: Sidebar (fixed) + Topbar + main content (Outlet)
 */
export default function AdminLayout({ pageTitle = 'Dashboard' }) {
  return (
    <div className="admin-layout">
      {/* Sidebar */}
      <aside className="admin-layout__sidebar" aria-label="Sidebar điều hướng">
        <Link to="/" className="admin-layout__sidebar-logo">
          <div className="admin-layout__sidebar-logo-icon">📖</div>
          <span className="admin-layout__sidebar-logo-text">BookVerse</span>
        </Link>

        <nav className="admin-layout__sidebar-nav">
          {SIDEBAR_SECTIONS.map((section) => (
            <div key={section.title}>
              <p className="admin-layout__sidebar-section-title">{section.title}</p>
              {section.links.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  end={link.to === '/dashboard'}
                  className={({ isActive }) =>
                    `admin-layout__sidebar-link${isActive ? ' admin-layout__sidebar-link--active' : ''}`
                  }
                >
                  <span className="admin-layout__sidebar-link-icon">{link.icon}</span>
                  {link.label}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        {/* User info at bottom */}
        <div className="admin-layout__sidebar-footer">
          <div className="admin-layout__sidebar-user">
            <div className="admin-layout__sidebar-avatar">BV</div>
            <div className="admin-layout__sidebar-user-info">
              <div className="admin-layout__sidebar-username">Người dùng</div>
              <div className="admin-layout__sidebar-role">Thành viên</div>
            </div>
          </div>
        </div>
      </aside>

      {/* Content area */}
      <div className="admin-layout__content">
        {/* Top bar */}
        <header className="admin-layout__topbar">
          <h1 className="admin-layout__page-title">{pageTitle}</h1>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <Link to="/cart" className="btn btn-ghost" style={{ padding: '6px 14px', fontSize: '0.82rem' }}>
              🛒 Giỏ hàng
            </Link>
            <Link to="/" className="btn btn-outline-accent" style={{ padding: '6px 14px', fontSize: '0.82rem' }}>
              ← Về trang chủ
            </Link>
          </div>
        </header>

        {/* Page content */}
        <main className="admin-layout__main" id="main-content">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
