import { NavLink } from "react-router-dom";
import "./Sidebar.css";

const SIDEBAR_LINKS = [
  { to: "/browse", label: "Khám phá", icon: "🔍" },
  { to: "/library", label: "Thư viện", icon: "📚" },
  { to: "/cart", label: "Giỏ hàng", icon: "🛒" },
  { to: "/pricing", label: "Premium", icon: "💎" },
];

export default function Sidebar({ collapsed = false }) {
  return (
    <aside
      className={`sidebar${collapsed ? " sidebar--collapsed" : ""}`}
      aria-label="Thanh chức năng"
    >
      <div className="sidebar__panel">
        <div className="sidebar__header">
          <div>
            <p className="sidebar__eyebrow">Bảng điều khiển</p>
            <h2 className="sidebar__title">Chức năng</h2>
          </div>
          <span className="sidebar__badge">Mới</span>
        </div>

        <nav className="sidebar__nav" aria-label="Chức năng chính">
          {SIDEBAR_LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `sidebar__link${isActive ? " sidebar__link--active" : ""}`
              }
            >
              <span className="sidebar__link-icon" aria-hidden="true">
                {link.icon}
              </span>
              <span>{link.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar__footer">
          <p className="sidebar__footer-title">Gợi ý</p>
          <p className="sidebar__footer-text">
            Giữ menu bằng cách bật sidebar để điều hướng nhanh hơn.
          </p>
        </div>
      </div>
    </aside>
  );
}
