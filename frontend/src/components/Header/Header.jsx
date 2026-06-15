import { useContext, useState, useEffect, useMemo, useRef } from "react";
import { NavLink, Link, useNavigate } from "react-router-dom";
import CartDrawer from "../CartDrawer/CartDrawer";
import { AuthContext } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";
import { usePreferences } from "../../context/usePreferences";
import "./Header.css";

const NAV_LINKS = [
  { to: "/", labelKey: "app.home", icon: "🏠", end: true },
  { to: "/browse", labelKey: "app.browse", icon: "🔭" },
  { to: "/wishlist", labelKey: "app.wishlist", icon: "❤" },
  { to: "/library", labelKey: "app.library", icon: "📚" },
  { to: "/pricing", labelKey: "app.premium", icon: "💎" },
];

const DROPDOWN_ITEMS = [
  { icon: "❤", labelKey: "app.wishlist", to: "/wishlist" },
  { icon: "📚", labelKey: "app.library", to: "/library" },
  { icon: "📦", labelKey: "app.orders", to: "/orders" },
  { icon: "👤", labelKey: "app.personalProfile", to: "/profile" },
  { icon: "⚙️", labelKey: "app.settings", to: "/settings" },
];

function getAvatarUrl(user) {
  if (!user?.avatar_url) {
    return "";
  }

  if (typeof user.avatar_url === "string") {
    return user.avatar_url;
  }

  return user.avatar_url.url || "";
}

export default function Header() {
  const { isAuthenticated, user, logout } = useContext(AuthContext);
  const { t } = usePreferences();
  const {
    items: cartItems,
    itemCount,
    isLoading: isCartLoading,
    removeFromCart,
    selectAllCartItems,
  } = useCart();
  const [scrolled, setScrolled] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [cartDrawerOpen, setCartDrawerOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const userMenuRef = useRef(null);
  const navigate = useNavigate();
  const displayName = user?.full_name || user?.username || "Người dùng";
  const avatarUrl = getAvatarUrl(user);
  const avatarInitials = displayName
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const translatedNavLinks = useMemo(
    () => NAV_LINKS.map((link) => ({ ...link, label: t(link.labelKey) })),
    [t],
  );
  const translatedDropdownItems = useMemo(
    () => DROPDOWN_ITEMS.map((item) => ({ ...item, label: t(item.labelKey) })),
    [t],
  );

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

  const handleRemove = async (itemId) => {
    await removeFromCart(itemId);
  };

  const handleLogout = async () => {
    setUserMenuOpen(false);
    setMobileDrawerOpen(false);
    await logout();
    navigate("/");
  };

  const closeMobileDrawer = () => setMobileDrawerOpen(false);
  const closeCartDrawer = () => setCartDrawerOpen(false);
  const handleCartDrawerCheckout = () => {
    selectAllCartItems();
    closeCartDrawer();
    navigate("/checkout");
  };

  return (
    <>
      <header className={`header${scrolled ? " header--scrolled" : ""}`}>
        <div className="header__inner">
          {/* Logo */}
          <Link
            to="/"
            className="header__logo"
            aria-label="Readify – Trang chủ"
          >
            <div className="header__logo-icon" aria-hidden="true">
              <img src="/logo.svg" alt="" className="header__logo-img" />
            </div>
            <span className="header__logo-text">Readify</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="header__nav" aria-label="Điều hướng chính">
            {translatedNavLinks.map((link) => (
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
              placeholder={t("app.searchPlaceholder")}
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
                aria-label={`${itemCount} sản phẩm trong giỏ`}
              >
                {itemCount}
              </span>
            </button>

            {isAuthenticated ? (
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
                    {avatarUrl ? (
                      <img src={avatarUrl} alt="" className="header__avatar-img" />
                    ) : (
                      avatarInitials
                    )}
                  </div>
                  <span className="header__avatar-name">{displayName}</span>
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
                    {translatedDropdownItems.map((item) => (
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
                      onClick={handleLogout}
                    >
                      <span className="header__dropdown-icon">🚪</span>
                      {t("app.logout")}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="header__auth-actions">
                <Link to="/login" className="btn btn-ghost header__auth-btn">
                  {t("app.login")}
                </Link>
                <Link to="/register" className="btn btn-primary header__auth-btn">
                  {t("app.register")}
                </Link>
              </div>
            )}

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
        isLoading={isCartLoading}
        onClose={closeCartDrawer}
        onRemove={handleRemove}
        onCheckout={handleCartDrawerCheckout}
      />

      {/* Mobile Drawer */}
      <aside
        className={`header__drawer${mobileDrawerOpen ? " header__drawer--open" : ""}`}
        aria-label="Menu điều hướng"
        aria-hidden={!mobileDrawerOpen}
      >
        <div className="header__drawer-header">
          <Link to="/" className="header__logo" onClick={closeMobileDrawer}>
            <div className="header__logo-icon" aria-hidden="true">
              <img src="/logo.svg" alt="" className="header__logo-img" />
            </div>
            <span className="header__logo-text">Readify</span>
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
            placeholder={t("app.searchPlaceholder")}
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
          {translatedNavLinks.map((link) => (
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
            🛒 {t("app.cart")} ({itemCount})
          </Link>
          {isAuthenticated ? (
            <>
              <Link
                to="/profile"
                className="btn btn-primary"
                style={{ justifyContent: "center" }}
                onClick={closeMobileDrawer}
              >
                👤 {t("app.personalProfile")}
              </Link>
              <button
                type="button"
                className="btn btn-ghost"
                style={{ justifyContent: "center" }}
                onClick={handleLogout}
              >
                🚪 {t("app.logout")}
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="btn btn-ghost"
                style={{ justifyContent: "center" }}
                onClick={closeMobileDrawer}
              >
                🔐 {t("app.login")}
              </Link>
              <Link
                to="/register"
                className="btn btn-primary"
                style={{ justifyContent: "center" }}
                onClick={closeMobileDrawer}
              >
                {t("app.register")}
              </Link>
            </>
          )}
        </div>
      </aside>
    </>
  );
}
