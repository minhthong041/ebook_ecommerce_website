import { useState, useEffect, useRef } from "react";
import { NavLink, Link, useNavigate } from "react-router-dom";
import CartDrawer from "../CartDrawer/CartDrawer";
import { CART_ITEMS } from "../../data/cartData";
import "./Header.css";

const NAV_LINKS = [
  { to: "/", label: "Trang chủ", icon: "🏠", end: true },
  { to: "/browse", label: "Khám phá", icon: "🔭" },
  { to: "/authors", label: "Tác giả", icon: "✍️" },
  { to: "/library", label: "Thư viện", icon: "📚" },
  { to: "/pricing", label: "Premium", icon: "💎" },
];

const DROPDOWN_ITEMS = [
  { icon: "📚", label: "Thư viện của tôi", to: "/library" },
  { icon: "📦", label: "Đơn hàng", to: "/orders" },
  { icon: "👤", label: "Hồ sơ cá nhân", to: "/profile" },
  { icon: "⚙️", label: "Cài đặt", to: "/settings" },
];

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [cartDrawerOpen, setCartDrawerOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [cartItems, setCartItems] = useState(CART_ITEMS);
  const userMenuRef = useRef(null);
  const navigate = useNavigate();

  // Scroll detection
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close user menu on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Lock body scroll when any drawer is open
  useEffect(() => {
    document.body.style.overflow =
      mobileDrawerOpen || cartDrawerOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileDrawerOpen, cartDrawerOpen]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchValue.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchValue.trim())}`);
      setMobileDrawerOpen(false);
    }
  };

  const handleChangeQuantity = (itemId, newQuantity) => {
    setCartItems((prevItems) =>
      prevItems.map((item) =>
        item.id === itemId
          ? { ...item, quantity: Math.max(1, newQuantity) }
          : item,
      ),
    );
  };

  const handleRemove = (itemId) => {
    setCartItems((prevItems) => prevItems.filter((item) => item.id !== itemId));
  };

  const closeMobileDrawer = () => setMobileDrawerOpen(false);
  const closeCartDrawer = () => setCartDrawerOpen(false);

  return (
    <>
      <header className={`header${scrolled ? " header--scrolled" : ""}`}>
        <div className="header__inner">
          {/* Logo */}
          <Link
            to="/"
            className="header__logo"
            aria-label="BookVerse – Trang chủ"
          >
            <div className="header__logo-icon" aria-hidden="true">
              📖
            </div>
            <span className="header__logo-text">BookVerse</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="header__nav" aria-label="Điều hướng chính">
            {NAV_LINKS.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                className={({ isActive }) =>
                  `header__nav-link${isActive ? " header__nav-link--active" : ""}`
                }
              >
                {link.label}
              </NavLink>
            ))}
          </nav>

          {/* Search Bar */}
          <form
            className="header__search"
            onSubmit={handleSearch}
            role="search"
          >
            <span className="header__search-icon" aria-hidden="true">
              🔍
            </span>
            <input
              id="header-search"
              type="search"
              className="header__search-input"
              placeholder="Tìm ebook, tác giả..."
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              aria-label="Tìm kiếm ebook"
            />
          </form>

          {/* Action Icons */}
          <div className="header__actions">
            {/* Cart */}
            <button
              type="button"
              className="header__icon-btn"
              aria-label="Mở giỏ hàng"
              aria-expanded={cartDrawerOpen}
              onClick={() => setCartDrawerOpen((value) => !value)}
            >
              🛒
              <span
                className="badge"
                aria-label={`${cartItems.reduce((sum, item) => sum + item.quantity, 0)} sản phẩm trong giỏ`}
              >
                {cartItems.reduce((sum, item) => sum + item.quantity, 0)}
              </span>
            </button>

            {/* User dropdown */}
            <div
              className={`header__user${userMenuOpen ? " header__user--open" : ""}`}
              ref={userMenuRef}
            >
              <button
                type="button"
                className="header__avatar-btn"
                onClick={() => setUserMenuOpen((v) => !v)}
                aria-haspopup="true"
                aria-expanded={userMenuOpen}
                id="user-menu-btn"
              >
                <div className="header__avatar" aria-hidden="true">
                  BV
                </div>
                <span className="header__avatar-name">Người dùng</span>
                <span className="header__avatar-caret" aria-hidden="true">
                  ▼
                </span>
              </button>

              {userMenuOpen && (
                <div
                  className="header__dropdown"
                  role="menu"
                  aria-labelledby="user-menu-btn"
                >
                  {DROPDOWN_ITEMS.map((item) => (
                    <Link
                      key={item.to}
                      to={item.to}
                      className="header__dropdown-item"
                      role="menuitem"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      <span className="header__dropdown-icon">{item.icon}</span>
                      {item.label}
                    </Link>
                  ))}
                  <div className="header__dropdown-divider" />
                  <button
                    type="button"
                    className="header__dropdown-item header__dropdown-item--danger"
                    role="menuitem"
                    onClick={() => setUserMenuOpen(false)}
                  >
                    <span className="header__dropdown-icon">🚪</span>
                    Đăng xuất
                  </button>
                </div>
              )}
            </div>

            {/* Premium CTA */}
            <Link to="/pricing" className="btn btn-primary header__premium-btn">
              ✨ Premium
            </Link>

            {/* Hamburger */}
            <button
              type="button"
              className={`header__hamburger${mobileDrawerOpen ? " header__hamburger--open" : ""}`}
              onClick={() => setMobileDrawerOpen((v) => !v)}
              aria-label={mobileDrawerOpen ? "Đóng menu" : "Mở menu"}
              aria-expanded={mobileDrawerOpen}
            >
              <span className="header__hamburger-line" />
              <span className="header__hamburger-line" />
              <span className="header__hamburger-line" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Drawer Overlay */}
      {mobileDrawerOpen && (
        <div
          className="header__drawer-overlay"
          onClick={closeMobileDrawer}
          aria-hidden="true"
        />
      )}

      <CartDrawer
        isOpen={cartDrawerOpen}
        items={cartItems}
        onClose={closeCartDrawer}
        onChangeQuantity={handleChangeQuantity}
        onRemove={handleRemove}
      />

      {/* Mobile Drawer */}
      <aside
        className={`header__drawer${mobileDrawerOpen ? " header__drawer--open" : ""}`}
        aria-label="Menu điều hướng"
        aria-hidden={!mobileDrawerOpen}
      >
        <div className="header__drawer-header">
          <Link to="/" className="header__logo" onClick={closeMobileDrawer}>
            <div className="header__logo-icon">📖</div>
            <span className="header__logo-text">BookVerse</span>
          </Link>
          <button
            type="button"
            className="header__drawer-close"
            onClick={closeMobileDrawer}
            aria-label="Đóng menu"
          >
            ✕
          </button>
        </div>

        {/* Drawer Search */}
        <form
          className="header__drawer-search"
          onSubmit={handleSearch}
          role="search"
        >
          <span className="header__drawer-search-icon" aria-hidden="true">
            🔍
          </span>
          <input
            id="drawer-search"
            type="search"
            className="header__drawer-search-input"
            placeholder="Tìm ebook, tác giả..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            aria-label="Tìm kiếm ebook (mobile)"
          />
        </form>

        {/* Drawer Nav */}
        <nav
          className="header__drawer-nav"
          aria-label="Điều hướng chính (mobile)"
        >
          {NAV_LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) =>
                `header__drawer-nav-link${isActive ? " header__drawer-nav-link--active" : ""}`
              }
              onClick={closeMobileDrawer}
            >
              <span className="header__drawer-nav-icon">{link.icon}</span>
              {link.label}
            </NavLink>
          ))}
        </nav>

        {/* Drawer Footer */}
        <div className="header__drawer-footer">
          <Link
            to="/cart"
            className="btn btn-ghost"
            style={{ justifyContent: "center" }}
            onClick={closeMobileDrawer}
          >
            🛒 Giỏ hàng (
            {cartItems.reduce((sum, item) => sum + item.quantity, 0)})
          </Link>
          <Link
            to="/pricing"
            className="btn btn-primary"
            style={{ justifyContent: "center" }}
            onClick={closeMobileDrawer}
          >
            ✨ Nâng lên Premium
          </Link>
        </div>
      </aside>
    </>
  );
}
