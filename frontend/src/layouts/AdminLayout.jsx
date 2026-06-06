import { useContext } from 'react'
import { Outlet, NavLink, Link, useLocation, useNavigate } from 'react-router-dom'
import { AuthContext } from '../context/AuthContext'
import { usePreferences } from '../context/usePreferences'
import './layouts.css'

const PAGE_TITLES = {
  '/dashboard': 'app.dashboard',
  '/library': 'app.library',
  '/wishlist': 'app.wishlist',
  '/orders': 'app.orders',
  '/staff/orders': 'app.manageInvoices',
  '/staff/books': 'app.manageBooks',
  '/staff/books/upload': 'app.uploadBook',
  '/staff/reviews': 'app.manageReviews',
  '/admin/categories': 'app.manageCategories',
  '/admin/promotions': 'app.managePromotions',
  '/admin/users': 'app.manageUsers',
  '/profile': 'app.profile',
  '/account': 'app.profile',
  '/settings': 'app.settings',
}

const SIDEBAR_SECTIONS = [
  {
    titleKey: 'app.overview',
    links: [
      { to: '/dashboard',          icon: '📊', labelKey: 'app.dashboard' },
      { to: '/library',            icon: '📚', labelKey: 'app.library' },
      { to: '/wishlist',           icon: '❤', labelKey: 'app.wishlist' },
      { to: '/orders',             icon: '📦', labelKey: 'app.orders' },
    ],
  },
  {
    titleKey: 'app.admin',
    requiresCatalogStaff: true,
    links: [
      { to: '/staff/orders',       icon: '🧾', labelKey: 'app.manageInvoices' },
      { to: '/staff/books',        icon: '📘', labelKey: 'app.manageBooks' },
      { to: '/staff/reviews',      icon: '⭐', labelKey: 'app.manageReviews' },
      { to: '/admin/categories',   icon: '🗂️', labelKey: 'app.manageCategories', requiresAdmin: true },
      { to: '/admin/promotions',   icon: '🏷️', labelKey: 'app.managePromotions', requiresAdmin: true },
      { to: '/admin/users',        icon: '👥', labelKey: 'app.manageUsers', requiresAdmin: true },
    ],
  },
  {
    titleKey: 'app.account',
    links: [
      { to: '/profile',            icon: '👤', labelKey: 'app.profile' },
      { to: '/settings',           icon: '⚙️', labelKey: 'app.settings' },
      { to: '/pricing',            icon: '💎', labelKey: 'app.premium' },
      { action: 'logout',          icon: '🚪', labelKey: 'app.logout', danger: true },
    ],
  },
]

function getAvatarUrl(user) {
  if (!user?.avatar_url) {
    return ''
  }

  if (typeof user.avatar_url === 'string') {
    return user.avatar_url
  }

  return user.avatar_url.url || ''
}

/**
 * AdminLayout – layout sidebar cho dashboard / trang tài khoản.
 * Cấu trúc: Sidebar (fixed) + Topbar + main content (Outlet)
 */
export default function AdminLayout({ pageTitle = 'Dashboard' }) {
  const { user, logout } = useContext(AuthContext)
  const { t } = usePreferences()
  const navigate = useNavigate()
  const location = useLocation()
  const currentPageTitle = PAGE_TITLES[location.pathname] ? t(PAGE_TITLES[location.pathname]) : pageTitle
  const displayName = user?.full_name || user?.username || 'Người dùng'
  const avatarUrl = getAvatarUrl(user)
  const roleLabel = user?.role || (user?.is_superuser ? 'Admin' : user?.is_staff ? 'Nhân viên' : 'Thành viên')
  const normalizedRole = (user?.role || '').trim().toLowerCase()
  const canManageCatalog = Boolean(
    user?.is_superuser ||
      user?.is_staff ||
      normalizedRole === 'admin' ||
      normalizedRole === 'employee',
  )
  const canManageSystem = Boolean(user?.is_superuser || normalizedRole === 'admin')
  const initials = displayName
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  const handleLogout = async () => {
    await logout()
    navigate('/', { replace: true })
  }

  return (
    <div className="admin-layout">
      {/* Sidebar */}
      <aside className="admin-layout__sidebar" aria-label="Sidebar điều hướng">
        <Link to="/" className="admin-layout__sidebar-logo">
          <div className="admin-layout__sidebar-logo-icon">
            <img src="/logo.svg" alt="" className="admin-layout__sidebar-logo-img" />
          </div>
          <span className="admin-layout__sidebar-logo-text">Readify</span>
        </Link>

        <nav className="admin-layout__sidebar-nav">
          {SIDEBAR_SECTIONS.filter((section) => {
            if (section.requiresAdmin) {
              return canManageSystem
            }
            if (section.requiresCatalogStaff) {
              return canManageCatalog
            }
            return true
          }).map((section) => (
            <div key={section.titleKey}>
              <p className="admin-layout__sidebar-section-title">{t(section.titleKey)}</p>
              {section.links.filter((link) => {
                if (link.requiresAdmin) {
                  return canManageSystem
                }
                return true
              }).map((link) => {
                if (link.action === 'logout') {
                  return (
                    <button
                      key={link.action}
                      type="button"
                      className="admin-layout__sidebar-link admin-layout__sidebar-link--button admin-layout__sidebar-link--danger"
                      onClick={handleLogout}
                    >
                      <span className="admin-layout__sidebar-link-icon">{link.icon}</span>
                      {t(link.labelKey)}
                    </button>
                  )
                }

                return (
                  <NavLink
                    key={link.to}
                    to={link.to}
                    end={link.to === '/dashboard'}
                    className={({ isActive }) =>
                      `admin-layout__sidebar-link${isActive ? ' admin-layout__sidebar-link--active' : ''}`
                    }
                  >
                    <span className="admin-layout__sidebar-link-icon">{link.icon}</span>
                    {t(link.labelKey)}
                  </NavLink>
                )
              })}
            </div>
          ))}
        </nav>

        {/* User info at bottom */}
        <div className="admin-layout__sidebar-footer">
          <div className="admin-layout__sidebar-user">
            <div className="admin-layout__sidebar-avatar">
              {avatarUrl ? (
                <img src={avatarUrl} alt="" className="admin-layout__sidebar-avatar-img" />
              ) : (
                initials
              )}
            </div>
            <div className="admin-layout__sidebar-user-info">
              <div className="admin-layout__sidebar-username">{displayName}</div>
              <div className="admin-layout__sidebar-role">{roleLabel}</div>
            </div>
          </div>
        </div>
      </aside>

      {/* Content area */}
      <div className="admin-layout__content">
        {/* Top bar */}
        <header className="admin-layout__topbar">
          <h1 className="admin-layout__page-title">{currentPageTitle}</h1>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <Link to="/cart" className="btn btn-ghost" style={{ padding: '6px 14px', fontSize: '0.82rem' }}>
              🛒 {t('app.cart')}
            </Link>
            <Link to="/" className="btn btn-outline-accent" style={{ padding: '6px 14px', fontSize: '0.82rem' }}>
              ← {t('app.backHome')}
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
